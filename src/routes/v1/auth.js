import { Router } from 'express';
import { check } from '../../controllers/v1/auth.js';

const authRouter = Router();

authRouter.get('/', check)

export default authRouter