# 개인서버(private) 배포 스크립트
# Docker Compose로 Caddy 정적 서버 실행

$ErrorActionPreference = "Stop"

Write-Host "Building Compass web for private deployment..."
docker compose -f "$PSScriptRoot/docker-compose.private.yml" up --build -d

Write-Host ""
Write-Host "Deployed. Access: http://localhost:8080"
