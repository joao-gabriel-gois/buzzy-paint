import express from 'npm:express';
import cors from 'npm:cors';
import { router } from './routes/index.ts';
import { errorHandler } from "./middlewares/errorHandler.ts";
import { sillyLogger } from "./middlewares/sillyLogger.ts";

const app = express();

app.use(express.json())
app.use(cors());
app.use(sillyLogger); // We can create a better one later, with critical levels in order to store important ones

app.use(router);

app.use(errorHandler);

export { app };
