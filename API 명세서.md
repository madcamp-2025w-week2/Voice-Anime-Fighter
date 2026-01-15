# Voice-Anime-Fighter API 명세서

> FastAPI 자동 문서: `http://localhost:8000/docs` (Swagger UI) 또는 `http://localhost:8000/redoc` (ReDoc)

---

## 🎯 Base URL

```
Development: http://localhost:8000/api/v1
Production: https://your-domain.com/api/v1
```

---

## 🔐 인증 (Authentication)

### POST `/auth/login`
게스트 또는 소셜 로그인

**Request Body:**
```json
{
  "provider": "guest" | "google" | "kakao",
  "token": "string (optional, for social login)"
}
```

**Response:**
```json
{
  "access_token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "nickname": "마법소녀루루핑",
    "elo_rating": 1200,
    "avatar_url": "/assets/avatars/default.png"
  }
}
```

---

## 👤 유저 (Users)

### GET `/users/me`
현재 로그인한 유저 정보

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "uuid",
  "nickname": "string",
  "elo_rating": 1200,
  "wins": 10,
  "losses": 5,
  "main_character_id": "char_001",
  "created_at": "2026-01-15T00:00:00Z"
}
```

### GET `/users/ranking`
글로벌 랭킹 조회

**Query Params:** `?limit=50&offset=0`

**Response:**
```json
{
  "rankings": [
    {
      "rank": 1,
      "user_id": "uuid",
      "nickname": "string",
      "elo_rating": 2500,
      "wins": 100,
      "main_character_id": "char_001"
    }
  ],
  "total": 1000
}
```

---

## 🎭 캐릭터 (Characters)

### GET `/characters`
전체 캐릭터 목록

**Response:**
```json
{
  "characters": [
    {
      "id": "char_001",
      "name": "마법소녀 루루핑",
      "description": "오글거림의 여왕",
      "stats": {
        "cringe_level": 95,
        "volume_req": 70,
        "precision": 80
      },
      "spell_text": "마법소녀 카와이 러블리 루루핑!",
      "thumbnail_url": "/assets/characters/luluping_thumb.png",
      "sprite_url": "/assets/characters/luluping_sprite.png",
      "is_unlocked": true
    }
  ]
}
```

### GET `/characters/{character_id}`
특정 캐릭터 상세 정보

---

## 🏠 방 / 로비 (Rooms)

### POST `/rooms`
새 방 생성

**Request Body:**
```json
{
  "name": "친구와 한판!",
  "is_private": false,
  "password": "string (optional)"
}
```

**Response:**
```json
{
  "room_id": "room_uuid",
  "invite_code": "ABC123",
  "host_id": "user_uuid",
  "created_at": "2026-01-15T00:00:00Z"
}
```

### GET `/rooms`
열린 방 목록 조회

**Response:**
```json
{
  "rooms": [
    {
      "room_id": "uuid",
      "name": "string",
      "host_nickname": "string",
      "player_count": 1,
      "max_players": 2,
      "is_private": false,
      "status": "waiting" | "playing"
    }
  ]
}
```

### POST `/rooms/{room_id}/join`
방 참가

### DELETE `/rooms/{room_id}`
방 삭제 (호스트만)

---

## ⚔️ 배틀 (Battle)

### POST `/battle/voice-analyze`
🎤 **핵심 API**: 음성 파일 분석 및 데미지 계산

**Headers:** `Content-Type: multipart/form-data`

**Request Body:**
```
audio_file: File (webm/wav/mp3)
battle_id: string
expected_spell: string (정답 주문 텍스트)
```

**Response:**
```json
{
  "success": true,
  "transcription": "마법소녀 카와이 러블리 루루핑",
  "analysis": {
    "text_accuracy": 0.95,
    "volume_db": 78.5,
    "pitch_variance": 0.32,
    "confidence": 0.88
  },
  "damage": {
    "base_damage": 100,
    "cringe_bonus": 25,
    "volume_bonus": 15,
    "accuracy_multiplier": 1.2,
    "total_damage": 168
  },
  "grade": "SSS" | "S" | "A" | "B" | "C" | "F",
  "animation_trigger": "special_attack_01"
}
```

**에러 응답 (인식 실패 시):**
```json
{
  "success": false,
  "error": "음성 인식 실패",
  "damage": {
    "total_damage": 0
  },
  "grade": "F"
}
```

---

## 🔌 WebSocket Events (Socket.io)

### Connection
```javascript
const socket = io("ws://localhost:8000", {
  auth: { token: "jwt_token" }
});
```

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `room:join` | `{ room_id }` | 방 입장 |
| `room:leave` | `{ room_id }` | 방 퇴장 |
| `room:ready` | `{ room_id, is_ready }` | 준비 상태 토글 |
| `chat:message` | `{ room_id, message }` | 채팅 메시지 |
| `battle:attack` | `{ battle_id, damage_data }` | 공격 데미지 전송 |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `room:player_joined` | `{ user }` | 플레이어 입장 알림 |
| `room:player_left` | `{ user_id }` | 플레이어 퇴장 알림 |
| `room:game_start` | `{ battle_id, opponent }` | 게임 시작 |
| `chat:new_message` | `{ user, message, timestamp }` | 새 채팅 수신 |
| `battle:damage_received` | `{ attacker_id, damage, target_hp }` | 데미지 적용 알림 |
| `battle:result` | `{ winner_id, stats }` | 게임 종료 결과 |

---

## 📊 데이터 모델

### User
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| nickname | string | 닉네임 |
| elo_rating | int | ELO 레이팅 (기본 1200) |
| wins | int | 승리 수 |
| losses | int | 패배 수 |
| main_character_id | string | 대표 캐릭터 |

### Character
| Field | Type | Description |
|-------|------|-------------|
| id | string | 캐릭터 ID (예: char_001) |
| name | string | 캐릭터 이름 |
| cringe_level | int | 오글거림 수치 (0-100) |
| volume_req | int | 성량 요구도 (0-100) |
| precision | int | 정확도 요구치 (0-100) |
| spell_text | string | 필살 주문 텍스트 |

### Battle
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | 배틀 ID |
| player1_id | UUID | 플레이어 1 |
| player2_id | UUID | 플레이어 2 |
| status | enum | waiting/playing/finished |
| winner_id | UUID | 승리자 (nullable) |

---

## ⚠️ Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_INVALID_TOKEN | 401 | 유효하지 않은 토큰 |
| AUTH_EXPIRED | 401 | 토큰 만료 |
| ROOM_NOT_FOUND | 404 | 방을 찾을 수 없음 |
| ROOM_FULL | 400 | 방이 꽉 참 |
| BATTLE_NOT_STARTED | 400 | 배틀이 시작되지 않음 |
| VOICE_RECOGNITION_FAILED | 422 | 음성 인식 실패 |