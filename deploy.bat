@echo off
REM Mind Life Key - GitHub Pages Deployment Script (Windows)
REM This script builds the Quasar app and deploys it to GitHub Pages

setlocal enabledelayedexpansion

echo 🚀 Starting deployment to GitHub Pages...

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Not in a git repository. Please run this script from the project root.
    exit /b 1
)

REM Check if we have a remote origin
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [ERROR] No remote origin found. Please add a GitHub repository as origin.
    exit /b 1
)

REM Get repository information
for /f "tokens=*" %%i in ('git remote get-url origin') do set REPO_URL=%%i
for %%i in ("%REPO_URL%") do set REPO_NAME=%%~ni

echo [INFO] Repository: %REPO_NAME%
echo [INFO] Repository URL: %REPO_URL%

REM Check if we have the necessary tools
echo [INFO] Checking dependencies...

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    exit /b 1
)

where yarn >nul 2>&1
if errorlevel 1 (
    where npm >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Neither npm nor yarn is installed. Please install one of them.
        exit /b 1
    )
    set PACKAGE_MANAGER=npm
    echo [INFO] Using npm as package manager
) else (
    set PACKAGE_MANAGER=yarn
    echo [INFO] Using yarn as package manager
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    if "%PACKAGE_MANAGER%"=="yarn" (
        yarn install
    ) else (
        npm install
    )
    echo [SUCCESS] Dependencies installed
) else (
    echo [INFO] Dependencies already installed
)

REM Clean previous build
echo [INFO] Cleaning previous build...
if exist "dist" rmdir /s /q "dist"
echo [SUCCESS] Previous build cleaned

REM Build the application
echo [INFO] Building application for production...
set NODE_ENV=production
if "%PACKAGE_MANAGER%"=="yarn" (
    yarn build
) else (
    npm run build
)

REM Check if build was successful
if not exist "dist\spa" (
    echo [ERROR] Build failed. No dist\spa directory found.
    exit /b 1
)

echo [SUCCESS] Application built successfully

REM Create a temporary directory for deployment
set TEMP_DIR=%TEMP%\mind-life-key-deploy-%RANDOM%
mkdir "%TEMP_DIR%"
echo [INFO] Created temporary directory: %TEMP_DIR%

REM Copy dist contents to temp directory
xcopy "dist\spa\*" "%TEMP_DIR%\" /E /I /Y

REM Navigate to temp directory
pushd "%TEMP_DIR%"

REM Initialize git repository in temp directory
git init
git add .
git commit -m "Deploy to GitHub Pages - %DATE% %TIME%"

REM Add GitHub Pages remote
git remote add origin "%REPO_URL%"

REM Deploy to gh-pages branch
echo [INFO] Deploying to GitHub Pages...
git push -f origin HEAD:gh-pages

REM Clean up
popd
rmdir /s /q "%TEMP_DIR%"

echo [SUCCESS] Deployment completed successfully!
echo [INFO] Your app should be available at: https://%REPO_NAME%.github.io

REM Instructions for enabling GitHub Pages
echo.
echo [WARNING] IMPORTANT: Make sure GitHub Pages is enabled in your repository settings:
echo 1. Go to your repository on GitHub
echo 2. Click on 'Settings' tab
echo 3. Scroll down to 'Pages' section
echo 4. Under 'Source', select 'Deploy from a branch'
echo 5. Select 'gh-pages' branch and '/ (root)' folder
echo 6. Click 'Save'
echo.
echo [INFO] Your app will be available at the URL shown above once GitHub Pages is enabled.

pause
