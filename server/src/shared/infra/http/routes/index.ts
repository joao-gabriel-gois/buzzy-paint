import { Router } from 'npm:express';
import { userRoutes } from "./userRoutes.ts";

const router = Router();

router.use(userRoutes);

export { router };