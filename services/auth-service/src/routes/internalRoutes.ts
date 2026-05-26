import { Router, Request, Response } from 'express';
import { verifyTokenAndSession } from '../services/tokenService';
import { asyncHandler } from '../utils/routeUtils';
import { internalAuth } from '../middleware/internalAuth';

const router = Router();

router.post('/auth/validate', internalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(401).json({ valid: false, message: 'No token provided' });
  }

  const validation = await verifyTokenAndSession(token);
  if (!validation.valid) {
    return res.status(401).json(validation);
  }

  return res.json(validation);
}));

router.get('/users', asyncHandler(async (req: Request, res: Response) => {
  // placeholder for internal users fetch
  res.json({ success: true });
}));

export default router;
