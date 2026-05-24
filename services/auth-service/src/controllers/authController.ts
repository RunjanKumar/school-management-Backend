import { Request, Response } from 'express';
import { User, Session, LoginAudit } from '../models';
import { generateTokens } from '../services/tokenService';
import { verifyGoogleToken } from '../services/googleAuthService';
import bcrypt from 'bcrypt';
import { Constants } from '@school/common';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ normalizedEmail }).select('+passwordHash');
  if (!user || !user.passwordHash) {
    await LoginAudit.create({ email: normalizedEmail, loginMethod: Constants.AUTH_PROVIDERS.PASSWORD, success: false, failureReason: 'Invalid credentials' });
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    await LoginAudit.create({ email: normalizedEmail, loginMethod: Constants.AUTH_PROVIDERS.PASSWORD, success: false, failureReason: 'Invalid credentials' });
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const { token, refreshToken } = await generateTokens(user._id as any, user.role, user.schoolId as any);
  
  await LoginAudit.create({ userId: user._id, email: normalizedEmail, role: user.role, schoolId: user.schoolId, loginMethod: Constants.AUTH_PROVIDERS.PASSWORD, success: true });

  return res.json({ success: true, token, refreshToken, user: { id: user._id, email: user.email, role: user.role } });
};

export const googleAuth = async (req: Request, res: Response) => {
  const { idToken } = req.body;
  const { sub, email } = await verifyGoogleToken(idToken);
  
  const user = await User.findOne({ googleSub: sub });
  if (!user) {
    return res.status(401).json({ success: false, message: 'User not found' });
  }

  const { token, refreshToken } = await generateTokens(user._id as any, user.role, user.schoolId as any);
  return res.json({ success: true, token, refreshToken });
};

export const forgotPassword = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Forgot password placeholder' });
};

export const resetPassword = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Reset password placeholder' });
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await Session.deleteOne({ token: refreshToken });
  }
  res.json({ success: true, message: 'Logged out' });
};

export const me = async (req: Request, res: Response) => {
  // Requires auth middleware which is not fully requested, assuming passed from gateway
  res.json({ success: true, message: 'Me placeholder' });
};
