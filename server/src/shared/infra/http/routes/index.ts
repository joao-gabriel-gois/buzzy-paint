import { Router } from "npm:express";
import { userRoutes } from "@shared/infra/http/routes/userRoutes.ts";
import { authRoutes } from "@shared/infra/http/routes/authenticationRoutes.ts";
import { drawsRoutes } from "@shared/infra/http/routes/drawsRoutes.ts";


const router = Router();

router.use(userRoutes);
router.use(authRoutes);
router.use(drawsRoutes);

export { router };
