# CORS and WebSockets

- Set `CORS_ALLOWED_ORIGINS` as a comma-separated list in App Settings.
- Enable WebSockets in the App Service configuration if your app relies on real-time features.
- Recommended checks:
  1) Validate allowed origins in staging slot first.
  2) Keep credentials disabled unless absolutely required.
  3) Prefer wildcard subdomains only when strictly needed.