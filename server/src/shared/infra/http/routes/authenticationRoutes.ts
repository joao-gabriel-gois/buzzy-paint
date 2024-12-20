import { Router } from 'npm:express';
import { authenticateUserController } from "@modules/accounts/useCases/AuthenticateUser/authenticateUserController.ts";
import { refreshUserTokenController } from "@modules/accounts/useCases/RefreshUserToken/refreshUserTokenController.ts";

const authRoutes = Router();

authRoutes.post('/login', authenticateUserController);
authRoutes.post('/refresh-session', refreshUserTokenController);
export { authRoutes };