import { PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../utils/dynamodb.js';
import { authenticate, authorize } from '../utils/auth-middleware.js';
import { success, error } from '../utils/response.js';
import logger from '../utils/logger.js';
import { parseBody } from '../utils/validators.js';

/**
 * POST /api/elections/{electionId}/vote
 * Cast a vote. DynamoDB composite key (electionId + userId) prevents duplicate votes.
 * Checks election status, eligibility, and candidate validity.
 */
export async function castVote(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    const authzError = authorize(auth.user, ['VOTER']);
    if (authzError) return authzError;

    const { electionId } = event.pathParameters;
    const body = parseBody(event);
    if (!body) return error('Invalid JSON body');

    const { candidateId } = body;

    if (!candidateId) {
      return error('candidateId is required');
    }

    // Verify election exists and check status
    const electionResult = await docClient.send(
      new GetCommand({
        TableName: TABLES.ELECTIONS,
        Key: { electionId },
      })
    );

    if (!electionResult.Item) {
      return error('Election not found', 404);
    }

    const election = electionResult.Item;

    // Check election status — must be 'open'
    if (election.status !== 'open') {
      return error(`This election is currently ${election.status}. Voting is only allowed when the election is open.`);
    }

    // Also check date range
    const now = new Date();
    const start = new Date(election.startDate);
    const end = new Date(election.endDate);

    if (now < start) {
      return error('This election has not started yet');
    }

    if (now > end) {
      return error('This election has ended');
    }

    // Check voter eligibility
    const voterResult = await docClient.send(
      new GetCommand({
        TableName: TABLES.USERS,
        Key: { userId: auth.user.userId },
      })
    );

    if (!voterResult.Item) {
      return error('Voter not found', 404);
    }

    const voter = voterResult.Item;

    if (voter.eligible === false) {
      return error('You are not eligible to vote. Please contact an administrator.');
    }

    // Check election-specific eligibility rules
    if (election.eligibilityRules) {
      const rules = election.eligibilityRules;
      if (rules.year && voter.year && voter.year !== rules.year) {
        return error(`This election is restricted to year ${rules.year} students.`);
      }
      if (rules.program && voter.program && voter.program.toLowerCase() !== rules.program.toLowerCase()) {
        return error(`This election is restricted to ${rules.program} students.`);
      }
    }

    // Verify candidate is valid
    const validCandidate = election.candidates.find((c) => c.id === candidateId);
    if (!validCandidate) {
      return error('Invalid candidate selected');
    }

    // Check if already voted (using conditional put for atomicity)
    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLES.VOTES,
          Item: {
            electionId,
            userId: auth.user.userId,
            candidateId,
            voterName: auth.user.name,
            votedAt: new Date().toISOString(),
          },
          ConditionExpression: 'attribute_not_exists(electionId) AND attribute_not_exists(userId)',
        })
      );
    } catch (condErr) {
      if (condErr.name === 'ConditionalCheckFailedException') {
        return error('You have already voted in this election');
      }
      throw condErr;
    }

    return success({ message: 'Vote cast successfully' }, 201);
  } catch (err) {
    logger.error({ err, action: 'castVote' }, 'CastVote error');
    return error('Internal server error', 500);
  }
}

/**
 * GET /api/elections/{electionId}/results
 * Get aggregated vote counts for an election (for Recharts visualization).
 */
export async function getResults(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    const { electionId } = event.pathParameters;

    // Get election details
    const electionResult = await docClient.send(
      new GetCommand({
        TableName: TABLES.ELECTIONS,
        Key: { electionId },
      })
    );

    if (!electionResult.Item) {
      return error('Election not found', 404);
    }

    const election = electionResult.Item;

    // Get all votes for this election
    const votesResult = await docClient.send(
      new QueryCommand({
        TableName: TABLES.VOTES,
        KeyConditionExpression: 'electionId = :electionId',
        ExpressionAttributeValues: { ':electionId': electionId },
      })
    );

    const votes = votesResult.Items || [];

    // Restrict voters from seeing results before voting unless election is closed
    if (auth.user.role === 'VOTER') {
      const hasVoted = votes.some((v) => v.userId === auth.user.userId);
      if (!hasVoted && election.status !== 'closed') {
        return error('You must vote before viewing results of an active election', 403);
      }
    }

    // Aggregate vote counts per candidate
    const voteCounts = {};
    election.candidates.forEach((c) => {
      voteCounts[c.id] = 0;
    });

    votes.forEach((vote) => {
      if (voteCounts[vote.candidateId] !== undefined) {
        voteCounts[vote.candidateId]++;
      }
    });

    // Format for Recharts
    const results = election.candidates.map((c) => ({
      id: c.id,
      name: c.name,
      votes: voteCounts[c.id] || 0,
    }));

    const totalVotes = votes.length;

    // Check if current user has voted
    const userVote = votes.find((v) => v.userId === auth.user.userId);

    return success({
      election: {
        electionId: election.electionId,
        title: election.title,
        description: election.description,
        startDate: election.startDate,
        endDate: election.endDate,
        status: election.status,
      },
      results,
      totalVotes,
      hasVoted: !!userVote,
      userVote: userVote || null,
    });
  } catch (err) {
    logger.error({ err, action: 'getResults' }, 'GetResults error');
    return error('Internal server error', 500);
  }
}
