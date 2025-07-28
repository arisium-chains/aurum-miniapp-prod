# Aurum Circle Miniapp - Task Continuation Document

## 📋 **Project Context (Always Reference This)**

**Project Name**: Aurum Circle Dating Miniapp  
**Type**: Tinder-like Web3 dating app for Bangkok university students  
**Tech Stack**: Next.js 14 + Tailwind + World ID + NFT gating  
**Status**: In Development (Phase 1 MVP)  
**Repository**: `/Users/poomcryptoman/Arisium/aurum-circle/miniapp/`  

### **Core Concept**
A secret society-themed dating app where users must:
1. Verify humanity via World ID (anti-bot)
2. Own specific NFT for vault access (exclusivity)
3. Send "secret signals" to match (Tinder-like)
4. Use invite codes for viral growth (max 3 per user)

---

## 🎯 **Current Development Phase**

### **Phase 1: MVP Core Features**
- [x] Architecture & Requirements completed
- [ ] Project setup & structure
- [ ] World ID authentication
- [ ] NFT gating system
- [ ] Basic profile system
- [ ] Swipe/signal mechanism
- [ ] Match detection
- [ ] Invite code system

### **Immediate Next Steps**
1. **Set up Next.js project structure**
2. **Install core dependencies**
3. **Create component library**
4. **Implement authentication flow**

---

## 🏗️ **Project Structure Template**

```
aurum-circle-miniapp/
├── app/
│   ├── (auth)/              # Protected routes
│   │   ├── vault/           # Main discovery feed
│   │   ├── matches/         # Match management
│   │   ├── invites/         # Invite code system
│   │   └── profile/         # User profile
│   ├── (public)/            # Public routes
│   │   ├── splash/          # Landing page
│   │   ├── verify/          # World ID verification
│   │   └── gate/            # NFT gate check
│   ├── api/                 # API routes
│   │   ├── auth/            # Authentication
│   │   ├── nft/             # NFT verification
│   │   ├── users/           # User management
│   │   ├── signals/         # Interest signals
│   │   ├── matches/         # Match system
│   │   └── invites/         # Invite system
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                  # Shadcn/ui components
│   ├── auth/                # Authentication components
│   ├── profile/             # Profile components
│   ├── matching/            # Swipe/match components
│   ├── invite/              # Invite components
│   └── layout/              # Layout components
├── lib/
│   ├── auth/                # Auth utilities
│   ├── blockchain/          # Blockchain interactions
│   ├── database/            # Database clients
│   ├── utils/               # General utilities
│   └── validations/         # Zod schemas
├── types/                   # TypeScript definitions
├── hooks/                   # Custom React hooks
└── public/                  # Static assets
```

---

## 🔧 **Essential Dependencies**

### **Core Framework**
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

### **Styling & UI**
```json
{
  "dependencies": {
    "tailwindcss": "^3.3.0",
    "@radix-ui/react-*": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "framer-motion": "^10.0.0"
  }
}
```

### **Web3 & Authentication**
```json
{
  "dependencies": {
    "@worldcoin/idkit": "^1.0.0",
    "viem": "^1.0.0",
    "wagmi": "^1.0.0",
    "@wagmi/core": "^1.0.0",
    "jose": "^5.0.0"
  }
}
```

### **State Management & Data**
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0"
  }
}
```

---

## 🎨 **Design System Reference**

### **Color Palette (Always Use These)**
```css
:root {
  /* Dark Academia Theme */
  --bg-primary: #1C1917;      /* Dark brown/black */
  --bg-secondary: #292524;    /* Lighter brown */
  --accent-red: #DC2626;      /* Crimson red */
  --accent-gold: #F59E0B;     /* Gold highlights */
  --text-primary: #FAFAF9;    /* Off-white */
  --text-secondary: #A8A29E;  /* Gray */
  --border: #44403C;          /* Dark border */
}
```

### **Typography**
```css
/* Headers: Playfair Display */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap');

/* Body: Inter */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

### **Component Patterns**
- **Cards**: Rounded corners (rounded-2xl), subtle shadows
- **Buttons**: Red primary, gold accent, dark variants
- **Inputs**: Dark backgrounds, gold focus states
- **Navigation**: Bottom tab bar for mobile

---

## 🔐 **Authentication Flow (Critical Implementation)**

### **Complete Auth Sequence**
```typescript
// 1. World ID Verification
const handleWorldIDVerify = async (proof: ISuccessResult) => {
  const response = await fetch('/api/auth/worldid', {
    method: 'POST',
    body: JSON.stringify({
      merkle_root: proof.merkle_root,
      nullifier_hash: proof.nullifier_hash,
      proof: proof.proof,
      verification_level: proof.verification_level
    })
  })
  
  if (response.ok) {
    // Proceed to wallet connection
    connectWallet()
  }
}

// 2. Wallet Connection
const connectWallet = async () => {
  const { address } = await connect({
    connector: injected()
  })
  
  // Request signature for auth
  const message = `Sign this message to authenticate with Aurum Circle.\nTimestamp: ${Date.now()}`
  const signature = await signMessage({ message })
  
  // Verify signature server-side
  await fetch('/api/auth/wallet', {
    method: 'POST',
    body: JSON.stringify({ address, message, signature })
  })
}

// 3. NFT Verification
const checkNFTAccess = async () => {
  const response = await fetch('/api/nft/verify')
  const { hasNFT } = await response.json()
  
  if (hasNFT) {
    router.push('/vault')
  } else {
    router.push('/gate')
  }
}
```

---

## 📊 **Database Schema (Critical Reference)**

### **Users Table**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  world_id TEXT UNIQUE NOT NULL,
  wallet_address TEXT UNIQUE NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  profile_image TEXT,
  blurred_image TEXT,
  vibe TEXT CHECK(vibe IN ('Wicked', 'Royal', 'Mystic')),
  tags TEXT, -- JSON array
  nft_verified BOOLEAN DEFAULT FALSE,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active'
);
```

### **Signals Table (Swipe Actions)**
```sql
CREATE TABLE signals (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  type TEXT CHECK(type IN ('interest', 'super_interest', 'pass')),
  message TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(from_user_id) REFERENCES users(id),
  FOREIGN KEY(to_user_id) REFERENCES users(id),
  UNIQUE(from_user_id, to_user_id)
);
```

### **Matches Table**
```sql
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  user1_id TEXT NOT NULL,
  user2_id TEXT NOT NULL,
  matched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'matched',
  FOREIGN KEY(user1_id) REFERENCES users(id),
  FOREIGN KEY(user2_id) REFERENCES users(id)
);
```

---

## 🚨 **Critical Implementation Notes**

### **Security Requirements (NEVER SKIP)**
1. **World ID Verification**: Always verify proofs server-side
2. **NFT Check**: Cache for 24h max, re-verify on suspicious activity
3. **Rate Limiting**: Implement on ALL endpoints
4. **Input Validation**: Use Zod schemas for all inputs
5. **CSRF Protection**: Double-submit cookies for state changes

### **Performance Requirements**
1. **Image Optimization**: WebP format, multiple sizes, lazy loading
2. **Bundle Size**: Code splitting by route, <300KB initial
3. **Caching**: React Query for API, Service Worker for offline
4. **Database**: Proper indexing on frequently queried fields

### **User Experience Requirements**
1. **Loading States**: Every action needs loading feedback
2. **Error Handling**: User-friendly error messages
3. **Offline Support**: Core features work without internet
4. **Accessibility**: WCAG 2.1 AA compliance

---

## 🔄 **Common Development Tasks**

### **Adding New API Endpoint**
```typescript
// 1. Create API route: app/api/[feature]/route.ts
export async function POST(request: Request) {
  // Authenticate user
  const session = await getSession(request)
  if (!session) return unauthorized()
  
  // Validate input
  const schema = z.object({...})
  const body = schema.parse(await request.json())
  
  // Business logic
  const result = await performAction(body)
  
  // Return response
  return Response.json({ success: true, data: result })
}

// 2. Add to API client: lib/api.ts
export const apiClient = {
  feature: {
    action: (data) => fetch('/api/feature', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }).then(r => r.json())
  }
}

// 3. Create React Query hook: hooks/use-feature.ts
export const useFeatureAction = () => {
  return useMutation({
    mutationFn: apiClient.feature.action,
    onSuccess: () => queryClient.invalidateQueries(['feature'])
  })
}
```

### **Adding New Component**
```typescript
// 1. Create component: components/[feature]/ComponentName.tsx
interface ComponentNameProps {
  // Props
}

export function ComponentName({ ...props }: ComponentNameProps) {
  return (
    <div className="bg-bg-primary text-text-primary">
      {/* Component content */}
    </div>
  )
}

// 2. Export from index: components/[feature]/index.ts
export { ComponentName } from './ComponentName'

// 3. Use in pages: app/[route]/page.tsx
import { ComponentName } from '@/components/feature'
```

---

## 🐛 **Common Issues & Solutions**

### **World ID Integration Issues**
```typescript
// Problem: IDKit fails to load
// Solution: Check app_id and action configuration
const app_id = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID
const action = "verify-human" // Must match World ID dashboard

// Problem: Proof verification fails
// Solution: Verify on server-side with proper endpoint
const verifyProof = async (proof) => {
  const response = await fetch(`https://developer.worldcoin.org/api/v1/verify/${app_id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...proof, action })
  })
  return response.json()
}
```

### **NFT Verification Issues**
```typescript
// Problem: Blockchain connection fails
// Solution: Use multiple RPC providers with fallback
const providers = [
  new JsonRpcProvider(process.env.ALCHEMY_URL),
  new JsonRpcProvider(process.env.INFURA_URL),
  new JsonRpcProvider('https://eth.llamarpc.com')
]

const checkNFTWithFallback = async (address) => {
  for (const provider of providers) {
    try {
      return await checkNFTOwnership(provider, address)
    } catch (error) {
      console.warn('Provider failed, trying next:', error)
    }
  }
  throw new Error('All providers failed')
}
```

---

## 📱 **Mobile-First Development Checklist**

### **Essential Mobile Features**
- [ ] Touch gestures for swipe actions
- [ ] Responsive design (320px min width)
- [ ] PWA manifest and service worker
- [ ] Apple touch icons and splash screens
- [ ] Keyboard avoidance for inputs
- [ ] Proper viewport meta tag
- [ ] Fast tap responses (no 300ms delay)

### **Testing on Mobile**
```bash
# Use ngrok for mobile testing
npx ngrok http 3000

# Test on multiple devices
# - iPhone 12/13/14 (Safari)
# - Samsung Galaxy S21/S22 (Chrome)
# - iPad (Safari)
```

---

## 🚀 **Deployment Checklist**

### **Pre-deployment**
- [ ] All tests passing (unit, integration, e2e)
- [ ] Performance audit (Lighthouse score >90)
- [ ] Security scan (no critical vulnerabilities)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Cross-browser testing
- [ ] Mobile device testing

### **Environment Variables**
```bash
# Production environment variables
NEXT_PUBLIC_WORLDCOIN_APP_ID=app_xxx
WORLDCOIN_APP_SECRET=sk_xxx
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=xxx
ALCHEMY_API_KEY=xxx
DATABASE_URL=xxx
JWT_SECRET=xxx
NFT_CONTRACT_ADDRESS=0x...
```

---

## 🔄 **How to Continue Development**

### **When Resuming Work**
1. **Read this document first** - Always start here for context
2. **Check current TodoWrite status** - See what's in progress
3. **Review ARCHITECTURE.md** - Understand system design
4. **Check REQUIREMENTS.md** - Verify what needs to be built
5. **Look at project structure** - Understand current code organization
6. **Run tests** - Ensure everything still works
7. **Continue with current task** - Pick up where you left off

### **If Context is Lost**
1. **Re-read all .md files** in this directory
2. **Check git history** - See recent changes
3. **Review package.json** - Understand dependencies
4. **Look at existing components** - Understand patterns
5. **Test existing functionality** - See what works
6. **Update TodoWrite** - Set current status

### **Emergency Recovery**
If completely lost, the minimum viable context is:
- **What**: Tinder-like Web3 dating app
- **Tech**: Next.js 14 + Tailwind + World ID + NFT gating
- **Features**: Auth → Profile → Swipe → Match → Invite
- **Files**: All .md files in this directory contain full context

---

This document ensures continuous development without context loss. Always reference it when resuming work on the Aurum Circle miniapp! 🎭✨