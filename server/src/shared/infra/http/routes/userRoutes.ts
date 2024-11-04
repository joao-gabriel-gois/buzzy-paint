import { Router } from 'npm:express';

import { getUserController } from "../../../../modules/accounts/useCases/GetUser/getUserController.ts"
import { updateUserController } from "../../../../modules/accounts/useCases/UpdateUser/updateUserController.ts"
import { createUserController } from "../../../../modules/accounts/useCases/CreateUser/createUserController.ts";

const userRoutes = Router();

userRoutes.get('/users', getUserController);
userRoutes.get('/users/:id', getUserController);
userRoutes.put('/users', updateUserController);
userRoutes.post('/users', createUserController);
// TODO
// userRoutes.delete('/users/:id', deleteUserControler);


export { userRoutes };