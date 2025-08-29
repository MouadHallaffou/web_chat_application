#!/bin/bash

# Backup Script for ChatApp
# Usage: ./backup.sh [database|files|all] [local|s3|gcs]

set -e

BACKUP_TYPE=${1:-all}
BACKUP_DESTINATION=${2:-local}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/opt/backups/chatapp"
PROJECT_NAME="chatapp"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Create backup directory
create_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    log "Backup directory created: $BACKUP_DIR"
}

# Backup MongoDB
backup_mongodb() {
    log "Backing up MongoDB..."
    
    local backup_file="$BACKUP_DIR/mongodb_backup_$TIMESTAMP"
    
    # Get MongoDB connection details
    local mongo_host=${MONGO_HOST:-localhost}
    local mongo_port=${MONGO_PORT:-27017}
    local mongo_db=${MONGO_DB_NAME:-chatapp}
    local mongo_user=${MONGO_ROOT_USER:-admin}
    local mongo_pass=${MONGO_ROOT_PASSWORD:-password123}
    
    # Create MongoDB backup
    if command -v mongodump >/dev/null 2>&1; then
        mongodump --host "$mongo_host:$mongo_port" \
                  --db "$mongo_db" \
                  --username "$mongo_user" \
                  --password "$mongo_pass" \
                  --authenticationDatabase admin \
                  --out "$backup_file"
    else
        # Using Docker if mongodump is not available locally
        docker exec ${PROJECT_NAME}_mongodb mongodump \
            --db "$mongo_db" \
            --username "$mongo_user" \
            --password "$mongo_pass" \
            --authenticationDatabase admin \
            --archive > "$backup_file.archive"
    fi
    
    # Compress backup
    tar -czf "$backup_file.tar.gz" -C "$BACKUP_DIR" "$(basename "$backup_file")"
    rm -rf "$backup_file"
    
    log "MongoDB backup completed: $backup_file.tar.gz"
}

# Backup Redis
backup_redis() {
    log "Backing up Redis..."
    
    local backup_file="$BACKUP_DIR/redis_backup_$TIMESTAMP.rdb"
    
    # Save Redis data
    docker exec ${PROJECT_NAME}_redis redis-cli BGSAVE
    
    # Wait for backup to complete
    while [[ $(docker exec ${PROJECT_NAME}_redis redis-cli LASTSAVE) -eq $(docker exec ${PROJECT_NAME}_redis redis-cli LASTSAVE) ]]; do
        sleep 1
    done
    
    # Copy RDB file
    docker cp ${PROJECT_NAME}_redis:/data/dump.rdb "$backup_file"
    
    log "Redis backup completed: $backup_file"
}

# Backup uploaded files
backup_files() {
    log "Backing up uploaded files..."
    
    local backup_file="$BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz"
    
    # Backup from Docker volume or local directory
    if docker volume inspect ${PROJECT_NAME}_uploads_data >/dev/null 2>&1; then
        # Backup Docker volume
        docker run --rm \
            -v ${PROJECT_NAME}_uploads_data:/data \
            -v "$BACKUP_DIR":/backup \
            alpine tar -czf "/backup/uploads_backup_$TIMESTAMP.tar.gz" -C /data .
    else
        # Backup local directory
        if [[ -d "uploads" ]]; then
            tar -czf "$backup_file" uploads/
        else
            warning "Uploads directory not found"
            return
        fi
    fi
    
    log "Files backup completed: $backup_file"
}

# Upload to cloud storage
upload_to_cloud() {
    local backup_files=("$@")
    
    case $BACKUP_DESTINATION in
        s3)
            log "Uploading to AWS S3..."
            for file in "${backup_files[@]}"; do
                aws s3 cp "$file" "s3://${S3_BACKUP_BUCKET}/chatapp/$(basename "$file")" || warning "Failed to upload $file to S3"
            done
            ;;
        gcs)
            log "Uploading to Google Cloud Storage..."
            for file in "${backup_files[@]}"; do
                gsutil cp "$file" "gs://${GCS_BACKUP_BUCKET}/chatapp/$(basename "$file")" || warning "Failed to upload $file to GCS"
            done
            ;;
        local)
            log "Backup stored locally in $BACKUP_DIR"
            ;;
        *)
            warning "Unknown backup destination: $BACKUP_DESTINATION"
            ;;
    esac
}

# Cleanup old backups
cleanup_old_backups() {
    local retention_days=${BACKUP_RETENTION_DAYS:-7}
    
    log "Cleaning up backups older than $retention_days days..."
    
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$retention_days -delete
    find "$BACKUP_DIR" -name "*.rdb" -mtime +$retention_days -delete
    find "$BACKUP_DIR" -name "*.archive" -mtime +$retention_days -delete
    
    log "Cleanup completed"
}

# Restore from backup
restore_backup() {
    local restore_type=${1:-all}
    local backup_date=${2:-latest}
    
    log "Restoring backup: $restore_type ($backup_date)..."
    
    case $restore_type in
        mongodb)
            restore_mongodb "$backup_date"
            ;;
        redis)
            restore_redis "$backup_date"
            ;;
        files)
            restore_files "$backup_date"
            ;;
        all)
            restore_mongodb "$backup_date"
            restore_redis "$backup_date"
            restore_files "$backup_date"
            ;;
    esac
    
    log "Restore completed"
}

# Restore MongoDB
restore_mongodb() {
    local backup_date=${1:-latest}
    log "Restoring MongoDB from backup..."
    
    local backup_file
    if [[ "$backup_date" == "latest" ]]; then
        backup_file=$(ls -t "$BACKUP_DIR"/mongodb_backup_*.tar.gz 2>/dev/null | head -1)
    else
        backup_file="$BACKUP_DIR/mongodb_backup_${backup_date}.tar.gz"
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
    fi
    
    # Extract and restore
    local temp_dir=$(mktemp -d)
    tar -xzf "$backup_file" -C "$temp_dir"
    
    # Stop current MongoDB
    docker-compose stop mongodb
    
    # Restore data
    docker run --rm \
        -v "$temp_dir":/backup \
        -v ${PROJECT_NAME}_mongo_data:/data/db \
        mongo:7.0 \
        mongorestore --drop /backup/*/
    
    # Start MongoDB
    docker-compose start mongodb
    
    rm -rf "$temp_dir"
    log "MongoDB restore completed"
}

# Main backup function
main_backup() {
    log "Starting backup process..."
    log "Backup Type: $BACKUP_TYPE"
    log "Destination: $BACKUP_DESTINATION"
    
    create_backup_dir
    
    local backup_files=()
    
    case $BACKUP_TYPE in
        database)
            backup_mongodb
            backup_redis
            backup_files+=($(ls "$BACKUP_DIR"/*_backup_$TIMESTAMP.*))
            ;;
        files)
            backup_files
            backup_files+=($(ls "$BACKUP_DIR"/uploads_backup_$TIMESTAMP.*))
            ;;
        all)
            backup_mongodb
            backup_redis
            backup_files
            backup_files+=($(ls "$BACKUP_DIR"/*_backup_$TIMESTAMP.*))
            ;;
        *)
            error "Unknown backup type: $BACKUP_TYPE"
            ;;
    esac
    
    upload_to_cloud "${backup_files[@]}"
    cleanup_old_backups
    
    log "Backup process completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [database|files|all] [local|s3|gcs]"
        echo "       $0 --restore [mongodb|redis|files|all] [backup_date]"
        echo ""
        echo "Backup Types:"
        echo "  database  Backup MongoDB and Redis"
        echo "  files     Backup uploaded files"
        echo "  all       Backup everything (default)"
        echo ""
        echo "Destinations:"
        echo "  local     Store locally (default)"
        echo "  s3        Upload to AWS S3"
        echo "  gcs       Upload to Google Cloud Storage"
        echo ""
        echo "Restore:"
        echo "  --restore [type] [date]  Restore from backup"
        exit 0
        ;;
    --restore)
        restore_backup "$2" "$3"
        exit 0
        ;;
    *)
        main_backup
        ;;
esac
