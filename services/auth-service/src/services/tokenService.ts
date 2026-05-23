import jwt from 'jsonwebtoken';
import { config } from '../config';
import { Session } from '../models';
import { Constants } from '@school/common';
import { Types } from 'mongoose';

export const generateTokens = async (userId: Types.ObjectId, role: string, schoolId?: Types.ObjectId) => {
  const token = jwt.sign({ userId, role, schoolId }, config.jwtSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId, role, schoolId }, config.jwtRefreshSecret, { expiresIn: '7d' });

  const expirationTime = new Date();
  expirationTime.setDate(expirationTime.getDate() + 7);

  await Session.create({
    userId,
    role,
    schoolId,
    type: Constants.SESSION_TYPES.WEB,
    token: refreshToken,
    expirationTime
  });

  return { token, refreshToken };
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, config.jwtSecret);
};
