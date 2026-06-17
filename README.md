# 판타지월드 MVP

판타지 왕국 기본판을 기준으로 만든 2인 플레이용 웹 MVP입니다. 로컬 같은 Wi-Fi 테스트와 Render + Upstash Redis 원격 배포를 지원합니다.

## 실행

```powershell
npm start
```

서버가 실행되면 터미널에 아래와 같은 주소가 표시됩니다.

```text
Fantasy World MVP running on http://localhost:3000
Same Wi-Fi URL: http://192.168.x.x:3000
```

아이폰 2대가 같은 Wi-Fi에 연결된 상태에서 `Same Wi-Fi URL` 주소로 접속합니다.

## 원격 배포

다른 장소에 있는 사람과 플레이하려면 Render Web Service로 배포하고 Upstash Redis를 연결합니다.

1. 프로젝트를 GitHub 저장소에 올립니다.
2. Upstash에서 Redis DB를 만들고 REST URL/TOKEN을 확인합니다.
3. Render에서 새 Web Service를 만들고 이 저장소를 연결합니다.
4. Render 설정은 `render.yaml`을 기준으로 둡니다.
5. Render 환경변수에 아래 값을 넣습니다.

```text
UPSTASH_REDIS_REST_URL=Upstash REST URL
UPSTASH_REDIS_REST_TOKEN=Upstash REST Token
ROOM_TTL_SECONDS=86400
```

`UPSTASH_REDIS_REST_URL`과 `UPSTASH_REDIS_REST_TOKEN`을 모두 넣으면 방 상태가 Redis에 저장됩니다. 서버가 잠들거나 재시작돼도 TTL 안에서는 방 상태를 다시 불러올 수 있습니다. 두 값을 넣지 않으면 로컬 개발용 메모리 저장소로 실행됩니다.

## 플레이 흐름

1. 한 명이 방을 만듭니다.
2. 표시된 초대코드를 다른 플레이어가 입력합니다.
3. 두 명이 모이면 게임을 시작합니다.
4. 자기 턴에는 카드 1장을 가져온 뒤 카드 1장을 버립니다.
5. 공개 버린 카드가 10장이 되면 게임이 종료됩니다.
6. 종료 후 수동 점수판에 기본 힘과 보너스/페널티를 입력합니다.

## 1차 버전 범위

- 2인 로컬 Wi-Fi 접속
- Render 원격 접속
- Upstash Redis 방 상태 저장
- 방 코드 입장
- 각자 손패 비공개
- 덱/버린 카드/턴 동기화
- 원본 기본판 53장 카드
- 수동 점수판 합계 계산

## 제외된 기능

- 자동 점수 계산
- 3인 이상 플레이
- 확장 카드
