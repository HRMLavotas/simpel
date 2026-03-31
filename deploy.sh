#!/bin/bash

# SIMPEL Deployment Script
# This script helps prepare and deploy the application

echo "🚀 SIMPEL Deployment Helper"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo -e "${YELLOW}⚠️  Vercel CLI not found${NC}"
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo -e "${GREEN}✅ Vercel CLI ready${NC}"
echo ""

# Step 1: Build test
echo "📦 Step 1: Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed. Please fix errors before deploying.${NC}"
    exit 1
fi

echo ""

# Step 2: Check Supabase connection
echo "🔗 Step 2: Checking Supabase connection..."
echo "Supabase URL: https://mauyygrbdopmpdpnwzra.supabase.co"
echo -e "${GREEN}✅ Supabase configured${NC}"
echo ""

# Step 3: Deploy options
echo "🚀 Step 3: Ready to deploy!"
echo ""
echo "Choose deployment method:"
echo "1) Deploy to Vercel (CLI)"
echo "2) Open Vercel Dashboard (Browser)"
echo "3) Show environment variables"
echo "4) Exit"
echo ""

read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo ""
        echo "Deploying to Vercel..."
        vercel --prod
        ;;
    2)
        echo ""
        echo "Opening Vercel Dashboard..."
        if command -v xdg-open &> /dev/null; then
            xdg-open "https://vercel.com/new"
        elif command -v open &> /dev/null; then
            open "https://vercel.com/new"
        else
            echo "Please open: https://vercel.com/new"
        fi
        ;;
    3)
        echo ""
        echo "Environment Variables for Vercel:"
        echo "=================================="
        echo ""
        echo "VITE_SUPABASE_URL=https://mauyygrbdopmpdpnwzra.supabase.co"
        echo ""
        echo "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzEzODQsImV4cCI6MjA5MDUwNzM4NH0.rO9oPY2jbax8GNVjW_rkaE8T4FqrV6OoJa7ME96p4bQ"
        echo ""
        echo "Copy these to Vercel Dashboard > Environment Variables"
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✨ Done!${NC}"
echo ""
echo "Next steps:"
echo "1. Wait for deployment to complete"
echo "2. Get your production URL from Vercel"
echo "3. Update Supabase Auth URLs with your production URL"
echo "4. Test the application"
echo ""
echo "📚 See README_DEPLOYMENT.md for detailed instructions"
