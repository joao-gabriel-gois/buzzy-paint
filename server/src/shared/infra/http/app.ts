import express from 'npm:express';
import cors from 'npm:cors';
import cookieParser from 'npm:cookie-parser';
import { router } from "@shared/infra/http/routes/index.ts";
import { errorHandler } from "@shared/infra/http/middlewares/errorHandler.ts";
import { sillyLogger } from "@shared/infra/http/middlewares/sillyLogger.ts";

const app = express();

app.use(express.json())
app.use(cors({
  origin: 'http://localhost:8080', 
  credentials: true
}));
app.use(cookieParser());

app.use(sillyLogger); // We can create a better one later, with critical levels in order to store important ones

app.use(router);

app.use(errorHandler);

export { app };
