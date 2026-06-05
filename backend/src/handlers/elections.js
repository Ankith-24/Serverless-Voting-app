import {
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLES } from '../utils/dynamodb.js';
import { authenticate, authorize } from '../utils/auth-middleware.js';
import { success, error } from '../utils/response.js';
import logger from '../utils/logger.js';
import { validateElectionTitle, validateCandidates, validateDescription, validateDateRange, parseBody, sanitize } from '../utils/validators.js';

/**
 * POST /api/elections
 * Create a new election (Admin / Super Admin only).
 */
export async function createElection(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    const authzError = authorize(auth.user, ['ADMIN', 'SUPER_ADMIN']);
    if (authzError) return authzError;

    const body = parseBody(event);
    if (!body) return error('Invalid JSON body');

    const { title: rawTitle, description: rawDescription, candidates: rawCandidates, startDate, endDate, eligibilityRules } = body;

    // Validate inputs
    const titleResult = validateElectionTitle(rawTitle);
    if (!titleResult.valid) return error(titleResult.error);

    const descResult = validateDescription(rawDescription);
    if (!descResult.valid) return error(descResult.error);

    const candidatesResult = validateCandidates(rawCandidates);
    if (!candidatesResult.valid) return error(candidatesResult.error);

    const dateResult = validateDateRange(startDate, endDate);
    if (!dateResult.valid) return error(dateResult.error);

    const electionId = uuidv4();
    const formattedCandidates = candidatesResult.candidates.map((c) => ({
      id: uuidv4(),
      name: c.name,
      bio: c.bio || '',
      party: c.party || '',
      position: c.position || '',
    }));

    // Validate and sanitize eligibility rules
    const cleanedRules = {};
    if (eligibilityRules && typeof eligibilityRules === 'object') {
      if (eligibilityRules.year) cleanedRules.year = sanitize(String(eligibilityRules.year));
      if (eligibilityRules.program) cleanedRules.program = sanitize(String(eligibilityRules.program));
    }

    const election = {
      electionId,
      title: titleResult.title,
      description: descResult.description,
      candidates: formattedCandidates,
      startDate: dateResult.startDate,
      endDate: dateResult.endDate,
      status: 'draft',
      eligibilityRules: Object.keys(cleanedRules).length > 0 ? cleanedRules : undefined,
      createdBy: auth.user.userId,
      createdByName: auth.user.name,
      createdAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLES.ELECTIONS,
        Item: election,
      })
    );

    logger.info({ electionId, title: titleResult.title, action: 'createElection', createdBy: auth.user.userId }, 'Election created');

    return success({ message: 'Election created', election }, 201);
  } catch (err) {
    logger.error({ err, action: 'createElection' }, 'CreateElection error');
    return error('Internal server error', 500);
  }
}

/**
 * GET /api/elections
 * List elections. Admins see their own, Super Admins see all, Voters see all (filter on frontend).
 */
export async function getElections(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    let elections;

    if (auth.user.role === 'SUPER_ADMIN') {
      // Super Admin sees all elections
      const result = await docClient.send(
        new ScanCommand({ TableName: TABLES.ELECTIONS })
      );
      elections = result.Items || [];
    } else if (auth.user.role === 'ADMIN') {
      // Admin sees only their created elections
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLES.ELECTIONS,
          IndexName: 'createdBy-index',
          KeyConditionExpression: 'createdBy = :userId',
          ExpressionAttributeValues: { ':userId': auth.user.userId },
        })
      );
      elections = result.Items || [];
    } else {
      // Voter sees all elections (can filter on frontend)
      const result = await docClient.send(
        new ScanCommand({ TableName: TABLES.ELECTIONS })
      );
      elections = result.Items || [];
    }

    // Sort by creation date descending
    elections.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return success({ elections });
  } catch (err) {
    logger.error({ err, action: 'getElections' }, 'GetElections error');
    return error('Internal server error', 500);
  }
}

/**
 * GET /api/elections/{electionId}
 * Get a single election.
 */
export async function getElection(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    const { electionId } = event.pathParameters;

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLES.ELECTIONS,
        Key: { electionId },
      })
    );

    if (!result.Item) {
      return error('Election not found', 404);
    }

    // Check if current user has voted
    const voteResult = await docClient.send(
      new GetCommand({
        TableName: TABLES.VOTES,
        Key: { electionId, userId: auth.user.userId },
      })
    );

    return success({
      election: result.Item,
      hasVoted: !!voteResult.Item,
      userVote: voteResult.Item || null,
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err, action: 'getElection' }, 'GetElection error');
    return error('Internal server error', 500);
  }
}

/**
 * PUT /api/elections/{electionId}
 * Edit an election (Admin who created it, or Super Admin).
 */
export async function updateElection(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    const authzError = authorize(auth.user, ['ADMIN', 'SUPER_ADMIN']);
    if (authzError) return authzError;

    const { electionId } = event.pathParameters;
    const body = parseBody(event);
    if (!body) return error('Invalid JSON body');

    const { title, description, candidates, startDate, endDate, eligibilityRules } = body;

    // Get existing election
    const existing = await docClient.send(
      new GetCommand({
        TableName: TABLES.ELECTIONS,
        Key: { electionId },
      })
    );

    if (!existing.Item) {
      return error('Election not found', 404);
    }

    // Only the creator or super admin can edit
    if (
      auth.user.role !== 'SUPER_ADMIN' &&
      existing.Item.createdBy !== auth.user.userId
    ) {
      return error('You can only edit elections you created', 403);
    }

    const updateExpressions = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (title) {
      const titleResult = validateElectionTitle(title);
      if (!titleResult.valid) return error(titleResult.error);
      updateExpressions.push('#title = :title');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = titleResult.title;
    }

    if (description !== undefined) {
      const descResult = validateDescription(description);
      if (!descResult.valid) return error(descResult.error);
      updateExpressions.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = descResult.description;
    }

    if (candidates && Array.isArray(candidates)) {
      const candidatesResult = validateCandidates(candidates);
      if (!candidatesResult.valid) return error(candidatesResult.error);
      const formattedCandidates = candidatesResult.candidates.map((c) => ({
        id: uuidv4(),
        name: c.name,
        bio: c.bio || '',
        party: c.party || '',
        position: c.position || '',
      }));
      updateExpressions.push('candidates = :candidates');
      expressionAttributeValues[':candidates'] = formattedCandidates;
    }

    if (startDate) {
      updateExpressions.push('startDate = :startDate');
      expressionAttributeValues[':startDate'] = startDate;
    }

    if (endDate) {
      updateExpressions.push('endDate = :endDate');
      expressionAttributeValues[':endDate'] = endDate;
    }

    if (eligibilityRules !== undefined) {
      const cleanedRules = {};
      if (eligibilityRules && typeof eligibilityRules === 'object') {
        if (eligibilityRules.year) cleanedRules.year = sanitize(String(eligibilityRules.year));
        if (eligibilityRules.program) cleanedRules.program = sanitize(String(eligibilityRules.program));
      }
      updateExpressions.push('eligibilityRules = :eligibilityRules');
      expressionAttributeValues[':eligibilityRules'] = Object.keys(cleanedRules).length > 0 ? cleanedRules : null;
    }

    if (updateExpressions.length === 0) {
      return error('No fields to update');
    }

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    await docClient.send(
      new UpdateCommand({
        TableName: TABLES.ELECTIONS,
        Key: { electionId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames:
          Object.keys(expressionAttributeNames).length > 0
            ? expressionAttributeNames
            : undefined,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    return success({ message: 'Election updated' });
  } catch (err) {
    logger.error({ err, action: 'updateElection' }, 'UpdateElection error');
    return error('Internal server error', 500);
  }
}

/**
 * PUT /api/elections/{electionId}/status
 * Update election status: draft -> open -> closed (Admin who created it, or Super Admin).
 */
export async function updateElectionStatus(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    const authzError = authorize(auth.user, ['ADMIN', 'SUPER_ADMIN']);
    if (authzError) return authzError;

    const { electionId } = event.pathParameters;
    const body = parseBody(event);
    if (!body) return error('Invalid JSON body');

    const { status } = body;
    const validStatuses = ['draft', 'open', 'closed'];
    if (!status || !validStatuses.includes(status)) {
      return error('Status must be one of: draft, open, closed');
    }

    // Get existing election
    const existing = await docClient.send(
      new GetCommand({
        TableName: TABLES.ELECTIONS,
        Key: { electionId },
      })
    );

    if (!existing.Item) {
      return error('Election not found', 404);
    }

    // Only the creator or super admin can change status
    if (
      auth.user.role !== 'SUPER_ADMIN' &&
      existing.Item.createdBy !== auth.user.userId
    ) {
      return error('You can only manage elections you created', 403);
    }

    await docClient.send(
      new UpdateCommand({
        TableName: TABLES.ELECTIONS,
        Key: { electionId },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': status,
          ':updatedAt': new Date().toISOString(),
        },
      })
    );

    logger.info({ electionId, status, action: 'updateElectionStatus', updatedBy: auth.user.userId }, 'Election status updated');

    return success({ message: `Election status updated to ${status}` });
  } catch (err) {
    logger.error({ err, action: 'updateElectionStatus' }, 'UpdateElectionStatus error');
    return error('Internal server error', 500);
  }
}

/**
 * DELETE /api/elections/{electionId}
 * Delete an election and its votes (Admin who created it, or Super Admin).
 */
export async function deleteElection(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    const authzError = authorize(auth.user, ['ADMIN', 'SUPER_ADMIN']);
    if (authzError) return authzError;

    const { electionId } = event.pathParameters;

    // Get existing election
    const existing = await docClient.send(
      new GetCommand({
        TableName: TABLES.ELECTIONS,
        Key: { electionId },
      })
    );

    if (!existing.Item) {
      return error('Election not found', 404);
    }

    // Only the creator or super admin can delete
    if (
      auth.user.role !== 'SUPER_ADMIN' &&
      existing.Item.createdBy !== auth.user.userId
    ) {
      return error('You can only delete elections you created', 403);
    }

    // Delete all votes for this election
    const votesResult = await docClient.send(
      new QueryCommand({
        TableName: TABLES.VOTES,
        KeyConditionExpression: 'electionId = :electionId',
        ExpressionAttributeValues: { ':electionId': electionId },
      })
    );

    if (votesResult.Items && votesResult.Items.length > 0) {
      // Batch delete votes (max 25 per batch)
      const batches = [];
      for (let i = 0; i < votesResult.Items.length; i += 25) {
        const batch = votesResult.Items.slice(i, i + 25).map((vote) => ({
          DeleteRequest: {
            Key: { electionId: vote.electionId, userId: vote.userId },
          },
        }));
        batches.push(batch);
      }

      for (const batch of batches) {
        await docClient.send(
          new BatchWriteCommand({
            RequestItems: { [TABLES.VOTES]: batch },
          })
        );
      }
    }

    // Delete the election
    await docClient.send(
      new DeleteCommand({
        TableName: TABLES.ELECTIONS,
        Key: { electionId },
      })
    );

    return success({ message: 'Election and associated votes deleted' });
  } catch (err) {
    logger.error({ err, action: 'deleteElection' }, 'DeleteElection error');
    return error('Internal server error', 500);
  }
}
