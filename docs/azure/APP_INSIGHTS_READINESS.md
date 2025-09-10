# Application Insights readiness (no secrets)

- Use the environment variable `APPLICATIONINSIGHTS_CONNECTION_STRING` in both web and api apps.
- Provide its value via Azure App Settings or a Key Vault reference. Do not commit any key material.
- SDK auto-collection: if you use the official SDK, ensure it reads the env var automatically or is initialized from env variables only.
- Validation steps:
  1) Confirm the env var is present in the slot you plan to use.
  2) Confirm no key material exists in repo history or configs.
  3) Verify ingestion by checking live metrics after deploy (outside the scope of this PR).