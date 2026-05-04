# PowerShell script to run migration via Supabase REST API
$ErrorActionPreference = "Stop"

Write-Host "🚀 Running supervised units access migration..." -ForegroundColor Cyan
Write-Host ""

# Read migration SQL
$sql = Get-Content -Path "supabase/migrations/20260504000000_add_supervised_units_access.sql" -Raw

# Supabase credentials
$supabaseUrl = "https://mauyygrbdopmpdpnwzra.supabase.co"
$serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q"

# Database connection string
$dbPassword = "Aliham251118!"
$dbHost = "db.mauyygrbdopmpdpnwzra.supabase.co"
$dbUser = "postgres"
$dbName = "postgres"
$dbPort = "5432"

Write-Host "📝 Executing SQL migration via PostgreSQL connection..." -ForegroundColor Yellow
Write-Host ""

# Create temporary SQL file
$tempFile = [System.IO.Path]::GetTempFileName() + ".sql"
$sql | Out-File -FilePath $tempFile -Encoding UTF8

try {
    # Try using psql if available
    $env:PGPASSWORD = $dbPassword
    $psqlOutput = & psql -h $dbHost -U $dbUser -d $dbName -p $dbPort -f $tempFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Changes applied:" -ForegroundColor Cyan
        Write-Host "   • Created get_accessible_departments() function"
        Write-Host "   • Updated employees SELECT policy"
        Write-Host "   • Updated employees INSERT policy"
        Write-Host "   • Updated employees UPDATE policy"
        Write-Host "   • Updated employees DELETE policy"
        Write-Host "   • Updated position_references SELECT policy"
        Write-Host ""
        Write-Host "✨ Admin unit can now access supervised Satpel/Workshop units!" -ForegroundColor Green
    } else {
        throw "psql execution failed"
    }
} catch {
    Write-Host "⚠️  psql not available, trying alternative method..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "❌ Unable to execute migration automatically" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Please run manually:" -ForegroundColor Yellow
    Write-Host "   1. Open: https://supabase.com/dashboard/project/mauyygrbdopmpdpnwzra/sql/new"
    Write-Host "   2. Copy content from: supabase/migrations/20260504000000_add_supervised_units_access.sql"
    Write-Host "   3. Paste and click 'Run'"
    Write-Host ""
} finally {
    # Clean up temp file
    if (Test-Path $tempFile) {
        Remove-Item $tempFile
    }
}
