import { Request } from 'express';
import { AdminInterface } from './adminInterface';

export interface AuthenticatedRequestInterface extends Request {
	admin: AdminInterface;
}
