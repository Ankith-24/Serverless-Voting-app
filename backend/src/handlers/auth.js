import { PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLES } from '../utils/dynamodb.js';
import { generateToken } from '../utils/jwt.js';
import { authenticate } from '../utils/auth-middleware.js';
import { success, error } from '../utils/response.js';
import logger from '../utils/logger.js';
import { validateEmail, validatePassword, validateName, validateStudentId, parseBody } from '../utils/validators.js';

/**
 * POST /api/auth/register
 * Register a new student user. Default role is VOTER.
 * Email must end with @pollapp.com.
 * Accepts optional student fields: studentId, year, program.
 */
export async function register(event) {
  try {
    const body = parseBody(event);
    if (!body) return error('Invalid JSON body');

    const { name: rawName, email: rawEmail, password, studentId: rawStudentId, year, program } = body;

    // Validate inputs
    const nameResult = validateName(rawName);
    if (!nameResult.valid) return error(nameResult.error);

    const emailResult = validateEmail(rawEmail);
    if (!emailResult.valid) return error(emailResult.error);

    const passResult = validatePassword(password);
    if (!passResult.valid) return error(passResult.error);

    // Validate optional student ID
    if (rawStudentId) {
      const sidResult = validateStudentId(rawStudentId);
      if (!sidResult.valid) return error(sidResult.error);
    }

    const name = nameResult.name;
    const email = emailResult.email;

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
      role: 'VOTER',
      studentId: rawStudentId ? rawStudentId.trim() : undefined,
      year: year ? String(year).trim() : undefined,
      program: program ? String(program).trim() : undefined,
      eligible: true,
      createdAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLES.USERS,
        Item: user,
      })
    );

    logger.info({ userId, email, action: 'register' }, 'User registered');

    const token = generateToken({
      userId: user.userId,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return success({
      message: 'Registration successful',
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        year: user.year,
        program: user.program,
        eligible: user.eligible,
      },
    }, 201);
  } catch (err) {
    logger.error({ err, action: 'register' }, 'Register error');
    return error('Internal server error', 500);
  }
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT.
 */
export async function login(event) {
  const startTime = Date.now();
  try {
    // logger.info({ requestId: event.requestContext?.requestId }, 'Login request received');

    const body = parseBody(event);
    if (!body) return error('Invalid JSON body');

    const { email: rawEmail, password } = body;

    if (!rawEmail || !password) {
      return error('Email and password are required');
    }

    const email = rawEmail.trim().toLowerCase();
    // logger.info({ email, requestId: event.requestContext?.requestId }, 'Querying user from DynamoDB');

    // Find user by email
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLES.USERS,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email },
      })
    );

    //console.log("DynamoDB result", result);


    if (!result.Items || result.Items.length === 0) {
      logger.warn({ email }, 'User not found');
      return error('Invalid email or password', 401);
    }

    const user = result.Items[0];
    console.log("user data", user);

    logger.info({ userId: user.userId, email }, 'User found, comparing password');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log(" ");

    console.log(isValid);
    console.log("");


    if (!isValid) {
      logger.warn({ userId: user.userId, email }, 'Invalid password');
      return error('Invalid email or password', 401);
    }

    logger.info({ userId: user.userId, email, action: 'login', duration: Date.now() - startTime }, 'User logged in successfully');

    const token = generateToken({
      userId: user.userId,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return success({
      message: 'Login successful',
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        year: user.year,
        program: user.program,
        eligible: user.eligible,
      },
    });
  } catch (err) {
    logger.error("error from login function ", err);
    //logger.error({ err, action: 'login', duration: Date.now() - startTime, requestId: event.requestContext?.requestId }, 'Login error');
    return error('Internal server error', 500);
  }
}

/**
 * GET /api/auth/me
 * Get current authenticated user info.
 */
export async function getMe(event) {
  try {
    const auth = authenticate(event);
    if (auth.error) return auth.error;

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLES.USERS,
        Key: { userId: auth.user.userId },
      })
    );

    if (!result.Item) {
      return error('User not found', 404);
    }

    const { passwordHash, ...userWithoutPassword } = result.Item;

    return success({ user: userWithoutPassword });
  } catch (err) {
    logger.error({ err, action: 'getMe' }, 'GetMe error');
    return error('Internal server error', 500);
  }
}
