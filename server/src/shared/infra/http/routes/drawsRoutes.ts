import { Router } from 'npm:express';
import { createDrawsController } from "@modules/draws/useCases/CreateDraws/createDrawsController.ts";
import { updateDrawsController } from "@modules/draws/useCases/UpdateDraws/updateDrawsController.ts";
import { ensureAuthentication } from "@shared/infra/http/middlewares/ensureAuthentication.ts";
import { getDrawsController } from "@modules/draws/useCases/GetDraws/getDrawsController.ts";


const drawsRoutes = Router();

drawsRoutes.get('/draws', ensureAuthentication, getDrawsController);
drawsRoutes.post('/draws', ensureAuthentication, createDrawsController);
drawsRoutes.put('/draws', ensureAuthentication, updateDrawsController);

export { drawsRoutes };
