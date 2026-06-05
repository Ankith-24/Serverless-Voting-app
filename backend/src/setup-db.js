import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new DynamoDBClient({
  region: 'localhost',
  endpoint: 'http://127.0.0.1:8000',
  credentials: { accessKeyId: 'MockAccessKeyId', secretAccessKey: 'MockSecretAccessKey' },
});
const docClient = DynamoDBDocumentClient.from(client, { marshallOptions: { removeUndefinedValues: true } });

const USERS_TABLE = 'polling-app-users-dev';
const ELECTIONS_TABLE = 'polling-app-elections-dev';
const VOTES_TABLE = 'polling-app-votes-dev';

const tables = [
  {
    TableName: USERS_TABLE,
    KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [{
      IndexName: 'email-index',
      KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
      Projection: { ProjectionType: 'ALL' },
    }],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: ELECTIONS_TABLE,
    KeySchema: [{ AttributeName: 'electionId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'electionId', AttributeType: 'S' },
      { AttributeName: 'createdBy', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [{
      IndexName: 'createdBy-index',
      KeySchema: [{ AttributeName: 'createdBy', KeyType: 'HASH' }],
      Projection: { ProjectionType: 'ALL' },
    }],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: VOTES_TABLE,
    KeySchema: [
      { AttributeName: 'electionId', KeyType: 'HASH' },
      { AttributeName: 'userId', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'electionId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
];

async function setup() {
  console.log('🔧 Setting up DynamoDB Local tables...\n');

  const existing = await client.send(new ListTablesCommand({}));
  const existingNames = existing.TableNames || [];

  for (const table of tables) {
    if (existingNames.includes(table.TableName)) {
      console.log(`  ✅ Table "${table.TableName}" already exists`);
    } else {
      await client.send(new CreateTableCommand(table));
      console.log(`  ✅ Created table "${table.TableName}"`);
    }
  }

  // Seed users
  console.log('\n🌱 Seeding users...\n');
  const seedPath = join(__dirname, '..', 'seed', 'users.json');
  const users = JSON.parse(readFileSync(seedPath, 'utf8'));

  // for (const user of users) {
  //   await docClient.send(new PutCommand({ TableName: USERS_TABLE, Item: user }));
  //   console.log(`  ✅ Seeded user: ${user.email} (${user.role})`);
  // }

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);

    const item = {
      ...user,
      passwordHash,
    };

    delete item.password;

    await docClient.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: item,
      })
    );

    console.log(`✅ Seeded user: ${user.email}`);
  }

  console.log('\n🎉 Setup complete! You can now start the API with: npm start\n');
}

setup().catch((err) => {
  console.error('❌ Setup failed:', err.message);
  console.error('\nMake sure DynamoDB Local is running on port 8000.');
  console.error('Start it with: npm run dynamo\n');
  process.exit(1);
});
