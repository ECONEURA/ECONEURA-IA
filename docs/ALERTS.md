# Alertas (Teams) — p95/error/cost/HIL

## Variables (Secrets)
- `TEAMS_WEBHOOK_URL` (Actions/Environments)

## Uso (CI)
- En workflows con `if: failure()`, dispara paso:
  ```yaml
  - name: Teams alert
    if: failure()
    run: |
      node -e "fetch(process.env.TEAMS_WEBHOOK_URL,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:'CI gate FAIL en $GITHUB_WORKFLOW ($GITHUB_SHA) — revisa Playwright/k6/OpenAPI'})}).then(()=>console.log('alert sent'))"
    env:
      TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
  ```
