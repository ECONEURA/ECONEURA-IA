# ENV ↔ Azure App Settings mapping

Use these environment variables locally and map them 1:1 to Azure App Service application settings. Values must be provided via environment or Key Vault references (no secrets in repo).

| Local env var | Azure App Setting | Notes |
|---|---|---|
| APPLICATIONINSIGHTS_CONNECTION_STRING | APPLICATIONINSIGHTS_CONNECTION_STRING | Provide via Key Vault reference or environment secret. |
| CORS_ALLOWED_ORIGINS | CORS_ALLOWED_ORIGINS | Comma-separated origins. |
| NODE_ENV | NODE_ENV | Use "production" in Azure. |
| PORT | PORT / WEBSITES_PORT | API may use 8080; web may use 3000. |
| AZURE_SUBSCRIPTION_ID | AZURE_SUBSCRIPTION_ID | Metadata only; not used by runtime. |
| AZURE_TENANT_ID | AZURE_TENANT_ID | Metadata only. |
| AZURE_RESOURCE_GROUP | AZURE_RESOURCE_GROUP | Metadata only. |
| AZURE_REGION | AZURE_REGION | Metadata only. |
| AZURE_APP_SERVICE_NAME_WEB | AZURE_APP_SERVICE_NAME_WEB | Metadata only. |
| AZURE_APP_SERVICE_NAME_API | AZURE_APP_SERVICE_NAME_API | Metadata only. |
