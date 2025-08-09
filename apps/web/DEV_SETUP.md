# 🚀 Aurum Circle Miniapp - Development Setup

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local .env.local.backup
# Edit .env.local with your World ID credentials

# Run development server
npm run dev
```

## 🔧 Environment Setup

### 1. World ID Configuration (REQUIRED)

1. **Create World ID App**:
   - Visit: https://developer.worldcoin.org/
   - Click "Create App"
   - **App Name**: `Aurum Circle`
   - **App Type**: `Miniapp` ⚠️ **CRITICAL: Must be Miniapp, not Web**
   - **Description**: `Exclusive dating platform for Bangkok students`

2. **Configure App Settings**:
   - **Verification Level**: `Orb` (highest security)
   - **Actions**: Create action called `verify-human`
   - **Max Verifications**: `1` (one per person)

3. **Update .env.local**:
   ```bash
   NEXT_PUBLIC_WORLDCOIN_APP_ID=app_staging_your_actual_app_id
   WORLDCOIN_APP_SECRET=sk_your_actual_app_secret
   ```

### 2. JWT Secret (REQUIRED)

Generate a secure JWT secret:
```bash
# Generate secure random string
openssl rand -base64 32

# Add to .env.local
JWT_SECRET=your_generated_secret_here
```

### 3. Optional Configuration

**Wallet Connect** (for future features):
```bash
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

**Blockchain/NFT** (for production):
```bash
ALCHEMY_API_KEY=your_alchemy_key
NFT_CONTRACT_ADDRESS=0x_actual_nft_contract
```

## 📱 Testing Guide

### Local Development Testing

1. **Install World App**:
   - Download from App Store/Google Play
   - Complete World ID verification (Orb required)

2. **Run Development Server**:
   ```bash
   npm run dev
   # App runs on http://localhost:3000
   ```

3. **Test in World App**:
   - Open World App on your phone
   - Navigate to your local IP: `http://192.168.1.XXX:3000`
   - Or use ngrok for HTTPS: `ngrok http 3000`

### Production Testing

1. **Deploy to Vercel**:
   ```bash
   npm run build
   vercel --prod
   ```

2. **Update World ID App Settings**:
   - Set production URL in World ID Developer Portal
   - Test with production domain

## 🏗️ Architecture Overview

### Authentication Flow
```
1. World ID Verification (MiniKit SDK)
   ↓
2. Wallet Connection (World App Browser)
   ↓
3. NFT Gate Verification (Bangkok University NFTs)
   ↓
4. Profile Setup (3-step onboarding)
   ↓
5. Main App (Discovery feed)
```

### Key Components

- **MiniKit Integration**: `/src/lib/minikit.ts`
- **World ID Button**: `/src/components/auth/world-id-button.tsx`
- **Session Management**: JWT-based with HTTP-only cookies
- **NFT Verification**: Mock implementation for demo
- **Profile System**: Multi-step onboarding

## 🛠️ Development Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # ESLint
npm run type-check   # TypeScript check

# Deployment
vercel               # Deploy to Vercel
```

## 🐛 Troubleshooting

### Common Issues

**1. "MiniKit not installed" Error**
- ✅ App must be opened in World App browser
- ✅ Regular browsers won't work for miniapps
- ✅ Test on mobile device with World App

**2. "App not found" Error**
- ✅ Check `NEXT_PUBLIC_WORLDCOIN_APP_ID` is correct
- ✅ Ensure app type is set to "Miniapp" in Developer Portal
- ✅ Verify app is published/enabled

**3. "Action not found" Error**
- ✅ Create `verify-human` action in Developer Portal
- ✅ Ensure action name matches exactly in code
- ✅ Check action is enabled

**4. "Verification failed" Error**
- ✅ User must have valid World ID (Orb verified)
- ✅ Check verification level matches (Orb vs Device)
- ✅ Ensure user hasn't already verified (if max = 1)

### Debug Logs

Check browser console and server logs for:
- `🔍 Verifying World ID proof:` - Shows proof details
- `📡 World ID API response:` - Shows API response
- `✅ World ID verification successful` - Success confirmation

## 📚 Resources

- **World ID Docs**: https://docs.worldcoin.org/
- **MiniKit SDK**: https://docs.worldcoin.org/minikit
- **Developer Portal**: https://developer.worldcoin.org/
- **Support Discord**: https://discord.gg/worldcoin

## 🔒 Security Notes

- Never commit `.env.local` to git
- Use environment variables for all secrets
- JWT secret should be cryptographically secure
- World ID App Secret must be kept private
- Session cookies are HTTP-only and secure

## 🚧 Current Development Status

### ✅ Completed
- [x] World ID Miniapp SDK integration
- [x] Wallet connection flow
- [x] NFT gate verification (mock)
- [x] Profile setup system
- [x] Session management
- [x] Basic UI components

### 🔄 In Progress
- [ ] Configure production World ID app
- [ ] Test real World ID verification
- [ ] Deploy to production

### 📋 TODO
- [ ] Real blockchain NFT verification
- [ ] Discovery/matching system
- [ ] Secret signals feature
- [ ] Private messaging
- [ ] Invite code system
- [ ] Push notifications

---

**Next Steps**: Follow the WORLD_ID_SETUP.md guide to configure your World ID app, then test the verification flow in World App.