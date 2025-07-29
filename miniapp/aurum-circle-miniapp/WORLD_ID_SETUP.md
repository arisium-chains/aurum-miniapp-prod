# World ID Setup Guide for Aurum Circle Miniapp

## 🌍 Register Your World ID App

### 1. Visit World ID Developer Portal
Go to: https://developer.worldcoin.org/

### 2. Create New App
- Click "Create App"
- **App Name**: `Aurum Circle`
- **Description**: `Exclusive dating platform for Bangkok students with World ID verification`
- **App Type**: `Miniapp` (very important!)

### 3. Configure App Settings

#### Basic Settings:
- **App ID**: Copy this to your `.env.local` as `NEXT_PUBLIC_WORLDCOIN_APP_ID`
- **App Secret**: Copy this to your `.env.local` as `WORLDCOIN_APP_SECRET`

#### Verification Settings:
- **Actions**: Create an action called `verify-human`
- **Verification Level**: `Orb` (highest security)
- **Max Verifications**: `1` (one verification per person)

#### Miniapp Settings:
- **App URL**: `https://your-domain.com` (your production URL)
- **Development URL**: `http://localhost:3000` (for testing)
- **Icon**: Upload a 512x512 icon for your app

### 4. Miniapp Integration

#### Enable Miniapp Features:
- ✅ **World ID Verification**: Enable for identity verification
- ✅ **Sign Message**: Enable for wallet message signing
- ✅ **Send Transaction**: Enable for future blockchain interactions

#### Configure Permissions:
- **Required**: `world-id`
- **Optional**: `wallet` (for future features)

## 🔧 Environment Variables

Update your `.env.local` file:

```bash
# World ID Configuration (FROM DEVELOPER PORTAL)
NEXT_PUBLIC_WORLDCOIN_APP_ID=app_staging_your_actual_app_id_here
WORLDCOIN_APP_SECRET=sk_your_actual_app_secret_here

# Other required variables...
JWT_SECRET=your-super-secret-jwt-key-here
```

## 📱 Testing Your World ID Integration

### Development Testing:
1. **Install World App**: Download from App Store/Google Play
2. **Create World ID**: Complete Orb verification (required for testing)
3. **Open Miniapp**: Navigate to your localhost URL in World App browser
4. **Test Verification**: Click "Connect World ID" button

### Production Testing:
1. **Deploy to Production**: Deploy your app to Vercel/production
2. **Update App URL**: Update the App URL in World ID Developer Portal
3. **Test Live**: Share the production URL and test in World App

## 🔍 Troubleshooting

### Common Issues:

#### "App not found" Error:
- ✅ Check `NEXT_PUBLIC_WORLDCOIN_APP_ID` is correct
- ✅ Ensure app is published in Developer Portal
- ✅ Verify app type is set to "Miniapp"

#### "Action not found" Error:
- ✅ Create `verify-human` action in Developer Portal
- ✅ Ensure action name matches exactly in code
- ✅ Check action is enabled and published

#### "Verification failed" Error:
- ✅ User must have valid World ID (Orb verified)
- ✅ Check verification level matches (Orb vs Device)
- ✅ Ensure user hasn't already verified (if max_verifications = 1)

#### "MiniKit not installed" Error:
- ✅ App must be opened in World App browser
- ✅ Regular browsers won't work for miniapps
- ✅ Share the direct URL to users

### Debug Logs:
Check your server logs for detailed error messages:
- `🔍 Verifying World ID proof:` - Shows proof details
- `📡 World ID API response:` - Shows API response
- `✅ World ID verification successful` - Success confirmation

## 🚀 Going Live

### Before Production:
1. **Complete App Review**: Submit for World ID team review
2. **Update URLs**: Set production URLs in Developer Portal
3. **Test Thoroughly**: Test all flows with real users
4. **Monitor Logs**: Set up proper error monitoring

### Production Checklist:
- [ ] App approved by World ID team
- [ ] Production URLs configured
- [ ] Environment variables set in production
- [ ] Error monitoring enabled
- [ ] User onboarding flow tested
- [ ] Fallback for non-World App users

## 📞 Support

- **World ID Docs**: https://docs.worldcoin.org/
- **Developer Discord**: https://discord.gg/worldcoin
- **Support Email**: developers@worldcoin.org

Remember: Miniapps only work inside the World App browser, not in regular browsers!