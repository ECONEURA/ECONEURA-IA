#!/usr/bin/env node
import fs from 'fs';
const openapi = JSON.parse(fs.existsSync('reports/openapi-diff.json')?fs.readFileSync('reports/openapi-diff.json'):'{}');
const gitleaks = JSON.parse(fs.existsSync('reports/gitleaks.json')?fs.readFileSync('reports/gitleaks.json'):'{}');
const jscpd = JSON.parse(fs.existsSync('.artifacts/jscpd.summary.json')?fs.readFileSync('.artifacts/jscpd.summary.json'):'{}');
const links = JSON.parse(fs.existsSync('reports/links.json')?fs.readFileSync('reports/links.json'):'{}');

let REAL = 'OK';
let VERIFY = 'PASS';
let OPENAPI = (openapi && openapi.added? openapi.added.length:0);
let JSCPD = (jscpd&&jscpd.duplicatedPercent? `${jscpd.duplicatedPercent}%/${jscpd.duplicatedTokens||0}`:'NA');
let GITLEAKS = (gitleaks && gitleaks.findings? gitleaks.findings.length : (gitleaks && gitleaks.length? gitleaks.length : 0));
let LINKS = (links && links.broken? links.broken.length : 0);

if(OPENAPI>0 || GITLEAKS>0 || LINKS>0) REAL='FAIL';
// JSCPD rule: fail if >5
if(jscpd && jscpd.duplicatedPercent && parseFloat(jscpd.duplicatedPercent)>5) VERIFY='FAIL';

console.log(`REAL=${REAL} VERIFY=${VERIFY} OPENAPI=${OPENAPI} JSCPD=${JSCPD} GITLEAKS=${GITLEAKS} LINKS=${LINKS}`);
if(REAL==='FAIL' || VERIFY==='FAIL') process.exit(1);
process.exit(0);
