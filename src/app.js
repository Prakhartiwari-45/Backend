import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

// Create the Express application instance.
const app = express();

// Enable cross-origin requests from the configured frontend origin.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Parse incoming JSON request bodies, with a 16 KB size limit.
app.use(
  express.json({
    limit: "16kb",
  })
);

// Parse URL-encoded form data and allow nested objects.
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Serve static files from the public directory.
app.use(express.static("public"));

// Parse cookies attached to incoming requests.
app.use(cookieParser());

// Import the user-related routes.
import userRouter from "./routes/user.routes.js";

// Mount user routes under /api/v1/users.
app.use("/api/v1/users", userRouter);

export { app };
