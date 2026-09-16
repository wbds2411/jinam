# 결정의 나침반 (Compass)

> 개인 의사결정 상담 앱. 동서양 운세·심리·뇌과학·한의학적 근거를 거울 삼아, 지치거나 위축되거나 결정을 못 내릴 때 "오늘의 한 걸음"으로 이끕니다.

## 주요 특징

- **데이터 정확성**: 한국천문연구원(KASI) 데이터 기반 `kor-lunar` + MIT `astronomia`로 만세력/절기 계산
- **안전장치**: 자해/타해 신호 감지 시 점술 응답 즉시 중단 → 위기 상담 전화 연결
- **프라이버시 우선**: 생년월일시·건강정보 등 민감정보는 WebCrypto AES-GCM + PIN으로 로컬 암호화
- **확장성**: `OracleModule` 인터페이스로 모든 도구(사주/별자리/타로/심리 등) 플러그인화
- **배포 타깃 게이팅**: `DEPLOY_TARGET=private|public`으로 기능/보안 기본값 분리

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프론트엔드 | React 18 + TypeScript + Vite + Tailwind CSS |
| 모바일 | Capacitor (2단계) |
| 상태 관리 | Zustand (persist + WebCrypto 암호화) |
| 계산 엔진 | TypeScript (`kor-lunar`, `astronomia`) |
| AI 레이어 | LLMProvider 추상화 (Ollama / OpenAI / Claude 사용자 키) |
| 테스트 | Vitest (단위), jsdom (컴포넌트) |
| 배포 | Docker Compose + Caddy |

## 빠른 시작

```bash
# 의존성 설치
npm install

# 엔진 빌드 (web에서 사용하기 위해 필요)
npm run build --workspace=engine

# 개발 서버
npm run dev

# 테스트
npm test

# 타입 체크
npm run typecheck
```

## 개인서버 배포 (Private)

```bash
# web 빌드
npm run build

# Docker Compose로 실행
docker compose -f deploy/docker-compose.private.yml up -d
```

브라우저에서 `https://localhost` 접속 (Caddy가 자동으로 로컬 HTTPS 처리).

## 공개 모바일 빌드 (Public, 2단계)

```bash
npm run build
npx cap sync
npx cap open android
# 또는
npx cap open ios
```

## 골든 케이스 검증

테스트에 포함된 본인 데이터:

- 1980-03-19 01:45 대구 남
- 일간: 辛(금), 4주: 庚申/己卯/辛卯/己丑
- 오행: 木25 / 火0 / 土37.5 / 金37.5 / 水0
- 용신: 木, 대운수: 6

```bash
npm run test --workspace=engine
```

## 안전 및 면책

- 본 앱은 **의료 상담이나 점술 단정을 제공하지 않습니다**.
- 건강·정신건갡·법률·금육 등 중대한 결정은 반드시 해당 분야 전문가와 상담하세요.
- 위기 상황 시 전문 상담사와 연결하세요: **자살예방상담전화 109**, **정신건강위기상담전화 1577-0199** (한국)

## 라이선스

ISC (단, 외부 라이브러리 및 데이터의 라이선스는 각각의 조건을 따름)
