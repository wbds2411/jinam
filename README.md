# 결정의 나침반 (Compass)

> 고민과 선택 기준을 기록하고 다음 행동을 정리하는 개인 의사결정 앱. 현재 웹에서는 로컬 기록·사주 미리보기·기간별 사주 참고 해석·꿈 상징 해석과 재미용 번호 추천을 제공합니다. 개인 AI 서버를 연결하면 본인·가족 사주, 집·사무실 설명, 꿈과 수비학을 함께 활용하는 AI 상담을 제공합니다.

## 현재 웹 구현과 설계 기준

NeuroDefense v3.1의 정보 정확성·입력 접근성·통제와 복구 원칙을 적용했습니다. 적용 범위와 검증 한계는 [프로젝트 적용 기록](docs/neuro-defense-application.md)을 참고하세요.

PIN으로 이 브라우저의 프로필·설정·기록을 암호화합니다. 프로필 입력을 건너뛰고 기록할 수 있으며, 저장 실패 재시도·전체 내보내기·삭제를 지원합니다. 내보내기 파일은 평문이고 PIN 복구·파일 가져오기·기기 간 동기화는 지원하지 않습니다.

## 엔진·아키텍처 특징

- **데이터 정확성**: 한국천문연구원(KASI) 데이터 기반 `kor-lunar` + MIT `astronomia`로 만세력/절기 계산
- **안전장치**: 상담 엔진에 자해/타해 신호 감지 로직 포함. 현재 웹 기록 화면에는 자동 상담 엔진이 연결되지 않음
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
| AI 레이어 | Python gateway + 공통 `vibe_ai` (로컬·어그리게이터·API·구독 CLI·호환 주소, 복수 연결) |
| 테스트 | Vitest (단위), jsdom (컴포넌트) |
| 배포 | Docker Compose + Caddy |

## 빠른 시작

```bash
# 의존성 설치
npm install

# 엔진 빌드 (web에서 사용하기 위해 필요)
npm run build --workspace=engine

# AI 서버 (공통 모듈 경로 기본값: ~/w/ops/vibe/commons)
python3 -m venv server/.venv
server/.venv/bin/pip install -r server/requirements.txt
npm run dev:server

# 다른 터미널에서 웹 개발 서버
npm run dev

# 테스트
npm test
npm run test:server

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

브라우저에서 `http://localhost:8080`에 접속합니다. Docker build에는 공통 저장소가 필요하며 `VIBE_COMMONS`로 경로를 지정할 수 있습니다. 포트는 localhost에만 공개합니다. 컨테이너에서는 구독 CLI를 차단하며, 로컬 Ollama 주소는 `http://host.docker.internal:11434`로 등록하세요. 구독 CLI는 같은 PC에서 실행하는 Python 서버를 사용합니다. 공개 인터넷 배포와 다중 사용자 인증은 지원하지 않습니다.

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
- 건강·정신건강·법률·금융 등 중대한 결정은 반드시 해당 분야 전문가와 상담하세요.
- 위기 상황 시 전문 상담사와 연결하세요: **자살예방상담전화 109**, **정신건강위기상담전화 1577-0199** (한국)

## 라이선스

ISC (단, 외부 라이브러리 및 데이터의 라이선스는 각각의 조건을 따름)

## AI 운세·꿈해몽·자유 질문

- 오늘·내일·특정 양력 날짜·이번 달·올해를 선택합니다. 본인 사주 일간과 기간 간지를 비교하고, AI 월운에는 7일 간격의 일주 표본, 연운에는 매월 15일의 월주·십성 계산을 함께 제공합니다. 절기 전체·대운 변화를 정밀 종합한 미래 예측은 아닙니다. 지원 날짜는 1900~2100년입니다.
- 자유 질문은 오늘의 고민에 한정하지 않습니다. 인생, 가족, 재물과 복권에 관한 질문도 받으며, AI의 추가 질문에 이어서 답할 수 있습니다.
- 설정에서 가족의 양력/음력 생년월일·시각·성별을 선택적으로 저장하면 가족 사주를 실제 계산합니다. 집·사무실은 입구/책상 방향과 배치·채광·환경 설명을 저장합니다. 생일이나 방향을 모르면 정보 부족으로 표시합니다. 주소 기반 지리 계산이나 현장 풍수 감정은 없습니다.
- 본인 사주는 해석에 사용하며 가족·공간·생활 맥락은 요청마다 체크한 자료만 보냅니다. 원래 생년월일 대신 사주 계산값을 보내지만 계산값도 개인정보입니다. 꿈 수비학은 저장된 생년월일 표기의 숫자 합을 한 자리로 줄인 전통적 놀이 규칙입니다.
- AI 번호 추천은 모델이 제안한 1~45 상징 후보와 각 근거를 표시합니다. 중복을 제거하고 부족한 번호는 WebCrypto 무작위 번호로 보완합니다. 번호마다 상징 대응인지 무작위 보완인지 구분합니다. 모든 조합의 당첨 확률은 같으며 꿈·사주·풍수가 확률을 높이지 않습니다.
- 서버가 없거나 모델이 없으면 기기 해석을 선택할 수 있습니다. 이 경로는 기존 사전식 꿈 상징과 간단한 사주 참고 해석이며 AI 응답으로 표시하지 않습니다.

## AI 서버와 저장 범위

설정 → AI 연결에서 여러 모델을 등록·활성화합니다. 지원 카탈로그는 `vibe-commons/python/src/vibe_ai/catalog.py`를 그대로 사용합니다. Ollama, LM Studio, vLLM, llama.cpp, OpenRouter, OpenAI, Anthropic, Gemini, Claude/Codex/Gemini CLI, 직접 지정 호환 주소를 지원합니다. 카탈로그 지원과 모든 공급자 실접속 검증은 구분합니다.

API 키는 서버의 `~/.local/share/jinam/ai/connections.json`에 0600 권한으로 저장하며 브라우저에는 키 유무만 반환합니다. 이 파일은 PIN 암호화 범위 밖에 있고 서버 사용자가 관리합니다. 브라우저의 전체 데이터 삭제는 서버 연결을 삭제하지 않습니다. 연결은 AI 설정에서 별도로 삭제하세요. 서버는 질문·프로필·결과를 디스크나 요청 로그에 저장하지 않습니다. 연결 설정은 이 서버를 사용하는 브라우저들이 공유하므로 개인 PC 전용입니다.

공통 모듈 경로는 `VIBE_COMMONS`, 연결 저장 경로는 `JINAM_AI_DATA`, 바인드는 `JINAM_BIND`, 허용 Host 목록은 `JINAM_ALLOWED_HOSTS`, CLI 허용은 `JINAM_ALLOW_CLI=0|1`로 지정합니다. 기본 서버는 `127.0.0.1:8787`이고 웹의 `/api` 프록시로 접근합니다. 개발 포트 3000/3001과 Docker 포트 8080의 localhost를 허용합니다. 개발 포트를 바꾸면 허용 Host 목록도 명시해야 합니다. 다른 앱이 3000을 사용하면 Vite가 3001을 선택합니다.

외부 연결은 활성화하기 전에 전송 자료와 공급자 안내에 동의합니다. 로컬 공급자는 localhost·사설 IP로 제한합니다. CLI 로그인은 서버 터미널에서 사용자가 수행하며 앱이 로그인/로그아웃을 대신하지 않습니다. CLI 도구 차단·임시 작업 디렉터리·환경 키 제거는 공통 모듈을 사용합니다.

선택한 여러 연결의 응답을 따로 표시합니다. 한 연결 실패 시 다른 결과와 입력을 유지하고 그 연결만 다시 시도합니다. 서버는 대기·진행 이벤트를 보내며 브라우저는 60초 무응답을 감지합니다. JSON 구조, 출처 id, 번호 범위와 일부 미래 확정 표현을 검증하고 실패하면 같은 모델에 한 번 수정 요청합니다. 자연어 의미나 모든 환각을 완전히 검증하지는 못합니다. 다른 공급자로 자동 대체하지 않습니다. 중지는 브라우저의 수신을 중단하며 공급자가 이미 처리 중인 작업의 취소·과금 중단까지 보장하지 않습니다.

입력과 결과는 기록 저장 전까지 새로고침하면 사라집니다. 결과를 기록하면 기존 PIN 암호화 저장소에 사용 자료와 모델 이름을 함께 보관하며 저장 실패 재시도를 재사용합니다.

브라우저 흐름 검증은 `npm run test:e2e --workspace=web`로 실행합니다. 웹과 Python 서버가 먼저 실행되어야 합니다. `JINAM_E2E_URL`로 URL을, `PLAYWRIGHT_CHROMIUM_EXECUTABLE`로 설치된 Chromium 경로를 지정할 수 있습니다. AI 생성 응답은 이 테스트에서 모의 응답을 사용하며 연결 등록·가족/공간·암호화 저장은 실제 서버와 브라우저를 사용합니다. 테스트용 연결은 실행 후 삭제합니다. 실제 생성 검증은 별도로 로컬 Ollama에 합성 자료를 보내 확인했습니다.

### AI 서버를 계속 실행하기

현재 개발 주소 `http://127.0.0.1:5175`도 허용합니다. 서버가 중단되지 않도록 사용자 서비스로 실행할 수 있습니다.

```bash
mkdir -p ~/.config/systemd/user
cp deploy/jinam-ai.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now jinam-ai.service
systemctl --user status jinam-ai.service
journalctl --user -u jinam-ai.service -n 50
```

설정 화면은 저장된 연결의 상태를 자동 조회합니다. 새 CLI 공급자를 선택하면 저장 전에도 로그인 상태와 모델 목록을 자동 조회하고, CLI 설정 모델과 목록 기본 모델을 표시합니다. `기본 모델을 입력에 가져오기` 후 `연결 저장`을 눌러 적용합니다. 조회만으로 저장 모델을 변경하지 않습니다.

실환경 조회 검증은 `web/e2e/ai-model-settings-live.mjs`이며 실제 설치된 Codex/Claude와 Ollama를 사용합니다. 연결을 저장하거나 생성 요청을 보내지 않습니다. 현재 환경 설정 모델 gpt-6.1-sol/opus를 기대값으로 사용합니다.

Tailscale로 접속할 때는 localhost 검사만으로 정상 여부를 판단할 수 없습니다. 실제 접속 Host를 `JINAM_ALLOWED_HOSTS`에 명시해야 합니다. 현재 사용자 서비스의 `~/.config/systemd/user/jinam-ai.service.d/private-hosts.conf`에 이 머신 Tailscale IP의 5175 포트를 허용했습니다. IP/포트 변경 시 해당 파일을 갱신하고 `systemctl --user daemon-reload && systemctl --user restart jinam-ai.service`를 실행합니다. API는 localhost에 바인드되고 Vite를 통해 접속합니다.

HTTP IP 주소는 브라우저 WebCrypto의 secure context가 아니므로 새 PIN 설정/기록 잠금 해제가 실패할 수 있습니다. `ai-settings-remote.mjs`는 이 조건에서 AI 설정 컴포넌트만 분리 렌더링하여 실제 원격 API 연결을 검사하며 전체 PIN 흐름 통과를 의미하지 않습니다. 사용자 저장 데이터나 제품 인증 코드는 변경하지 않습니다.

설정 화면 맨 위 `서버에서 로그인한 AI`에서 Claude/Codex/Gemini CLI의 인증 상태를 자동 확인합니다. Claude는 claude.ai, Codex는 ChatGPT 인증을 구분해 표시합니다. 각 카드에 실제 CLI 모델 목록을 담은 드롭다운이 있고, 신규 연결의 기본 모델은 임시 선택으로 표시합니다. 기존 앱 저장 모델은 조회로 변경하지 않습니다. 전송 동의 후 `이 인증으로 연결 저장`, 기존 연결은 `모델 저장`으로 적용하고 `이 AI를 기본으로 사용`으로 기본 연결을 지정합니다. API 키로 로그인한 CLI는 구독 로그인으로 표시하지 않습니다.

`web/e2e/ai-auth-dropdown.mjs`는 인증 자동 표시/드롭다운/명시 저장/실패 보존/재접속의 합성 API 검사입니다. `web/e2e/ai-settings-remote.mjs`는 실제 Tailscale 주소에서 인증 카드와 실제 드롭다운 옵션을 확인하며 저장 및 생성은 하지 않습니다.
