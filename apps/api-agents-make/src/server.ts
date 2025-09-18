import express from "express";
import cors from "cors";
import helmet from "helmet";
import bodyParser from "body-parser";
import trigger from './routes/trigger.js';
import events from './routes/events.js';
import { initFinOps, finalizeFinOps } from './middleware/finops.js';
import { telemetryMiddleware } from './middleware/telemetry.js';

const app = express();
app.use(bodyParser.json());

// CORS configuration with strict allowlist
const allow = (process.env.ALLOWED_ORIGINS || "https://www.econeura.com")
  .split(",")
  .map(s => s.trim());

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allow.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Health check
app.get("/health", (_, res) => {
  res.json({ 
    ok: true, 
    service: "agents-make",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Middleware
app.use(initFinOps);
app.use(telemetryMiddleware);

// Routes
app.use("/agents", trigger);
app.use("/agents", events);

// Finalize headers
app.use(finalizeFinOps);

const PORT = process.env.PORT || 3102;
app.listen(PORT, () => {
  // Server startup logs (removed for production)
});
