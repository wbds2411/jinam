# 공개 모바일(public) 빌드 스크립트
# Capacitor Android/iOS 프로젝트 동기화

$ErrorActionPreference = "Stop"

Write-Host "Building web assets..."
npm run build --workspace=engine
npm run build --workspace=web

Write-Host "Syncing Capacitor platforms..."
npx cap sync android
npx cap sync ios

Write-Host ""
Write-Host "Mobile projects updated. Open with:"
Write-Host "  npx cap open android"
Write-Host "  npx cap open ios"
