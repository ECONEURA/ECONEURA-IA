# Access restrictions

- Prefer IP allowlists for admin interfaces.
- Use Azure Front Door/Application Gateway for advanced rules when applicable.
- Example (documentation only):

```bash
az webapp config access-restriction add \
  --resource-group <RG> \
  --name <APP> \
  --rule-name "AdminAccess" \
  --action Allow \
  --ip-address 192.168.1.0/24 \
  --priority 100
```

Do not run commands from CI in this PR; they are examples only.