# Egress IPs (outbound)

Retrieve outbound IPs for network allowlists:

```bash
az webapp show --resource-group <RG> --name <APP> --query outboundIpAddresses --output tsv
```

Note: For slots, use `-s <slot>` to retrieve slot-specific IPs.