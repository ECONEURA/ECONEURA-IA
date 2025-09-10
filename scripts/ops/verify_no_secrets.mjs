#!/usr/bin/env node
import fs from "fs"; import {execSync} from "child_process";
const out = execSync("git grep -n -E '(InstrumentationKey=|connectionString=|ClientSecret=|DefaultEndpointsProtocol=|AccountKey=)' || true").toString();
if(out.trim()){ console.error("SECRET PATTERNS FOUND:\n"+out); process.exit(1); }
