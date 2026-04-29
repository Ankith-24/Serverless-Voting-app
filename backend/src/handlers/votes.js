import { PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../utils/dynamodb.js';
import { authenticate, authorize } from '../utils/auth-middleware.js';
import { success, error } from '../utils/response.js';
import logger from '../utils/logger.js';
import { parseBody } from '../utils/validators.js';

/**
 * POST /api/polls/{pollId}/vote
 * Cast a vote. DynamoDB composite key (pollId + userId) prevents duplicate votes.
 */
export async function castVote(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    const authzError = authorize(auth.user, ['VOTER']);
    if (authzError) return authzError;

    const { pollId } = event.pathParameters;
    const body = parseBody(event);
    if (!body) return error('Invalid JSON body');

    const { selectedOptionId } = body;

    if (!selectedOptionId) {
      return error('selectedOptionId is required');
    }

    // Verify poll exists and is active
    const pollResult = await docClient.send(
      new GetCommand({
        TableName: TABLES.POLLS,
        Key: { pollId },
      })
    );

    if (!pollResult.Item) {
      return error('Poll not found', 404);
    }

    const poll = pollResult.Item;
    const now = new Date();
    const start = new Date(poll.startDate);
    const end = new Date(poll.endDate);

    if (now < start) {
      return error('This poll has not started yet');
    }

    if (now > end) {
      return error('This poll has ended');
    }

    // Verify option is valid
    const validOption = poll.options.find((o) => o.id === selectedOptionId);
    if (!validOption) {
      return error('Invalid option selected');
    }

    // Check if already voted (using conditional put)
    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLES.VOTES,
          Item: {
            pollId,
            userId: auth.user.userId,
            selectedOptionId,
            voterName: auth.user.name,
            votedAt: new Date().toISOString(),
          },
          ConditionExpression: 'attribute_not_exists(pollId) AND attribute_not_exists(userId)',
        })
      );
    } catch (condErr) {
      if (condErr.name === 'ConditionalCheckFailedException') {
        return error('You have already voted on this poll');
      }
      throw condErr;
    }

    return success({ message: 'Vote cast successfully' }, 201);
  } catch (err) {
    logger.error({ err, pollId, action: 'castVote' }, 'CastVote error');
    return error('Internal server error', 500);
  }
}

/**
 * GET /api/polls/{pollId}/results
 * Get aggregated vote counts for a poll (for Recharts visualization).
 */
export async function getResults(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    const { pollId } = event.pathParameters;

    // Get poll details
    const pollResult = await docClient.send(
      new GetCommand({
        TableName: TABLES.POLLS,
        Key: { pollId },
      })
    );

    if (!pollResult.Item) {
      return error('Poll not found', 404);
    }

    const poll = pollResult.Item;

    // Get all votes for this poll
    const votesResult = await docClient.send(
      new QueryCommand({
        TableName: TABLES.VOTES,
        KeyConditionExpression: 'pollId = :pollId',
        ExpressionAttributeValues: { ':pollId': pollId },
      })
    );

    const votes = votesResult.Items || [];

    // Aggregate vote counts per option
    const voteCounts = {};
    poll.options.forEach((opt) => {
      voteCounts[opt.id] = 0;
    });

    votes.forEach((vote) => {
      if (voteCounts[vote.selectedOptionId] !== undefined) {
        voteCounts[vote.selectedOptionId]++;
      }
    });

    // Format for Recharts
    const results = poll.options.map((opt) => ({
      id: opt.id,
      name: opt.text,
      votes: voteCounts[opt.id] || 0,
    }));

    const totalVotes = votes.length;

    // Check if current user has voted
    const userVote = votes.find((v) => v.userId === auth.user.userId);

    return success({
      poll: {
        pollId: poll.pollId,
        title: poll.title,
        startDate: poll.startDate,
        endDate: poll.endDate,
      },
      results,
      totalVotes,
      hasVoted: !!userVote,
      userVote: userVote || null,
    });
  } catch (err) {
    logger.error({ err, pollId, action: 'getResults' }, 'GetResults error');
    return error('Internal server error', 500);
  }
}
