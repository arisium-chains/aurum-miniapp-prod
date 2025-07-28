## SDLC_PLAN

🔖 Task Title: Aurum Circle Miniapp (Phase 1 MVP)

🗈 Functional Specification:

- A mobile-first WLD Miniapp for a secret-society themed dating platform using World ID verification and NFT access gate.
- Pages: Splash, Identity Gate, Vault, Match, Invite, Profile Setup, Event Ticket.
- Key features: WLD auth, NFT entry pass, invite tracking, appearance-based profile scoring, secret signal matching, event ticket logic.
- Tech stack: Next.js App Router, Tailwind CSS, WLD SDK, Viem/Ethers.js, Rust AI server for scoring, Cloudflare R2.

🧠 Business Logic / Rules:

- Users must pass World ID verification and NFT gate to access Vault.
- Once-per-user appearance scoring via local ONNX/Rust model.
- Each user receives 3 max invite codes.
- Secret signal unlocks profile upon mutual match.
- Event tickets are NFT drops with expiration and refund logic.

🔌 Backend Logic & API:

- Endpoint: `POST /api/wld/verify` → Validate WLD proof + set cookie
- Endpoint: `GET /api/nft/check?wallet=` → Return boolean for Vault access
- Endpoint: `POST /api/match/send` → Log signal
- Endpoint: `POST /api/invite/use` → Validate and redeem invite
- Endpoint: `GET /api/user/session` → Return user session + score
- AI API: `POST /score` → Base64 image in, ONNX model returns score (once per user)

🎨 Frontend Behavior:

- Splash screen → WLD Connect → NFT check → Vault
- Vault: user info, scrollable blurred profiles, unlock shimmer
- Match: blurred card with pulsing sigil + secret signal button
- Invite: QR/IG share, redemption tracking
- Profile Setup: select vibe tag, view NFT badge, disconnect WLD
- Event ticket: mint + display NFT with countdown logic

🧪 Testing Scenarios:

- Identity flow: WLD Connect → NFT check → Vault access
- AI Scoring: Base64 → Rust scorer → store per session
- Invite: QR, limit 3 claims, R2 load/store
- Match: mock POST signal, glow trigger on match
- Event: NFT ticket mint, expiration logic, conditional entry

🔐 Security & Edge Cases:

- Prevent rescore / re-upload
- WLD spoofing blocked via signed session
- Invite rate limit and abuse control
- NFT expiry logic with refund fallback
- Minimal backend trust: stateless + R2

🔁 Dependencies:

- World ID SDK
- Viem or Ethers.js
- Local Rust (ONNX Runtime via ort)
- Cloudflare R2 JSON store
- Animation libs: tsparticles, framer-motion

👥 Roles Involved:

- Frontend Dev, Rust Dev, Backend API Dev, UI/UX Designer, QA, PM

⏱️ Estimated Effort:

- 14–18 days (extended due to AI model integration)

📌 Priority & Milestone:

- Phase 1 = Mobile-ready MVP + mock backend + AI scaffold

---

## UX_PROMPT

🔖 Component or Page Name: Aurum Circle WLD Miniapp (Phase 1)

🛎 Goal / User Intention:

- Join an elite dating experience gated by uniqueness (WLD) and prestige (NFT)
- View blurred profiles, send secret match signals, redeem invite or event ticket

📱 Platform: Mobile Web (PWA optional future)

🔀 Layout Plan:

- Splash: shimmer gold particles full-screen CTA center
- Vault: top user panel, horizontal scroll of profile cards
- Match: centered blurred card, animated sigil
- Invite: code + QR + share options + claim log
- Profile: vibe selection + disconnect
- Event: NFT ticket + timer + redemption or mint

🎨 Visual Style:

- Theme: Dark academia + ritual aesthetic
- Palette: Blood red primary (#B3001B), Gold accent (#FFD700), Deep black-gray (#0c0c0c → #1a0000)
- Fonts: Playfair Display (headings), Inter (body)

🛠 UI Elements:

- WLD connect + shimmer
- Profile blur card + glow outline
- Invite share buttons
- Animated sigil
- Event NFT countdown badge

🔄 Dynamic Behavior:

- One-time scoring (local Rust AI)
- Conditional render: NFT gate, invite gate, ticket state
- Match signal triggers shimmer → unlock logic

📊 Data Model:

```json
{
  "session": {
    "wallet": "0x...",
    "hasNFT": true,
    "tag": "Royal",
    "inviteCode": "AURUM-Z11",
    "score": 87,
    "inviteClaims": [{ "user": "@elara", "date": "2025-07-24" }]
  },
  "profiles": [
    { "handle": "@sigilbloom", "blurImage": "/blur/rose.jpg" },
    { "handle": "@hexwhisper", "blurImage": "/blur/moon.jpg" }
  ],
  "eventTicket": {
    "type": "friday",
    "expires": "2025-07-28T23:59:00Z",
    "minted": true
  }
}
```

🌈 Reference Visuals: Blurred mystic profile decks, floating gold shimmer, pulsing sigil, dark gold UI buttons (Image Interpretation = High Confidence)

---

## META

- Origin: ClaudeCode SDLC Agent
- Timestamp: 2025-07-25T02:30+07:00
- Context ID: AURUM-MINIAPP-V1
