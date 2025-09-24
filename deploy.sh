#!/bin/bash

# Mind Life Key - GitHub Pages Deployment Script
# This script builds the Quasar app and deploys it to GitHub Pages

set -e  # Exit on any error

echo "🚀 Starting deployment to GitHub Pages..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository. Please run this script from the project root."
    exit 1
fi

# Check if we have a remote origin
if ! git remote get-url origin > /dev/null 2>&1; then
    print_error "No remote origin found. Please add a GitHub repository as origin."
    exit 1
fi

# Get repository information
REPO_URL=$(git remote get-url origin)
REPO_NAME=$(basename "$REPO_URL" .git)

print_status "Repository: $REPO_NAME"
print_status "Repository URL: $REPO_URL"

# Check if we have the necessary tools
print_status "Checking dependencies..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null && ! command -v yarn &> /dev/null; then
    print_error "Neither npm nor yarn is installed. Please install one of them."
    exit 1
fi

# Use yarn if available, otherwise npm
if command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
    print_status "Using yarn as package manager"
else
    PACKAGE_MANAGER="npm"
    print_status "Using npm as package manager"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn install
    else
        npm install
    fi
    print_success "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Clean previous build
print_status "Cleaning previous build..."
rm -rf dist/
print_success "Previous build cleaned"

# Build the application
print_status "Building application for production..."
if [ "$PACKAGE_MANAGER" = "yarn" ]; then
    yarn build
else
    npm run build
fi

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build failed. No dist directory found."
    exit 1
fi

print_success "Application built successfully"

# Create a temporary directory for deployment
TEMP_DIR=$(mktemp -d)
print_status "Created temporary directory: $TEMP_DIR"

# Copy dist contents to temp directory
cp -r dist/* "$TEMP_DIR/"

# Navigate to temp directory
cd "$TEMP_DIR"

# Initialize git repository in temp directory
git init
git add .
git commit -m "Deploy to GitHub Pages - $(date)"

# Add GitHub Pages remote
git remote add origin "$REPO_URL"

# Get current branch name
CURRENT_BRANCH=$(git branch --show-current)

# Deploy to gh-pages branch
print_status "Deploying to GitHub Pages..."
git push -f origin HEAD:gh-pages

# Clean up
cd - > /dev/null
rm -rf "$TEMP_DIR"

print_success "Deployment completed successfully!"
print_status "Your app should be available at: https://$(echo $REPO_URL | sed 's/.*github.com[:/]\([^/]*\)\/\([^.]*\).*/\1.github.io\/\2/')"

# Instructions for enabling GitHub Pages
echo ""
print_warning "IMPORTANT: Make sure GitHub Pages is enabled in your repository settings:"
echo "1. Go to your repository on GitHub"
echo "2. Click on 'Settings' tab"
echo "3. Scroll down to 'Pages' section"
echo "4. Under 'Source', select 'Deploy from a branch'"
echo "5. Select 'gh-pages' branch and '/ (root)' folder"
echo "6. Click 'Save'"
echo ""
print_status "Your app will be available at the URL shown above once GitHub Pages is enabled."
