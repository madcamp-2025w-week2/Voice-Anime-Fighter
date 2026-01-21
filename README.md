# <img src="https://via.placeholder.com/50?text=V" align="center" width="50" height="50"> Voice-Anime-Fight

> **"지옥의 흑염룡이 깨어난다..."** - 오글거림을 힘으로 바꾸는 신개념 음성 배틀 마법소녀 대전 게임

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Transformers](https://img.shields.io/badge/Hugging%20Face-Transformers-FFD21E?logo=huggingface&logoColor=black)](https://huggingface.co/docs/transformers/index)

팀원 : KAIST 24 박성민, 부산대 21 윤민석, 서울대 20 김민기
---

## 📝 목차

1. [프로젝트 소개](#-프로젝트-소개)
   - [기획 의도](#-기획-의도)
   - [주요 기능](#-주요-기능)
2. [시스템 아키텍처](#%EF%B8%8F-시스템-아키텍처)
3. [기술 스택](#%EF%B8%8F-기술-스택)
4. [Getting Started](#-getting-started)
   - [환경 변수 설정](#1-환경-변수-설정-env)
   - [DB Setup](#2-db-setup-docker)
   - [Backend 실행](#3-backend-server-실행)
   - [Frontend 실행](#4-frontend-app-실행)
5. [API 문서](#-api-문서)

---

## 📖 프로젝트 소개

> **"내 왼손엔 흑염룡이 깨어난다!!!"** 
> 마이크를 통해 마법 주문을 외쳐 상대방에게 데미지를 입히세요!

**Voice-Anime-Fight**는 사용자의 목소리를 AI로 분석하여 게임 내 공격력으로 변환하는 실시간 1:1 대전 게임입니다. **목소리의 크기, 정확도, 그리고 '오글거림'**이 승패를 가르는 핵심 요소입니다.

### 🎯 기획 의도

평소에 차마 입 밖으로 내지 못했던 "중2병" 대사들, 마음껏 외쳐보고 싶지 않으셨나요?? **Voice-Anime-Fight**는 그런 흑역사를 강력한 무기로 바꿔줍니다. 친구와 함께 누가 더 부끄러움을 무릅쓰고 '진심'으로 대사를 외칠 수 있는지 겨뤄보세요.

### ✨ 주요 기능

| 기능 | 설명 |
|------|------|
|**오글거림 데미지 산출** | AI 감정 분석 모델이 당신의 목소리에서 '격정적임'을 측정하여 추가 데미지를 부여합니다. |
|**실시간 음성 분석** | Librosa와 Wav2Vec2 모델을 사용하여 음량(dB), 피치, 텍스트 정확도를 실시간으로 분석합니다. |
|**1:1 실시간 대전** | Socket.io 기반의 저지연 통신으로 끊김 없는 실시간 배틀을 제공합니다. |
|**MMR 랭킹 시스템** | 승패에 따라 레이팅이 변동되며, 전 세계의 수치심 없는 플레이어들과 경쟁할 수 있습니다. |
|**캐릭터 & 배경 수집** | 다양한 애니메이션 스타일의 캐릭터와 배경을 선택하여 배틀에 임할 수 있습니다. |

---

## 🏗️ 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────────┐
│                    Web Client (Frontend)                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│  │   Lobby   │  │ Character │  │   Battle  │  │  Result   │  │
│  │           │  │  Select   │  │           │  │           │  │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  │
│        └──────────────┴──────┬───────┴──────────────┘        │
│                              │ Socket.io + HTTP              │
└──────────────────────────────┼───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                    FastAPI Backend (Python)                  │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│  │   Auth    │  │  Ranking  │  │   Battle  │  │  Speech   │  │
│  │           │  │           │  │  Service  │  │ Analysis  │  │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  │
│        │               │             │               │       │
│        │        ┌──────┴─────────────┴──────┐        │       │
│        │        │      State Management     │        │       │
│        │        └────────────┬──────────────┘        │       │
│        │                     │                       │       │
│  ┌─────▼─────┐         ┌─────▼─────┐           ┌─────▼─────┐ │
│  │ PostgreSQL│         │   Redis   │           │ AI Models │ │
│  │ (User/Log)│         │(Real-time)│           │(HuggingF) │ │
│  └───────────┘         └───────────┘           └───────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## 💡 Core Workflow (AI Analysis Pipeline)

사용자의 목소리가 게임 내 공격력으로 변환되는 과정입니다.

### 1. Voice Input & STT (Frontend)
- **Web Audio API**: 마이크 입력을 통해 오디오 데이터를 실시간으로 시각화하고 녹음합니다 (`Blob` 생성).
- **Web Speech API**: 사용자의 발화를 실시간으로 텍스트로 변환(STT)합니다.
- **Socket Stream**: 녹음된 오디오 `Blob`과 변환된 `Text`를 백엔드로 전송합니다.

### 2. Multi-modal Analysis (Backend)
백엔드(`BattleService`)에서는 3가지 측면에서 음성을 분석합니다.

1.  **정확도 평가 (Accuracy)**
    - **알고리즘**: `Levenshtein Distance` (편집 거리)
    - **설명**: 화면에 제시된 마법 주문과 실제 사용자가 외친 텍스트(STT)의 유사도를 계산합니다.
    
2.  **물리적 음성 분석 (Physical Features)**
    - **라이브러리**: `Librosa`
    - **Volume (dB)**: 목소리의 크기를 측정하여 기본 데미지에 반영합니다.
    - **Pitch Variance**: 음의 높낮이 변화를 분석하여 얼마나 생동감 있게 말했는지 판단합니다.

3.  **AI 감정 평가 (Emotion Analysis)**
    - **모델**: `hun3359/wav2vec2-xlsr-53-korean-emotion` (Fine-tuned Wav2Vec2)
    - **설명**: 음성 데이터에서 **'격정적임(Angry, Happy, Surprise)'** 수치를 추출합니다.
    - **Critical Hit**: 감정 점수가 임계값을 넘으면 **'오글거림'**으로 인정되어 **크리티컬 데미지(1.5배)**가 적용됩니다.

### 3. Damage Calculation
최종 데미지는 다음 요소들의 조합으로 결정됩니다.

> **Total Damage** = (Base + Volume Bonus + Cringe Bonus) × Accuracy Multiplier × Critical

---

---

## 🛠️ 기술 스택

### Frontend

| 구분 | 기술 |
|------|------|
| **Language** | JavaScript (ES6+) |
| **Framework** | React 18 + Vite |
| **Styling** | Tailwind CSS |
| **State** | Zustand |
| **Network** | Axois + Socket.io-client |
| **Visuals** | Web Audio API (Canvas Visualization) |
| **STT** | Web Speech API |

### Backend

| 구분 | 기술 |
|------|------|
| **Framework** | FastAPI (Python 3.10+) |
| **Real-time** | python-socketio (Async) |
| **Database** | PostgreSQL (asyncpg) |
| **Cache** | Redis |
| **Audio** | Librosa, NumPy, SciPy |
| **AI/ML** | Wav2Vec2 (wav2vec2-xlsr-53-korean-emotion) |
| **Similarity** | python-Levenshtein |

---

## 🚀 실행 방법

### 1. 환경 변수 설정 (.env)

`backend/.env` 파일을 생성하고 다음 변수들을 설정합니다.

```ini
# --- Database ---
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/voice_fighter
REDIS_URL=redis://localhost:6379/0

# --- Security ---
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# --- AI Configuration (Optional) ---
# GPU 사용 여부 등 설정
USE_CUDA=true
```

### 2. DB Setup (Docker)

Docker Compose를 사용하여 DB와 Redis를 간편하게 실행합니다.

```bash
docker-compose up -d
```

### 3. Backend Server 실행

```bash
cd backend

# 가상환경 생성
python -m venv venv

# 가상환경 활성화 (Windows)
.\venv\Scripts\activate
# (Mac/Linux: source venv/bin/activate)

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
uvicorn main:application --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend App 실행

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

> **Note:** 프론트엔드는 `http://localhost:5173`에서 실행됩니다.

---

## 📡 API 문서

서버 실행 후 아래 URL에서 자동 생성된 문서를 확인할 수 있습니다:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

### 주요 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/api/v1/auth/login` | 사용자 로그인 및 토큰 발급 |
| `POST` | `/api/v1/battle/analyze` | 음성 데이터 분석 요청 |
| `WS` | `/socket.io/` | 실시간 배틀 및 채팅 소켓 연결 |
| `GET` | `/api/v1/ranking/top` | 상위 랭커 조회 |

---

<p align="center">
  <b>at MadCamp 2025 Week 2</b>
</p>
