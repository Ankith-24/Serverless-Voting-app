import {
  PutCommand,
  ScanCommand,
  DeleteCommand,
  UpdateCommand,
  QueryCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLES } from '../utils/dynamodb.js';
import { authenticate, authorize } from '../utils/auth-middleware.js';
import { success, error } from '../utils/response.js';
import logger from '../utils/logger.js';
import { validateEmail, validatePassword, validateName, parseBody } from '../utils/validators.js';

/**
 * GET /api/users
 * List all users (Super Admin only).
 */
export async function getUsers(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    const authzError = authorize(auth.user, ['SUPER_ADMIN']);
    if (authzError) return authzError;

    const result = await docClient.send(
      new ScanCommand({ TableName: TABLES.USERS })
    );

    const users = (result.Items || []).map(({ passwordHash, ...rest }) => rest);

    return success({ users });
  } catch (err) {
    logger.error({ err, action: 'getUsers' }, 'GetUsers error');
    return error('Internal server error', 500);
  }
}

/**
 * POST /api/users
 * Add a new user directly (Super Admin only).
 */
export async function createUser(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    const authzError = authorize(auth.user, ['SUPER_ADMIN']);
    if (authzError) return authzError;

    const body = parseBody(event);
    if (!body) return error('Invalid JSON body');

    const { name: rawName, email: rawEmail, password, role } = body;

    // Validate inputs
    const nameResult = validateName(rawName);
    if (!nameResult.valid) return error(nameResult.error);

    const emailResult = validateEmail(rawEmail);
    if (!emailResult.valid) return error(emailResult.error);

    const passResult = validatePassword(password);
    if (!passResult.valid) return error(passResult.error);

    const name = nameResult.name;
    const email = emailResult.email;

    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'VOTER'];
    if (role && !validRoles.includes(role)) {
      return error('Invalid role. Must be SUPER_ADMIN, ADMIN, or VOTER');
    }

    // Check if email already exists
    const existing = await docClient.send(
      new QueryCommand({
        TableName: TABLES.USERS,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email },
      })
    );

    if (existing.Items && existing.Items.length > 0) {
      return error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const user = {
      userId,
      name,
      email,
      passwordHash,
      role: role || 'VOTER',
      createdAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLES.USERS,
        Item: user,
      })
    );

    logger.info({ userId, email, role: user.role, action: 'createUser', createdBy: auth.user.userId }, 'User created by admin');

    const { passwordHash: _, ...userWithoutPassword } = user;

    return success({ message: 'User created', user: userWithoutPassword }, 201);
  } catch (err) {
    logger.error({ err, action: 'createUser' }, 'CreateUser error');
    return error('Internal server error', 500);
  }
}

/**
 * DELETE /api/users/{userId}
 * Remove a user (Super Admin only).
 */
export async function deleteUser(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    const authzError = authorize(auth.user, ['SUPER_ADMIN']);
    if (authzError) return authzError;

    const { userId } = event.pathParameters;

    // Prevent self-deletion
    if (userId === auth.user.userId) {
      return error('Cannot delete your own account');
    }

    // Check user exists
    const existing = await docClient.send(
      new GetCommand({
        TableName: TABLES.USERS,
        Key: { userId },
      })
    );

    if (!existing.Item) {
      return error('User not found', 404);
    }

    await docClient.send(
      new DeleteCommand({
        TableName: TABLES.USERS,
        Key: { userId },
      })
    );

    return success({ message: 'User deleted' });
  } catch (err) {
    logger.error({ err, userId, action: 'deleteUser' }, 'DeleteUser error');
    return error('Internal server error', 500);
  }
}

/**
 * PUT /api/users/{userId}/role
 * Update user role - promote/demote (Super Admin only).
 */
export async function updateUserRole(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    const authzError = authorize(auth.user, ['SUPER_ADMIN']);
    if (authzError) return authzError;

    const { userId } = event.pathParameters;
    const body = JSON.parse(event.body || '{}');
    const { role } = body;

    // Prevent self-role-change
    if (userId === auth.user.userId) {
      return error('Cannot change your own role');
    }

    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'VOTER'];
    if (!role || !validRoles.includes(role)) {
      return error('Invalid role. Must be SUPER_ADMIN, ADMIN, or VOTER');
    }

    // Check user exists
    const existing = await docClient.send(
      new GetCommand({
        TableName: TABLES.USERS,
        Key: { userId },
      })
    );

    if (!existing.Item) {
      return error('User not found', 404);
    }

    await docClient.send(
      new UpdateCommand({
        TableName: TABLES.USERS,
        Key: { userId },
        UpdateExpression: 'SET #role = :role',
        ExpressionAttributeNames: { '#role': 'role' },
        ExpressionAttributeValues: { ':role': role },
      })
    );

    return success({ message: `User role updated to ${role}` });
  } catch (err) {
    logger.error({ err, userId, action: 'updateUserRole' }, 'UpdateUserRole error');
    return error('Internal server error', 500);
  }
}
