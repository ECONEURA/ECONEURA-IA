/**
 * logger.js - redacts bearer tokens and passwords, emits JSON logs
 */
function redact(s){
  if (!s) return s;
  return String(s).replace(/(Bearer\s)[A-Za-z0-9\._\-]+/g,'$1<REDACTED>').replace(/"password"\s*:\s*"[^"]+"/ig,'"password":"<REDACTED>"');
}
function info(msg, obj){
  const payload = {ts: new Date().toISOString(), level:'info', msg, obj: obj ? redact(JSON.stringify(obj)) : null};
  console.log(JSON.stringify(payload));
}
function error(msg, err){
  const payload = {ts: new Date().toISOString(), level:'error', msg, err: err && err.message ? err.message : err};
  console.error(JSON.stringify(payload));
}
module.exports = {info, error};
