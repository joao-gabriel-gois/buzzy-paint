import { Router } from 'npm:express';
import { updateUserController } from "@modules/accounts/useCases/UpdateUser/updateUserController.ts"
import { createUserController } from "@modules/accounts/useCases/CreateUser/createUserController.ts";
import { ensureAuthentication } from "@shared/infra/http/middlewares/ensureAuthentication.ts";

const userRoutes = Router();

userRoutes.put('/users', ensureAuthentication, updateUserController);
userRoutes.post('/users', createUserController);

export { userRoutes };