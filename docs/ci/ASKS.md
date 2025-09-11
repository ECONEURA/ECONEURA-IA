# Manual Actions Required

## GitHub CLI Authentication
**Action**: Authenticate with GitHub CLI
**Owner**: Developer
**Commands**:
```bash
gh auth login
# Follow prompts to authenticate with GitHub
```

## PR Merge Commands (when gh auth is available)
**Action**: Merge PRs 95-114
**Owner**: Developer
**Commands**:
```bash
# For each PR N (95-114):
gh pr checkout N
git pull --rebase origin main
gh pr merge N --merge --delete-branch
```

## PR-115 DEV Creation
**Action**: Create PR-115 DEV ONLY
**Owner**: Developer
**Commands**:
```bash
# Push PR-115 branch
git push origin pr-115-deploy-dev

# Create PR
gh pr create --title "PR-115: DEV ONLY (NO PROD)" --body "DEV deployment configuration with guards and playbook" --draft
```

## Status
- [ ] GitHub CLI authentication required
- [ ] PR merges pending manual execution
- [x] PR-115 implementation completed
- [ ] PR-115 creation pending (requires gh auth)