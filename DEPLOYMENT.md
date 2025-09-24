# Deployment Guide - Mind Life Key

This guide explains how to deploy your Mind Life Key financial management app to GitHub Pages.

## Prerequisites

- Node.js (version 20 or higher)
- npm or yarn package manager
- Git repository with GitHub remote
- GitHub account with repository access

## Deployment Methods

### Method 1: Manual Deployment (Windows)

1. **Run the deployment script:**

   ```bash
   npm run deploy:gh-pages
   ```

   or

   ```bash
   deploy.bat
   ```

2. **The script will:**
   - Install dependencies (if needed)
   - Build the application for production
   - Deploy to the `gh-pages` branch
   - Provide the deployment URL

### Method 2: Manual Deployment (Linux/macOS)

1. **Make the script executable:**

   ```bash
   chmod +x deploy.sh
   ```

2. **Run the deployment script:**
   ```bash
   ./deploy.sh
   ```

### Method 3: Automated Deployment with GitHub Actions

The repository includes a GitHub Actions workflow that automatically deploys your app when you push to the main branch.

1. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click on "Settings" tab
   - Scroll down to "Pages" section
   - Under "Source", select "GitHub Actions"

2. **Push to main branch:**

   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

3. **The workflow will automatically:**
   - Build the application
   - Deploy to GitHub Pages
   - Provide the deployment URL

## Configuration Details

### Quasar Configuration

The app is configured for GitHub Pages deployment with:

- **Router Mode:** Hash mode (works with GitHub Pages)
- **Public Path:** `/mind-life-key/` (for production builds)
- **Base URL:** Configured for GitHub Pages subdirectory

### Build Process

The deployment process:

1. **Cleans** previous build artifacts
2. **Installs** dependencies using yarn or npm
3. **Builds** the app with production optimizations
4. **Deploys** to the `gh-pages` branch
5. **Provides** the deployment URL

## Available Scripts

- `npm run build:gh-pages` - Build for GitHub Pages
- `npm run deploy` - Deploy using Windows batch file
- `npm run deploy:gh-pages` - Build and deploy in one command

## Troubleshooting

### Common Issues

1. **Build fails:**
   - Ensure all dependencies are installed
   - Check Node.js version (should be 20+)
   - Verify Quasar CLI is properly installed

2. **Deployment fails:**
   - Check if you have push access to the repository
   - Verify the remote origin is set correctly
   - Ensure GitHub Pages is enabled in repository settings

3. **App doesn't load:**
   - Check if GitHub Pages is enabled
   - Verify the correct branch (`gh-pages`) is selected
   - Wait a few minutes for GitHub Pages to update

### GitHub Pages Setup

If your app doesn't load after deployment:

1. Go to repository Settings
2. Navigate to Pages section
3. Under "Source", select "Deploy from a branch"
4. Choose "gh-pages" branch
5. Select "/ (root)" folder
6. Click "Save"

## URL Structure

Your deployed app will be available at:

- `https://[username].github.io/[repository-name]/`

For example: `https://timothyisaiah.github.io/mind-life-key/`

## Security Notes

- The deployment script uses temporary directories that are cleaned up after deployment
- No sensitive information is stored in the deployment process
- The `gh-pages` branch contains only the built application files

## Support

If you encounter issues:

1. Check the GitHub Actions logs (if using automated deployment)
2. Verify all prerequisites are met
3. Ensure your repository has the correct permissions
4. Check the GitHub Pages documentation for additional help

## Next Steps

After successful deployment:

1. Test your app at the provided URL
2. Share the URL with users
3. Set up custom domain (optional)
4. Configure HTTPS (automatic with GitHub Pages)
5. Monitor usage and performance
