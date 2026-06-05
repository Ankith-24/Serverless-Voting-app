import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import http from 'http';
import https from 'https';

const isOffline = process.env.IS_OFFLINE === 'true';

// Create HTTP/HTTPS agents with connection pooling and reuse
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 25 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 25 });

const client = new DynamoDBClient(
  isOffline
    ? {
        region: 'localhost',
        endpoint: 'http://127.0.0.1:8000',
        credentials: {
          accessKeyId: 'MockAccessKeyId',
          secretAccessKey: 'MockSecretAccessKey',
        },
        httpAgent,
      }
    : {
        requestHandler: {
          httpAgent,
          httpsAgent,
        },
      }
);

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const TABLES = {
  USERS: process.env.USERS_TABLE,
  ELECTIONS: process.env.ELECTIONS_TABLE,
  VOTES: process.env.VOTES_TABLE,
};
