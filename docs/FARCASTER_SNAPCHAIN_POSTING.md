### Farcaster/Snapchain 포스팅 구현 가이드 (Next.js + Snapchain Hub + Warpcast)

본 문서는 아래 두 공식 문서만을 근거로, 본 프로젝트(Next.js, `app/` 라우터 구조)에 Farcaster 및 Snapchain(허브)에 “포스팅” 기능을 구현하기 위한 실무 가이드입니다. 문서만으로도 구현이 가능한 수준으로 상세히 작성되었습니다.

- 참조 1: Snapchain Guide – Writing messages [`https://snapchain.farcaster.xyz/guides/writing-messages`]
- 참조 2: Farcaster Warpcast API Reference [`https://docs.farcaster.xyz/reference/warpcast/api`]


## 개요

- **Snapchain Hub (프로토콜 레벨 쓰기)**: Farcaster 메시지를 직접 구성(프로토버프)하고, Ed25519 서명 후 허브의 HTTP/gRPC API(`submitMessage`)로 전송하여 게시합니다. 완전한 서버-사이드 자동 포스팅이 가능합니다.
- **Warpcast (클라이언트 API/플로우)**: 공식 클라이언트 API는 주로 조회/기능 연동입니다. “쓰기” 플로우는 주로
  - Cast Composer Intent URL로 유저가 클라이언트에서 직접 전송하게 하거나,
  - Direct Casts API(별도 접근·키 필요)를 사용합니다. 

실무적으로 “자동 포스팅”은 Snapchain Hub 경로가 가장 확실합니다. 아래는 Snapchain Hub를 통한 서버-사이드 포스팅 구현을 메인으로, Warpcast 플로우(Composer/Direct Cast) 연동을 보조로 설명합니다.


## 사전 준비물

1) Farcaster 계정(FID)과 활성화된 서명 키(Ed25519 Signer)
   - 메시지 전송은 반드시 해당 FID에 등록된 활성 서명 키로 서명되어야 합니다.
   - 서명 키 등록 방법은 크게 2가지입니다.
     - Onchain KeyGateway를 통한 직접 등록(IdGateway/KeyGateway, Optimism) – 참조 문서의 ABI/주소 사용
     - Warpcast “Signer Requests” 플로우로 앱 서명 키 발급 및 승인 후 사용

2) Snapchain Hub 접속 정보
   - Hub URL(호스트:포트), TLS 여부, (선택) Basic Auth 자격 증명
   - 메인넷 허브는 접근 제한이 있을 수 있습니다. 3rd-party 노드(예: Neynar) 또는 자체 허브를 권장합니다.

3) 노드/툴체인
   - Node.js 18+ (Next.js 14 기준)
   - 패키지: `@farcaster/hub-web`, `axios`, `viem` (onchain 작업 시), `protobufjs`


## 의존성 설치

```bash
npm i @farcaster/hub-web axios protobufjs viem
```


## 환경 변수 설정 (.env)

아래 키들을 `.env.local` 등에 설정하세요.

```
# Snapchain Hub 연결
FARCASTER_HUB_HOST=127.0.0.1
FARCASTER_HUB_PORT=3381
FARCASTER_HUB_USE_SSL=false
# Hub가 RPC 인증을 사용할 경우 (선택)
FARCASTER_HUB_USERNAME=
FARCASTER_HUB_PASSWORD=

# Farcaster 네트워크
FARCASTER_NETWORK=MAINNET  # FarcasterNetwork.MAINNET

# 포스팅할 계정(FID) 및 서명 키(Ed25519 32바이트 프라이빗 키)
FARCASTER_FID=0
# 서명 키는 base64 또는 hex 중 하나로 저장하고, 코드에서 Uint8Array로 변환
FARCASTER_SIGNER_PRIVATE_KEY_HEX=
FARCASTER_SIGNER_PRIVATE_KEY_BASE64=

# (선택) Onchain 등록을 직접 수행할 때만 필요 (Optimism RPC)
OP_PROVIDER_URL=
CUSTODY_PRIVATE_KEY=0x
RECOVERY_ADDRESS=0x0000000000000000000000000000000000000000
```

주의:
- `FARCASTER_SIGNER_PRIVATE_KEY_*`는 Ed25519용 32바이트 시드/프라이빗키입니다. 외부 반출이 없도록 서버 안전 저장소를 사용하세요.
- `FARCASTER_FID`는 해당 서명 키가 “활성”으로 등록된 계정의 FID여야 합니다.


## Snapchain Hub에 메시지 쓰기(HTTP) – 서버 라우트 구현 예시

참조: Snapchain HTTP API – Message [`/v1/submitMessage`, `/v1/validateMessage`]

구현 목표:
- Next.js API 라우트 `POST /api/farcaster/casts` 에서 본문 JSON을 받아 Cast를 작성하고 Hub에 제출
- 옵션: 제출 전 `/v1/validateMessage`로 사전 검증

구현 위치 제안:
- 파일: `app/api/farcaster/casts/route.ts`

요청 예시(JSON):
```json
{
  "text": "Hello Farcaster!",
  "embeds": [{ "url": "https://example.com" }],
  "mentions": [],
  "mentionsPositions": [],
  "parentUrl": "",
  "parentCast": { "fid": null, "hash": null }
}
```

핵심 로직 요약:
1) 환경 변수 로드 → Hub 접속 URL, FID/네트워크, 서명 키 준비
2) `@farcaster/hub-web`의 `NobleEd25519Signer`로 서명자 생성
3) `makeCastAdd`로 메시지 생성 (성공 시 `Message` 반환)
4) `Message`를 protobuf-바이트로 인코딩 후 `Content-Type: application/octet-stream`으로 `/v1/submitMessage` POST
5) 필요 시 `/v1/validateMessage`로 검증 선행(동일한 바이트를 POST)

서버 라우트 예시 코드:
```ts
import { NextResponse } from "next/server";
import axios from "axios";
import {
  FarcasterNetwork,
  Message,
  NobleEd25519Signer,
  makeCastAdd,
  CastType,
} from "@farcaster/hub-web";

function getSignerFromEnv(): NobleEd25519Signer {
  const hex = process.env.FARCASTER_SIGNER_PRIVATE_KEY_HEX;
  const b64 = process.env.FARCASTER_SIGNER_PRIVATE_KEY_BASE64;
  let keyBytes: Uint8Array | null = null;
  if (hex && hex.length > 0) {
    const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
    if (clean.length !== 64) throw new Error("Ed25519 hex key must be 32 bytes (64 hex chars)");
    const bytes = new Uint8Array(clean.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
    keyBytes = bytes;
  } else if (b64 && b64.length > 0) {
    keyBytes = new Uint8Array(Buffer.from(b64, "base64"));
    if (keyBytes.length !== 32) throw new Error("Ed25519 base64 key must be 32 bytes");
  } else {
    throw new Error("FARCASTER_SIGNER_PRIVATE_KEY_HEX or _BASE64 must be set");
  }
  return new NobleEd25519Signer(keyBytes);
}

function getHubBaseUrl(): string {
  const host = process.env.FARCASTER_HUB_HOST || "127.0.0.1";
  const port = process.env.FARCASTER_HUB_PORT || "3381";
  const useSSL = String(process.env.FARCASTER_HUB_USE_SSL || "false") === "true";
  const scheme = useSSL ? "https" : "http";
  return `${scheme}://${host}:${port}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text: string = String(body.text || "");
    const embeds: Array<{ url?: string; cast_id?: { fid: number; hash: string } }>
      = Array.isArray(body.embeds) ? body.embeds : [];
    const mentions: number[] = Array.isArray(body.mentions) ? body.mentions : [];
    const mentionsPositions: number[] = Array.isArray(body.mentionsPositions) ? body.mentionsPositions : [];

    const parentCast = body.parentCast as { fid?: number | null; hash?: string | null } | undefined;
    const parentUrl = typeof body.parentUrl === "string" ? body.parentUrl : undefined;

    const fidEnv = Number(process.env.FARCASTER_FID || 0);
    if (!fidEnv) throw new Error("FARCASTER_FID must be set");

    const networkEnv = (process.env.FARCASTER_NETWORK || "MAINNET").toUpperCase();
    const network = FarcasterNetwork[networkEnv as keyof typeof FarcasterNetwork];
    if (typeof network !== "number") throw new Error("Invalid FARCASTER_NETWORK");

    const signer = getSignerFromEnv();

    const dataOptions = { fid: fidEnv, network };

    const castBody = {
      text,
      embeds, // [{ url: "https://..." }] 형태
      embedsDeprecated: [],
      mentions,
      mentionsPositions,
      parentUrl,
      parentCastId: parentCast?.fid && parentCast?.hash ? { fid: parentCast.fid, hash: parentCast.hash } : undefined,
      type: CastType.CAST,
    } as const;

    const castResult = await makeCastAdd(castBody, dataOptions, signer);
    if (castResult.isErr()) {
      return NextResponse.json({ ok: false, error: String(castResult.error) }, { status: 400 });
    }

    const messageBytes = Message.encode(castResult.value).finish();

    const hubBaseUrl = getHubBaseUrl();
    const headers: Record<string, string> = { "Content-Type": "application/octet-stream" };
    const auth = (process.env.FARCASTER_HUB_USERNAME && process.env.FARCASTER_HUB_PASSWORD)
      ? { username: process.env.FARCASTER_HUB_USERNAME!, password: process.env.FARCASTER_HUB_PASSWORD! }
      : undefined;

    // (선택) 사전 검증
    if (body.validate === true) {
      await axios.post(`${hubBaseUrl}/v1/validateMessage`, messageBytes, { headers, auth });
    }

    // 제출
    const { data } = await axios.post(`${hubBaseUrl}/v1/submitMessage`, messageBytes, { headers, auth });
    return NextResponse.json({ ok: true, result: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
```

검증/제출에 사용하는 HTTP 포맷:
- Content-Type: `application/octet-stream`
- Body: protobuf로 인코딩된 `Message` 바이트 (`Message.encode(...).finish()`)

CLI 확인 예시(cURL):
```bash
# 제출
curl -X POST "http://127.0.0.1:3381/v1/submitMessage" \
     -H "Content-Type: application/octet-stream" \
     --data-binary "@message.encoded.protobuf"

# 검증
curl -X POST "http://127.0.0.1:3381/v1/validateMessage" \
     -H "Content-Type: application/octet-stream" \
     --data-binary "@message.encoded.protobuf"
```


## 메시지 구조/타입 참고 (Snapchain Docs 기반)

- Message → `data`(MessageData), `hash`(BLAKE3), `signature`(Ed25519), `signer`
- MessageData 공통 필드: `type`, `fid`, `timestamp`, `network`, `body`(oneOf)
- 대표 타입:
  - `MESSAGE_TYPE_CAST_ADD` / `CastAddBody`
    - `text`, `embeds[]`, `mentions[]`, `mentionsPositions[]`, `parentCastId` 또는 `parentUrl`
  - `MESSAGE_TYPE_CAST_REMOVE` (`target_hash`)
  - `MESSAGE_TYPE_USER_DATA_ADD` (프로필 데이터)

해시/서명 스킴:
- Hash: `HASH_SCHEME_BLAKE3`
- Signature: `SIGNATURE_SCHEME_ED25519`


## (선택) 사용자 데이터 설정 예시 (USERNAME 등)

Snapchain 가이드에서는 `makeUserDataAdd`로 `UserDataType.USERNAME` 등 메타데이터를 설정하는 예시를 제공합니다. 동일한 방식으로 메시지 생성 후 `submitMessage` 하시면 됩니다.

```ts
import { makeUserDataAdd, UserDataType } from "@farcaster/hub-web";

const dataOptions = { fid, network };
const signer = /* NobleEd25519Signer */;

const userData = { type: UserDataType.USERNAME, value: "your_fname" } as const;
const result = await makeUserDataAdd(userData, dataOptions, signer);
// Message.encode(result.value).finish() → /v1/submitMessage
```


## 허브에서 결과 확인

- 특정 FID의 Cast 조회(허브 HTTP API 예):
```bash
curl "http://127.0.0.1:3381/v1/castsByFid?fid=1" \
  | jq ".messages[].data.castAddBody.text | select( . != null)"
```


## Onchain: FID/Signer 등록 개요 (필요 시)

참조: Snapchain 가이드 코드 조각 – `@farcaster/hub-web`에서 제공하는 IdGateway/KeyGateway ABI·주소를 사용

1) Optimism RPC 설정(`OP_PROVIDER_URL`)과 보유 지갑(`CUSTODY_PRIVATE_KEY`) 준비
2) FID가 없다면 IdGateway를 통해 등록 (Recovery 주소는 선택)
3) Ed25519 서명 키를 KeyGateway로 등록하여 FID에 활성화

구체 트랜잭션/서명 포맷은 참조 문서의 ABI/메서드 시그니처를 따르십시오. 또는 Warpcast “Signer Requests” 플로우를 통해 앱 서명 키를 발급·승인받아 사용하는 방법도 있습니다.


## Warpcast 연동 (클라이언트 플로우)

Warpcast 문서에 따르면, “쓰기” 관련 일반 경로는 아래 두 가지입니다.

1) Cast Composer Intent URL
   - 유저가 Warpcast UI의 작성기(composer)로 이동하여 전송을 확정하는 방식
   - 스펙: Cast Composer Intents (문서 참조)
   - 예시(개념):
     ```
     https://warpcast.com/~/compose?text=Hello%20Farcaster!&embeds[]=https%3A%2F%2Fexample.com
     ```
   - 채널/멘션/임베드 등 파라미터는 문서 스펙을 따라 구성하세요.

2) Direct Casts (DM) API
   - 별도 접근 키가 필요하며, 공식 문서에서 안내하는 경로/키 발급 절차를 따라야 합니다.
   - 문서 내 링크(“Public Programmable DCs v1”)를 통해 API 키 발급, 엔드포인트, 인증 헤더 포맷을 확인 후 사용하세요.

추가로, 특정 캐스트 보기(해시 기반):
```
https://warpcast.com/~/conversations/:hash
```


## 보안/운영 체크리스트

- **서명 키 보호**: Ed25519 Private Key는 서버 비밀 저장(예: KMS/환경변수 암호화). 로깅 금지.
- **허브 인증**: 허브가 RPC 인증을 요구하면 Basic Auth 사용. TLS 필요 시 `FARCASTER_HUB_USE_SSL=true`.
- **네트워크 일치**: `FARCASTER_NETWORK`와 허브 네트워크가 일치해야 합니다.
- **키 활성화 상태**: 제출 실패가 반복되면 해당 FID에 서명 키가 활성인지 확인(등록, 유효기간, 철회 여부).
- **재시도/중복 방지**: 서버에서 멱등성 키 사용 권장.
- **관찰 가능성**: 실패 응답 전문 기록(개인정보 제외), 허브 로그/상태 점검.


## 통합 테스트 시나리오

1) `.env.local` 세팅 및 서버 재기동
2) `POST /api/farcaster/casts` 에 `{ "text": "hello" }` 전송 → 200/ok
3) 허브에서 `castsByFid?fid=...`로 신규 캐스트 존재 확인
4) `validate=true` 옵션으로 사전 검증 모드 확인
5) 부모 캐스트/URL, 임베드/멘션 포함 케이스 검증


## 트러블슈팅

- 400/403 오류: FID·서명 키 활성 상태, 네트워크(메인넷/테스트넷) 불일치, 허브 인증 확인
- 415 Unsupported Media Type: `Content-Type: application/octet-stream` 누락 여부 확인
- Signature/Hash invalid: Ed25519 키/메시지 데이터 바이트 일치 여부, 타임스탬프 경과
- Hub 연결 실패: 방화벽/포트/TLS 설정 및 `FARCASTER_HUB_USE_SSL` 재확인


## 부록: Rust로 직접 메시지 구성 예시

참조 문서에는 Rust로 `CastAdd` 생성 → BLAKE3 해시 → Ed25519 서명 → `/v1/submitMessage` 전송까지의 예제가 포함되어 있습니다. Node/TS 환경이 아니더라도 동일 원칙으로 구현 가능합니다.


## 참고 링크 (원문)

- Snapchain – Writing messages: [`https://snapchain.farcaster.xyz/guides/writing-messages`]
- Snapchain – HTTP API (Message): `/v1/submitMessage`, `/v1/validateMessage`
- Warpcast – API Reference: [`https://docs.farcaster.xyz/reference/warpcast/api`]
- Warpcast – Signer Requests / Cast Composer Intents / Direct Casts / Embeds / Videos: 문서 내 해당 섹션 참조


---
이 가이드는 Snapchain(프로토콜) 경로를 중심으로 서버-사이드 자동 포스팅을 완결적으로 구현할 수 있도록 구성되었습니다. Warpcast 경로는 사용자 상호작용이 필요한 경우(Composer) 또는 별도 접근 권한이 있을 때(Direct Casts)에 병행 활용하십시오.


