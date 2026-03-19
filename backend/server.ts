import "dotenv/config";

import cors from "cors";
import express from "express";

import analyzeRouter from "./routes/analyze";

const app = express();
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("/api/analyze", cors(corsOptions));
app.use(express.json({ limit: "20mb" }));

app.use("/api/analyze", analyzeRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      error: {
        code: "INVALID_REQUEST",
        message: "Request body must be valid JSON.",
        retryable: false,
      },
      attempts: [],
    });
  }

  return next(error);
});

const parsedPort = Number(process.env.PORT);
const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3001;

app.listen(port, () => {
  console.log(`SmartBite backend running on port ${port}`);
});
