import { Router } from 'npm:express';
import { authRoutes } from "@shared/infra/http/routes/authenticationRoutes.ts";
import { userRoutes } from "@shared/infra/http/routes/userRoutes.ts";

const router = Router();

router.use(userRoutes);
router.use(authRoutes);

export { router };