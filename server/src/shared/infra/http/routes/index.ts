import { Router } from 'npm:express';
import { authRoutes } from "./authenticationRoutes.ts";
import { userRoutes } from "./userRoutes.ts";

const router = Router();

router.use(userRoutes);
router.use(authRoutes);

export { router };