import { Router } from "npm:express";
// import { updateUserController } from "@modules/accounts/useCases/UpdateUser/updateUserController.ts"
import { createUserController } from "@modules/accounts/useCases/CreateUser/createUserController.ts";
// import { ensureAuthentication } from "@shared/infra/http/middlewares/ensureAuthentication.ts";

const userRoutes = Router();
/*
  WARNING:
  Despite the fact that this was exposed by a route in the previous,
  commmits, these useCase"s service, controller and modules are not being
  called on frontend yet. Before exposing it, it would be necessary
  to add proper validations in controller, better error check ups in
  the service and then, finally, really write its tests.
  After noticing this when creating unit tests, I decided to comment
  the rout that calls it until everything regarding it is not done yet
  and I"ve also added this comment in all it"s related implementations
*/
// userRoutes.put("/users", ensureAuthentication, updateUserController);
userRoutes.post("/users", createUserController);

export { userRoutes };