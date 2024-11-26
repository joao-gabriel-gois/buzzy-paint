import { Router } from 'npm:express';

// import { getUserController } from "../../../../../../.test/GetUser/getUserController.ts"
import { updateUserController } from "../../../../modules/accounts/useCases/UpdateUser/updateUserController.ts"
import { createUserController } from "../../../../modules/accounts/useCases/CreateUser/createUserController.ts";
import { ensureAuthentication } from "../middlewares/ensureAuthentication.ts";

const userRoutes = Router();


// create authed getUserDraws
userRoutes.put('/users', ensureAuthentication, updateUserController);
userRoutes.post('/users', createUserController);
// TODO
// userRoutes.delete('/users/:id', deleteUserControler);


export { userRoutes };