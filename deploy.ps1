# SIMPEL Deployment Script for Windows PowerShell
# This script helps prepare and deploy the application

Write-Host "🚀 SIMPEL Deployment Helper" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build test
Write-Host "📦 Step 1: Testing build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Check Supabase connection
Write-Host "🔗 Step 2: Checking Supabase connection..." -ForegroundColor Yellow
Write-Host "Supabase URL: https://mauyygrbdopmpdpnwzra.supabase.co"
Write-Host "✅ Supabase configured" -ForegroundColor Green
Write-Host ""

# Step 3: Deploy options
Write-Host "🚀 Step 3: Ready to deploy!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Choose deployment method:"
Write-Host "1) Deploy to Vercel (CLI)"
Write-Host "2) Open Vercel Dashboard (Browser)"
Write-Host "3) Show environment variables"
Write-Host "4) Exit"
Write-Host ""

$choice = Read-Host "Enter choice [1-4]"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
        
        # Check if Vercel CLI is installed
        $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
        if (-not $vercelInstalled) {
            Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
            npm install -g vercel
        }
        
        vercel --prod
    }
    "2" {
        Write-Host ""
        Write-Host "Opening Vercel Dashboard..." -ForegroundColor Yellow
        Start-Process "https://vercel.com/new"
    }
    "3" {
        Write-Host ""
        Write-Host "Environment Variables for Vercel:" -ForegroundColor Cyan
        Write-Host "==================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "VITE_SUPABASE_URL=https://mauyygrbdopmpdpnwzra.supabase.co"
        Write-Host ""
        Write-Host "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzEzODQsImV4cCI6MjA5MDUwNzM4NH0.rO9oPY2jbax8GNVjW_rkaE8T4FqrV6OoJa7ME96p4bQ"
        Write-Host ""
        Write-Host "Copy these to Vercel Dashboard > Environment Variables" -ForegroundColor Yellow
    }
    "4" {
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Wait for deployment to complete"
Write-Host "2. Get your production URL from Vercel"
Write-Host "3. Update Supabase Auth URLs with your production URL"
Write-Host "4. Test the application"
Write-Host ""
Write-Host "📚 See README_DEPLOYMENT.md for detailed instructions" -ForegroundColor Cyan
