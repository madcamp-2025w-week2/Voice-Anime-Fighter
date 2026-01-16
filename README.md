# 🌟 마법소녀 루루핑 (Voice-Anime-Fighter)

> 오글거림 음성 기반 마법으로 인기 애니메이션 주인공들을 물리치는 언더독 마법소녀 대전 게임

![Game Logo](https://via.placeholder.com/800x200/ec4899/ffffff?text=%E2%9C%A8+%EB%A7%88%EB%B2%95%EC%86%8C%EB%85%80+%EB%A3%A8%EB%A3%A8%ED%95%91+%E2%9C%A8)

## 🎮 게임 소개

**즈큥도큥 바큥부큥!** 마이크를 통해 마법 주문을 외쳐 상대방에게 데미지를 입히세요!

- 🎤 **음성 기반 전투**: Azure Speech SDK를 통한 음성 인식
- 💥 **오글거림 데미지**: 더 오글거릴수록 더 강한 데미지
- 🏆 **ELO 랭킹 시스템**: 글로벌 랭킹 경쟁
- 👥 **실시간 멀티플레이어**: Socket.io 기반 1:1 대전

## 🛠️ 기술 스택

### Frontend
- React 18 + Vite
- Tailwind CSS
- Zustand (상태 관리)
- Lucide React (아이콘)
- Socket.io Client

### Backend
- FastAPI (Python)
- Socket.io (실시간 통신)
- Azure Speech SDK (STT)
- Librosa (음성 분석)

### Infrastructure
- PostgreSQL (유저/랭킹 데이터)
- Redis (실시간 배틀 상태)
- Docker Compose

## 📁 프로젝트 구조

```
Voice-Anime-Fighter/
├── docker-compose.yml          # PostgreSQL + Redis
├── API 명세서.md               # API 문서
│
├── backend/                    # FastAPI 서버
│   ├── main.py                 # 앱 진입점
│   ├── config.py               # 환경 설정
│   ├── domain/                 # 도메인 레이어
│   │   ├── entities.py         # User, Character, Battle 등
│   │   └── repositories.py     # 추상 레포지토리
│   ├── use_cases/              # 비즈니스 로직
│   │   ├── battle_service.py   # 음성 분석 + 데미지 계산
│   │   ├── room_service.py     # 방 관리
│   │   └── ranking_service.py  # ELO 레이팅
│   └── adapters/               # 어댑터 레이어
│       ├── api/routes/         # REST API
│       └── socket/handlers.py  # Socket.io 이벤트
│
└── frontend/                   # React 앱
    ├── src/
    │   ├── screens/            # 화면 컴포넌트
    │   │   ├── TitleScreen.jsx
    │   │   ├── LobbyScreen.jsx
    │   │   ├── CharacterSelectScreen.jsx
    │   │   ├── MatchmakingScreen.jsx
    │   │   ├── BattleScreen.jsx
    │   │   ├── ResultScreen.jsx
    │   │   └── SocialScreen.jsx
    │   ├── stores/             # Zustand 상태
    │   └── hooks/              # 커스텀 훅
    │       ├── useSocket.js
    │       ├── useSpeechRecognition.js
    │       └── useAudioVisualizer.js
    └── tailwind.config.js
```

## 🚀 시작하기

### 1. Docker 환경 실행

```bash
# PostgreSQL + Redis 시작
docker-compose up -d
```

### 2. Backend 설정

```bash
cd backend

# 1. 가상환경 생성 및 활성화
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS/Linux
# python3 -m venv venv
# source venv/bin/activate

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일에서 AZURE_SPEECH_KEY 설정

# 3. 의존성 설치 (가상환경이 활성화된 상태에서 실행)
# Poetry를 사용하는 경우
poetry install

# 또는 pip 사용 시
pip install fastapi uvicorn python-socketio sqlalchemy asyncpg redis pydantic-settings python-jose passlib python-multipart azure-cognitiveservices-speech librosa numpy scipy aiofiles

# 4. 서버 실행
uvicorn main:application --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 4. 접속
- Frontend: http://localhost:5173
- Backend API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🎯 핵심 기능

### 배틀 시스템

1. **음성 녹음**: MediaRecorder API로 주문 녹음
2. **음성 분석**: Azure Speech SDK로 텍스트 변환 + Librosa로 음량/피치 분석
3. **데미지 계산**:
   ```
   total_damage = (base + cringe_bonus + volume_bonus) × accuracy_multiplier
   ```
4. **등급 판정**: SSS ~ F 등급과 애니메이션 트리거

### 실시간 통신

- Socket.io를 통한 실시간 방 입장/퇴장
- 실시간 채팅
- 배틀 데미지 동기화

## 🎨 화면 구성

| 화면 | 설명 |
|------|------|
| 타이틀 | 게임 시작, 마이크 테스트 |
| 로비 | 프로필, 캐릭터, 메뉴 |
| 캐릭터 선택 | 철권 스타일 그리드 |
| 대기실 | VS 화면, 상대 정보 |
| 배틀 | HP바, 음성 시각화, 주문 자막 |
| 결과 | 승패, ELO 변동, 통계 |
| 소셜 | 방 목록, 채팅, 랭킹 |

## 📝 라이선스

MIT License

---

**🌟 마법소녀 카와이 러블리 루루핑! 🌟**
