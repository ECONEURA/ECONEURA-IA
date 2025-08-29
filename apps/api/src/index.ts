import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import rateLimit from "express-rate-limit";
import basicAuth from "express-basic-auth";
import { ai } from "./routes/ai.js";
import { search } from "./routes/search.js";
import { registry } from "./lib/observe.js";

const app = express();
app.use(cors({ origin: [/localhost:3000$/], credentials: false }));
app.use(bodyParser.json({ limit:"2mb" }));
app.use(rateLimit({ windowMs:60_000, max:180, keyGenerator:(req)=> (req.headers["x-org-id"] as string)||req.ip }));

app.get("/metrics", basicAuth({ users: { admin: process.env.METRICS_PWD||"metrics" }, challenge:true }), async (_req,res)=>{
  res.setHeader("Content-Type", registry.contentType);
  res.end(await registry.metrics());
});

app.use("/v1/ai", ai);
app.use("/v1/search", search);

app.listen(process.env.PORT||4000, ()=> console.log("API on :4000"));