import { Router, Request, Response } from 'express';
import { verifyToken } from '../services/tokenService';
import { asyncHandler } from '../utils/routeUtils';

const router = Router();

router.post('/auth/validate', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(401).json({ valid: false, message: 'No token provided' });
  }
  try {
    const decoded = verifyToken(token);
    return res.json({ valid: true, decoded });
  } catch (error) {
    return res.status(401).json({ valid: false, message: 'Invalid token' });
  }
}));

router.get('/users', asyncHandler(async (req: Request, res: Response) => {
  // placeholder for internal users fetch
  res.json({ success: true });
}));

export default router;
