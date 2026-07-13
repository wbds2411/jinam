# 운영 및 출시 절차

## 출시 게이트

1. `npm ci`
2. `npm run test:coverage`
3. `npm run typecheck && npm run build`
4. `npm run test:e2e`
5. `npm audit --omit=dev`
6. Docker build와 컨테이너 smoke
7. `npx cap sync android` 후 서명된 Android 빌드와 실기기 smoke
8. 개인정보·약관·오픈소스 고지 버전 확인

## Tailscale 및 LAN 접속

개발 서버와 미리보기 서버는 `0.0.0.0`에 바인딩해 PC의 LAN/Tailscale 인터페이스에서 접근할 수 있게 한다.

- 개발: `npm run dev` → `http://<PC의 Tailscale IP>:3000`
- 프로덕션 미리보기: `npm run build && npm run preview --workspace=web` → `http://<PC의 Tailscale IP>:4173`
- Docker: `docker compose -f deploy/docker-compose.private.yml up -d --build` → `http://<PC의 Tailscale IP>:8080`

Tailscale IP는 `tailscale ip -4`로 확인한다. `127.0.0.1`은 접속하는 각 기기 자신을 가리키므로 휴대폰이나 다른 PC에서 사용할 수 없다. 앱은 SPA 루트(`/`)로 접속하며 `/admin`을 붙이지 않는다. 외부 장치에서 timeout이면 서버가 `0.0.0.0`에 LISTEN 중인지 확인한 뒤 Windows 방화벽에서 해당 TCP 포트를 Private 네트워크 또는 Tailscale 인터페이스에만 허용한다. 인터넷 전체에 포트를 공개하지 않는다.

## 비밀정보

- API 키, 서명 키, PIN, 사용자 데이터는 저장소·로그·CI artifact에 넣지 않습니다.
- 클라우드 키는 사용자 기기의 암호화 저장소에만 저장합니다.
- Android release keystore는 CI secret store에서 주입하고 접근을 최소화합니다.

## 로그와 관측성

기본 앱은 사용자 메시지, 생년월일, 건강 정보, API 키를 로그로 남기지 않습니다. 운영 지표가 필요하면 동의 기반의 집계·비식별 지표만 사용하고 보존 기간을 문서화합니다. 보안 사건 탐지 로그는 최소 수집과 접근 통제를 적용합니다.

## 백업과 복구

서버에 사용자 프로필을 저장하지 않는 현재 구조에서는 중앙 백업이 없습니다. 사용자는 설정의 JSON 내보내기로 직접 백업합니다. API 키는 내보내지 않습니다. 복구 절차와 PIN 분실 시 복구 불가를 UI와 개인정보 처리방침에 표시합니다.

## 취약점과 공급망

- 매 변경마다 production audit, coverage, SBOM을 생성합니다.
- 심각한 production 취약점은 출시를 차단합니다.
- lockfile과 기반 이미지를 정기적으로 갱신합니다.
- SBOM과 오픈소스 고지는 출시 artifact와 함께 보관합니다.

## 사고 대응

1. 노출 범위와 affected version을 식별합니다.
2. 관련 키를 폐기·교체하고 배포를 중단합니다.
3. 수정 버전을 빌드·검증하고 rollback 또는 hotfix합니다.
4. 법적 통지 요건과 사용자 안내를 검토합니다.
5. 원인·영향·재발 방지 조치를 기록합니다.

## 롤백

Docker 이미지는 immutable tag와 digest를 기록합니다. 모바일은 이전 검증 버전과 서명 자료를 보존합니다. 데이터 형식 변경에는 역호환 merge 또는 명시적 마이그레이션을 제공하고 암호화 실패 시 평문으로 fallback하지 않습니다.
