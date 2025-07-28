## SDLC_PLAN

🔖 Task Title: Aurum Circle Miniapp (Phase 1 MVP)

🗈 Functional Specification:

- A mobile-first miniapp for a secret-society themed dating platform using World ID verification and NFT access gate.
- Pages: Splash, Identity Gate, Vault, Match, Invite, Profile Setup.
- Key features: WLD auth, NFT gate check, invite tracking, profile browsing, secret signal matching.
- Tech stack: Next.js App Router, Tailwind CSS, WLD SDK, Viem/Ethers.js, Cloudflare R2.

🧠 Business Logic / Rules:

- Users must pass World ID verification.
- Must own a valid NFT to access the Vault.
- Each user has a unique invite key (max 3 redemptions).
- Mutual signal = match → unlock profile/chat.
- Tag system and user vibes ("Wicked", "Royal", "Mystic") configurable.

🔌 Backend Logic & API:

- Endpoint: `POST /api/wld/verify` → Validate WLD proof + set cookie
- Endpoint: `GET /api/nft/check?wallet=` → Return boolean based on NFT ownership
- Endpoint: `POST /api/match/send` → Log signal for user
- Endpoint: `GET /api/invite/:id` → Fetch invite from Cloudflare R2
- Endpoint: `POST /api/invite/use` → Validate and redeem invite
- Endpoint: `GET /api/user/session` → Return user session object

🎨 Frontend Behavior:

- Splash screen: shimmer particles + CTA → triggers WLD modal
- Identity check screen: shows loader + server-side NFT check
- Vault: horizontal profile scroll, shimmer glow, unlock button placeholder
- Match: blurred profile + pulsing sigil → secret signal button
- Invite: code display + claim table + share QR/IG
- Profile setup: select vibe, view NFT badge, disconnect WLD

🧪 Testing Scenarios:

- Unit: WLD verification, NFT mock check, session token flow
- Integration: Simulated match + invite claim flow
- E2E: Full onboarding → Vault access with mock data → match signal + UI feedback

🔐 Security & Edge Cases:

- WLD proof tampering → session rejection
- NFT mismatch → block Vault access
- Invite abuse → rate-limit + redemption cap
- XSS/CSRF → cookie/session validation + Tailwind safe list

🔁 Dependencies:

- World ID SDK
- Viem or Ethers.js
- Cloudflare R2 bucket
- Framer Motion, tsparticles/react

👥 Roles Involved:

- Frontend Dev, Backend Dev, UI/UX Designer, QA, PM

⏱️ Estimated Effort:

- 8–12 days (mock-first dev)

📌 Priority & Milestone:

- Critical path for public reveal / pre-launch teaser (Phase 1)

---

## UX_PROMPT

🔖 Component or Page Name: Aurum Circle WLD Miniapp
🛎 Goal / User Intention:

- Enter secret society dating platform via World ID
- Browse hidden profiles, send secret signals, manage invite codes

📱 Platform: Mobile Web (PWA optional in future)

🔀 Layout Plan:

- Splash: full-screen background with shimmer CTA center
- Vault: 1/4 top user info, 3/4 horizontal profile scroll
- Match: centered blurred profile + button below
- Invite: top invite code, middle QR + table, bottom share options
- Profile: vibe selector UI + disconnect button

🎨 Visual Style:

- Dark academia ritual (black + deep red base)
- Gold accents, glowing seals, motion shimmer
- Fonts: Playfair Display for heading, Inter for body

🛠 UI Elements:

- WLD Connect Button
- Loader spinner + shimmer transition
- Invite code box + QR export
- Horizontal profile cards (blurred)
- Sigil animation (pulsing)
- Vibe tag selector (3 options)
- Bottom nav bar: Vault | Match | Invite | Profile

🔄 Dynamic Behavior:

- World ID verification → identity check → NFT fetch → Vault
- Conditional render based on invite & NFT status
- Match signal → trigger mock POST, animate on mutual

📊 Data Model:

```json
{
  "session": {
    "wallet": "0x...",
    "hasNFT": true,
    "tag": "Mystic",
    "inviteCode": "AURUM-X99",
    "inviteClaims": [{ "user": "@catgirl", "date": "2025-07-25" }]
  },
  "profiles": [
    { "handle": "@maskrose", "blurImage": "/blur/rose.jpg" },
    { "handle": "@lunarvoid", "blurImage": "/blur/moon.jpg" }
  ]
}
```

🌈 Reference Visuals: Gold shimmer particle background, blurred profile card UI, pulsing seal icons (Image Interpretation = High Confidence)

---

## META

- Origin: ClaudeCode SDLC Agent
- Timestamp: 2025-07-25T02:00+07:00
- Context ID: AURUM-MINIAPP-V1
