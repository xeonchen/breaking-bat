# Deployment Setup Guide

This guide walks through setting up automated deployment to Netlify for the Breaking-Bat application.

## Prerequisites

1. **GitHub Repository**: Make the repository public (recommended for free Netlify features)
2. **Netlify Account**: Create a free account at [netlify.com](https://netlify.com)

## Step 1: Netlify Site Setup

1. **Connect Repository**:
   - Log into Netlify
   - Click "New site from Git"
   - Choose GitHub and authorize Netlify
   - Select your `breaking-bat` repository

2. **Configure Build Settings**:

   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Environment Variables** (if needed):
   - Node version is set via `netlify.toml`
   - No environment variables needed for this app

## Step 2: GitHub Secrets Setup

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

1. **NETLIFY_AUTH_TOKEN**:
   - Go to Netlify User Settings → Applications → Personal Access Tokens
   - Generate a new token
   - Copy and add as GitHub secret

2. **NETLIFY_SITE_ID**:
   - Go to your Netlify site → Site Settings → General
   - Copy the "Site ID" (API ID)
   - Add as GitHub secret

## Step 3: Update Badge URLs

After deployment, update the README.md badge URLs:

1. Replace `NETLIFY_SITE_ID` with your actual site ID
2. Replace `NETLIFY_SITE_NAME` with your actual site name

## Step 4: Branch Protection (Recommended)

1. Go to GitHub repository → Settings → Branches
2. Add branch protection rule for `main`:
   - Require status checks: ✅
   - Require PR reviews: ✅ (recommended)
   - Required status checks:
     - `PR Quality Checks`
     - `Commit Message Validation`

## Expected Workflow

After setup:

1. **Pull Requests**:
   - Automatic quality checks run
   - Netlify creates preview deployment
   - Preview URL available for testing

2. **Main Branch**:
   - Merge triggers production deployment
   - Quality gates must pass first
   - Automatic deployment to production URL

## PWA Configuration

The `netlify.toml` file includes:

- **SPA Routing**: All routes redirect to `index.html`
- **Security Headers**: HTTPS, XSS protection, etc.
- **Caching**: Optimized for PWA assets
- **Service Worker**: No-cache to ensure updates

## Troubleshooting

### Common Issues

1. **Build Fails**: Check Node.js version matches (20.x)
2. **404 on Routes**: Ensure `netlify.toml` redirects are working
3. **PWA Not Installing**: Check service worker and manifest

### Debug Commands

```bash
# Local build test
npm run build
npm run preview

# Check build artifacts
ls -la dist/
```

## Monitoring

- **Build Status**: GitHub Actions tab
- **Deploy Status**: Netlify dashboard
- **Performance**: Netlify Analytics (if enabled)

## Security Notes

- All traffic forced to HTTPS
- Security headers configured
- Service worker caches properly invalidated
- No sensitive data in build artifacts

---

**Next Steps**: After deployment, test the PWA features including offline functionality and installation prompts.
