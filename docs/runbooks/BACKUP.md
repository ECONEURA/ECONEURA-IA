# ECONEURA Backup Runbook

## Overview
This runbook provides step-by-step procedures for backup operations in the ECONEURA system.

## Owners
- **Primary**: DevOps Team (devops@econeura.dev)
- **Secondary**: Platform Team (platform@econeura.dev)
- **Escalation**: CTO (cto@econeura.dev)

## Backup Types

### 1. Database Backup

#### PostgreSQL Backup
```bash
# Full database backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME --verbose --clean --no-owner --no-privileges > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip backup_$(date +%Y%m%d_%H%M%S).sql

# Upload to S3
aws s3 cp backup_$(date +%Y%m%d_%H%M%S).sql.gz s3://econeura-backups/database/
```

#### MongoDB Backup (if applicable)
```bash
# Full MongoDB backup
mongodump --host $MONGO_HOST --port $MONGO_PORT --db $MONGO_DB --out backup_$(date +%Y%m%d_%H%M%S)

# Compress and upload
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz backup_$(date +%Y%m%d_%H%M%S)
aws s3 cp backup_$(date +%Y%m%d_%H%M%S).tar.gz s3://econeura-backups/mongodb/
```

### 2. Application Data Backup

#### File Storage Backup
```bash
# Backup uploaded files
rsync -avz --progress /var/www/econeura/uploads/ backup_uploads_$(date +%Y%m%d_%H%M%S)/
tar -czf backup_uploads_$(date +%Y%m%d_%H%M%S).tar.gz backup_uploads_$(date +%Y%m%d_%H%M%S)/
aws s3 cp backup_uploads_$(date +%Y%m%d_%H%M%S).tar.gz s3://econeura-backups/uploads/
```

#### Configuration Backup
```bash
# Backup configuration files
tar -czf config_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  /etc/econeura/ \
  /var/www/econeura/.env \
  /var/www/econeura/docker-compose.yml

aws s3 cp config_backup_$(date +%Y%m%d_%H%M%S).tar.gz s3://econeura-backups/config/
```

### 3. Infrastructure Backup

#### Kubernetes Resources
```bash
# Backup all resources
kubectl get all --all-namespaces -o yaml > k8s_backup_$(date +%Y%m%d_%H%M%S).yaml

# Backup secrets (encrypted)
kubectl get secrets --all-namespaces -o yaml > k8s_secrets_backup_$(date +%Y%m%d_%H%M%S).yaml
gpg --symmetric --cipher-algo AES256 k8s_secrets_backup_$(date +%Y%m%d_%H%M%S).yaml

aws s3 cp k8s_backup_$(date +%Y%m%d_%H%M%S).yaml s3://econeura-backups/kubernetes/
aws s3 cp k8s_secrets_backup_$(date +%Y%m%d_%H%M%S).yaml.gpg s3://econeura-backups/kubernetes/
```

## Automated Backup Script

### Daily Backup Script
```bash
#!/bin/bash
# /usr/local/bin/econeura-backup.sh

set -euo pipefail

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/econeura"
S3_BUCKET="s3://econeura-backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
echo "Starting database backup..."
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME --verbose --clean --no-owner --no-privileges > $BACKUP_DIR/db_backup_$BACKUP_DATE.sql
gzip $BACKUP_DIR/db_backup_$BACKUP_DATE.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/db_backup_$BACKUP_DATE.sql.gz $S3_BUCKET/database/

# Cleanup local files older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_backup_$BACKUP_DATE.sql.gz"
```

### Cron Job Setup
```bash
# Add to crontab (run daily at 2 AM)
0 2 * * * /usr/local/bin/econeura-backup.sh >> /var/log/econeura-backup.log 2>&1
```

## Backup Verification

### Test Restore Procedure
```bash
# Test database restore
gunzip -c backup_20240115_020000.sql.gz | psql -h $DB_HOST -U $DB_USER -d test_restore_db

# Verify data integrity
psql -h $DB_HOST -U $DB_USER -d test_restore_db -c "SELECT COUNT(*) FROM users;"
psql -h $DB_HOST -U $DB_USER -d test_restore_db -c "SELECT COUNT(*) FROM companies;"
```

## Monitoring and Alerts

### Backup Status Monitoring
```bash
# Check backup status
aws s3 ls s3://econeura-backups/database/ --recursive | tail -10

# Verify backup size
aws s3 ls s3://econeura-backups/database/ --recursive --summarize | grep "Total Size"
```

### Alert Conditions
- Backup file size < 10MB (indicates potential failure)
- No backup file created in last 25 hours
- Backup upload to S3 failed

## Emergency Procedures

### Immediate Backup (Emergency)
```bash
# Quick backup for emergency situations
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME --verbose --clean --no-owner --no-privileges | gzip > emergency_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Upload immediately
aws s3 cp emergency_backup_$(date +%Y%m%d_%H%M%S).sql.gz s3://econeura-backups/emergency/
```

### Cross-Region Backup
```bash
# Replicate backups to secondary region
aws s3 sync s3://econeura-backups/ s3://econeura-backups-dr/ --delete
```

## Recovery Procedures

### Database Recovery
```bash
# Download backup from S3
aws s3 cp s3://econeura-backups/database/backup_20240115_020000.sql.gz .

# Restore database
gunzip -c backup_20240115_020000.sql.gz | psql -h $DB_HOST -U $DB_USER -d $DB_NAME
```

### Point-in-Time Recovery
```bash
# For PostgreSQL with WAL archiving
pg_basebackup -h $DB_HOST -U $DB_USER -D /var/lib/postgresql/restore -Ft -z -P

# Apply WAL files for point-in-time recovery
pg_receivewal -h $DB_HOST -U $DB_USER -D /var/lib/postgresql/wal_archive
```

## Backup Retention Policy

- **Daily backups**: 30 days
- **Weekly backups**: 12 weeks
- **Monthly backups**: 12 months
- **Yearly backups**: 7 years

## Security Considerations

- All backups are encrypted at rest in S3
- Database backups exclude sensitive data (passwords, tokens)
- Access to backup files requires MFA
- Backup files are stored in separate AWS account

## Troubleshooting

### Common Issues

#### Backup Size Too Small
```bash
# Check database size
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));"

# Check backup file size
ls -lh backup_*.sql.gz
```

#### S3 Upload Failed
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check S3 bucket permissions
aws s3 ls s3://econeura-backups/

# Retry upload
aws s3 cp backup_file.sql.gz s3://econeura-backups/database/ --retry 3
```

#### Database Connection Issues
```bash
# Test database connectivity
pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER

# Check database status
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT version();"
```

## Contact Information

- **On-call Engineer**: Check PagerDuty
- **DevOps Team**: devops@econeura.dev
- **Emergency**: +1-555-ECONEURA (24/7)

## Last Updated
2024-01-15

## Review Schedule
Monthly review by DevOps Team
