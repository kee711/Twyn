# Farcaster Mini App Deployment Guide

This document provides instructions for deploying the Twyn Farcaster Mini App.

## 🚀 Pre-deployment Checklist

### ✅ Configuration Validation
Run the validation script to ensure all components are properly configured:

```bash
npm run validate-miniapp
```

### ✅ Required Files
- [x] `config/miniapp/manifest.json` - Mini app manifest with account association
- [x] `app/.well-known/farcaster.json/route.ts` - Farcaster manifest endpoint
- [x] `app/api/webhook/route.ts` - Webhook handler for Farcaster events
- [x] `public/icon.png` - App icon (recommended: 512x512px)
- [x] `public/splash.png` - Splash screen image
- [x] `public/opengraph.png` - Open Graph image for sharing

### ✅ Environment Variables
Ensure these environment variables are set in your production environment:

```bash
# Domain Configuration
NEXT_PUBLIC_DOMAIN=app.twyn.sh
NEXT_PUBLIC_WEB3_MODE=true

# Farcaster Configuration
NEXT_PUBLIC_FARCASTER_SIWE_URI=https://app.twyn.sh/login
NEXT_PUBLIC_FARCASTER_OPTIMISM_RPC_URL=https://mainnet.optimism.io
NEXT_PUBLIC_FARCASTER_RELAY_URL=https://relay.farcaster.xyz

# Wallet Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Other required variables...
NEXTAUTH_URL=https://app.twyn.sh
NEXTAUTH_SECRET=your_secret
```

## 🔧 Deployment Steps

### 1. Build the Application
```bash
npm run miniapp:build
```

### 2. Deploy to Production
Deploy your application to your hosting platform (Vercel, Netlify, etc.) ensuring:
- The domain is set to `app.twyn.sh`
- All environment variables are configured
- HTTPS is enabled

### 3. Verify Endpoints
After deployment, verify these endpoints are accessible:

- **Manifest**: `https://app.twyn.sh/.well-known/farcaster.json`
- **Webhook**: `https://app.twyn.sh/api/webhook`
- **Assets**: 
  - `https://app.twyn.sh/icon.png`
  - `https://app.twyn.sh/splash.png`
  - `https://app.twyn.sh/opengraph.png`

### 4. Test the Mini App
1. Open Warpcast mobile app
2. Navigate to a frame or cast that launches your mini app
3. Verify the app loads correctly within the Farcaster environment

## 📱 Mini App Features

### Account Association
- **FID**: 788040
- **Domain**: app.twyn.sh
- **Custody Key**: Configured in manifest

### Supported Features
- ✅ Farcaster authentication via Auth Kit
- ✅ Wallet connection via RainbowKit
- ✅ Web3 mode with simplified navigation
- ✅ Social account management
- ✅ Content creation tools

### Navigation (Web3 Mode)
- **Contents**: Topic Finder, Draft
- **Schedule**: Content scheduling
- **Settings**: App configuration

## 🔍 Troubleshooting

### Common Issues

1. **Manifest not loading**
   - Check that `/.well-known/farcaster.json` returns valid JSON
   - Verify CORS headers allow Farcaster domains

2. **Authentication issues**
   - Ensure `NEXT_PUBLIC_DOMAIN` matches your deployment domain
   - Verify Farcaster Auth Kit configuration

3. **Wallet connection problems**
   - Check WalletConnect project ID is valid
   - Ensure RainbowKit is properly configured

### Debug Commands
```bash
# Validate configuration
npm run validate-miniapp

# Check manifest endpoint
curl https://app.twyn.sh/.well-known/farcaster.json

# Test webhook endpoint
curl https://app.twyn.sh/api/webhook
```

## 📚 Resources

- [Farcaster Mini Apps Documentation](https://miniapps.farcaster.xyz/docs)
- [Farcaster Auth Kit](https://docs.farcaster.xyz/auth-kit/introduction)
- [Base Account Kit](https://docs.base.org/account-kit)

## 🔐 Security Considerations

1. **Environment Variables**: Never commit sensitive keys to version control
2. **Webhook Security**: Implement signature verification for production webhooks
3. **HTTPS**: Always use HTTPS in production
4. **Domain Verification**: Ensure account association domain matches deployment domain

## 📞 Support

For issues related to:
- **Farcaster Integration**: Check Farcaster developer documentation
- **Wallet Integration**: Refer to RainbowKit/WalletConnect documentation
- **App-specific Issues**: Contact the development team

---

**Last Updated**: January 2025
**Version**: 1.0.0