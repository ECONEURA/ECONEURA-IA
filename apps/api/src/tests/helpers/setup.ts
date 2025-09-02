// Global test setup for API package
process.env.AUTH_REQUIRED = process.env.AUTH_REQUIRED ?? 'false';
process.env.AAD_REQUIRED = process.env.AAD_REQUIRED ?? 'false';
process.env.API_HMAC_SECRET = process.env.API_HMAC_SECRET ?? 'dev';
