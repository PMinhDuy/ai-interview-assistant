#!/usr/bin/env bash

# ==============================================================================
# AI Interview Assistant - Local Infrastructure Setup Script
# ==============================================================================
# Script này được dùng để khởi chạy & kiểm tra các dịch vụ local (PostgreSQL, Redis).
# AI Model (LLM & Embeddings) sử dụng Google Gemini Cloud API (0 MB local RAM).
# ==============================================================================

set -e

# Màu sắc hiển thị terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ------------------------------------------------------------------------------
# 1. Kiểm tra Docker & Docker Compose
# ------------------------------------------------------------------------------
log_info "Kiểm tra môi trường Docker..."
if ! command -v docker &> /dev/null; then
    log_error "Docker chưa được cài đặt. Vui lòng cài đặt Docker Desktop trước."
    exit 1
fi

if ! docker info &> /dev/null; then
    log_error "Docker daemon không chạy. Vui lòng mở Docker Desktop và thử lại."
    exit 1
fi
log_success "Docker Engine sẵn sàng."

# ------------------------------------------------------------------------------
# 2. Kiểm tra file cấu hình .env
# ------------------------------------------------------------------------------
log_info "Kiểm tra file cấu hình môi trường (.env)..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        log_warning "Chưa tìm thấy file .env. Đang tự động sao chép từ .env.example..."
        cp .env.example .env
        log_success "Đã khởi tạo file .env từ .env.example."
    else
        log_error "Không tìm thấy .env hoặc .env.example!"
        exit 1
    fi
else
    log_success "File .env đã tồn tại."
fi

# ------------------------------------------------------------------------------
# 3. Khởi chạy Docker Containers (PostgreSQL + pgvector, Redis)
# ------------------------------------------------------------------------------
log_info "Đang khởi chạy Docker Compose (PostgreSQL, Redis)..."
docker compose up -d --remove-orphans

# ------------------------------------------------------------------------------
# 4. Kiểm tra Health Check của các Container
# ------------------------------------------------------------------------------
log_info "Kiểm tra trạng thái sẵn sàng của dịch vụ..."

wait_for_container() {
    local container_name=$1
    local max_retries=20
    local count=0

    while [ $count -lt $max_retries ]; do
        local status
        status=$(docker inspect --format='{{json .State.Health.Status}}' "$container_name" 2>/dev/null || echo "unknown")
        
        if [ "$status" == "\"healthy\"" ]; then
            log_success "Container '$container_name' đã sẵn sàng (healthy)."
            return 0
        elif [ "$status" == "unknown" ]; then
            if [ "$(docker inspect --format='{{.State.Running}}' "$container_name" 2>/dev/null)" == "true" ]; then
                log_success "Container '$container_name' đang chạy."
                return 0
            fi
        fi
        
        count=$((count + 1))
        sleep 2
    done

    log_warning "Container '$container_name' khởi động lâu hơn dự kiến. Hãy kiểm tra bằng: docker compose logs $container_name"
}

wait_for_container "ai-interview-postgres"
wait_for_container "ai-interview-redis"

# ------------------------------------------------------------------------------
# 5. Báo cáo trạng thái hoàn tất
# ------------------------------------------------------------------------------
echo ""
log_info "Trạng thái các container hiện tại:"
docker compose ps

echo ""
log_success "🎉 Khởi tạo hạ tầng container local hoàn tất!"
echo -e "${BLUE}====================================================${NC}"
echo -e " 🐘 PostgreSQL : ${GREEN}localhost:5432${NC}"
echo -e " 🔴 Redis      : ${GREEN}localhost:6379${NC}"
echo -e " ☁️ AI Engine  : ${GREEN}Google Gemini Cloud API${NC}"
echo -e "${BLUE}====================================================${NC}"
echo -e "💡 Tiến hành chạy app: ${YELLOW}pnpm dev${NC}"
