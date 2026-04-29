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
import { validatePollTitle, validatePollOptions, validateDateRange, parseBody, sanitize } from '../utils/validators.js';

/**
 * POST /api/polls
 * Create a new poll (Admin / Super Admin only).
 */
export async function createPoll(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    const authzError = authorize(auth.user, ['ADMIN', 'SUPER_ADMIN']);
    if (authzError) return authzError;

    const body = parseBody(event);
    if (!body) return error('Invalid JSON body');

    const { title: rawTitle, options: rawOptions, startDate, endDate } = body;

    // Validate inputs
    const titleResult = validatePollTitle(rawTitle);
    if (!titleResult.valid) return error(titleResult.error);

    const optionsResult = validatePollOptions(rawOptions);
    if (!optionsResult.valid) return error(optionsResult.error);

    const dateResult = validateDateRange(startDate, endDate);
    if (!dateResult.valid) return error(dateResult.error);

    const pollId = uuidv4();
    const formattedOptions = optionsResult.options.map((text, idx) => ({
      id: String(idx + 1),
      text,
    }));

    const poll = {
      pollId,
      title: titleResult.title,
      options: formattedOptions,
      startDate: dateResult.startDate,
      endDate: dateResult.endDate,
      createdBy: auth.user.userId,
      createdByName: auth.user.name,
      createdAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLES.POLLS,
        Item: poll,
      })
    );

    logger.info({ pollId, title: titleResult.title, action: 'createPoll', createdBy: auth.user.userId }, 'Poll created');

    return success({ message: 'Poll created', poll }, 201);
  } catch (err) {
    logger.error({ err, action: 'createPoll' }, 'CreatePoll error');
    return error('Internal server error', 500);
  }
}

/**
 * GET /api/polls
 * List polls. Admins see their own, Super Admins see all, Voters see active only.
 */
export async function getPolls(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    let polls;

    if (auth.user.role === 'SUPER_ADMIN') {
      // Super Admin sees all polls
      const result = await docClient.send(
        new ScanCommand({ TableName: TABLES.POLLS })
      );
      polls = result.Items || [];
    } else if (auth.user.role === 'ADMIN') {
      // Admin sees only their created polls
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLES.POLLS,
          IndexName: 'createdBy-index',
          KeyConditionExpression: 'createdBy = :userId',
          ExpressionAttributeValues: { ':userId': auth.user.userId },
        })
      );
      polls = result.Items || [];
    } else {
      // Voter sees all polls (can filter active on frontend)
      const result = await docClient.send(
        new ScanCommand({ TableName: TABLES.POLLS })
      );
      polls = result.Items || [];
    }

    // Sort by creation date descending
    polls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return success({ polls });
  } catch (err) {
    logger.error({ err, action: 'getPolls' }, 'GetPolls error');
    return error('Internal server error', 500);
  }
}

/**
 * GET /api/polls/{pollId}
 * Get a single poll.
 */
export async function getPoll(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    const { pollId } = event.pathParameters;

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLES.POLLS,
        Key: { pollId },
      })
    );

    if (!result.Item) {
      return error('Poll not found', 404);
    }

    // Check if current user has voted
    const voteResult = await docClient.send(
      new GetCommand({
        TableName: TABLES.VOTES,
        Key: { pollId, userId: auth.user.userId },
      })
    );

    return success({
      poll: result.Item,
      hasVoted: !!voteResult.Item,
      userVote: voteResult.Item || null,
    });
  } catch (err) {
    logger.error({ err, pollId, action: 'getPoll' }, 'GetPoll error');
    return error('Internal server error', 500);
  }
}

/**
 * PUT /api/polls/{pollId}
 * Edit a poll (Admin who created it, or Super Admin).
 */
export async function updatePoll(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    const authzError = authorize(auth.user, ['ADMIN', 'SUPER_ADMIN']);
    if (authzError) return authzError;

    const { pollId } = event.pathParameters;
    const body = parseBody(event);
    if (!body) return error('Invalid JSON body');

    const { title, options, startDate, endDate } = body;

    // Get existing poll
    const existing = await docClient.send(
      new GetCommand({
        TableName: TABLES.POLLS,
        Key: { pollId },
      })
    );

    if (!existing.Item) {
      return error('Poll not found', 404);
    }

    // Only the creator or super admin can edit
    if (
      auth.user.role !== 'SUPER_ADMIN' &&
      existing.Item.createdBy !== auth.user.userId
    ) {
      return error('You can only edit polls you created', 403);
    }

    const updateExpressions = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (title) {
      const titleResult = validatePollTitle(title);
      if (!titleResult.valid) return error(titleResult.error);
      updateExpressions.push('#title = :title');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = titleResult.title;
    }

    if (options && Array.isArray(options)) {
      const optionsResult = validatePollOptions(options);
      if (!optionsResult.valid) return error(optionsResult.error);
      const formattedOptions = optionsResult.options.map((text, idx) => ({
        id: String(idx + 1),
        text,
      }));
      updateExpressions.push('#options = :options');
      expressionAttributeNames['#options'] = 'options';
      expressionAttributeValues[':options'] = formattedOptions;
    }

    if (startDate) {
      updateExpressions.push('startDate = :startDate');
      expressionAttributeValues[':startDate'] = startDate;
    }

    if (endDate) {
      updateExpressions.push('endDate = :endDate');
      expressionAttributeValues[':endDate'] = endDate;
    }

    if (updateExpressions.length === 0) {
      return error('No fields to update');
    }

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    await docClient.send(
      new UpdateCommand({
        TableName: TABLES.POLLS,
        Key: { pollId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames:
          Object.keys(expressionAttributeNames).length > 0
            ? expressionAttributeNames
            : undefined,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    return success({ message: 'Poll updated' });
  } catch (err) {
    logger.error({ err, pollId, action: 'updatePoll' }, 'UpdatePoll error');
    return error('Internal server error', 500);
  }
}

/**
 * DELETE /api/polls/{pollId}
 * Delete a poll and its votes (Admin who created it, or Super Admin).
 */
export async function deletePoll(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    const authzError = authorize(auth.user, ['ADMIN', 'SUPER_ADMIN']);
    if (authzError) return authzError;

    const { pollId } = event.pathParameters;

    // Get existing poll
    const existing = await docClient.send(
      new GetCommand({
        TableName: TABLES.POLLS,
        Key: { pollId },
      })
    );

    if (!existing.Item) {
      return error('Poll not found', 404);
    }

    // Only the creator or super admin can delete
    if (
      auth.user.role !== 'SUPER_ADMIN' &&
      existing.Item.createdBy !== auth.user.userId
    ) {
      return error('You can only delete polls you created', 403);
    }

    // Delete all votes for this poll
    const votesResult = await docClient.send(
      new QueryCommand({
        TableName: TABLES.VOTES,
        KeyConditionExpression: 'pollId = :pollId',
        ExpressionAttributeValues: { ':pollId': pollId },
      })
    );

    if (votesResult.Items && votesResult.Items.length > 0) {
      // Batch delete votes (max 25 per batch)
      const batches = [];
      for (let i = 0; i < votesResult.Items.length; i += 25) {
        const batch = votesResult.Items.slice(i, i + 25).map((vote) => ({
          DeleteRequest: {
            Key: { pollId: vote.pollId, userId: vote.userId },
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

    // Delete the poll
    await docClient.send(
      new DeleteCommand({
        TableName: TABLES.POLLS,
        Key: { pollId },
      })
    );

    return success({ message: 'Poll and associated votes deleted' });
  } catch (err) {
    logger.error({ err, pollId, action: 'deletePoll' }, 'DeletePoll error');
    return error('Internal server error', 500);
  }
}
