# Integration Test Script for Campaign Clone Operations
# This script runs the integration tests and verifies the build integrity

Write-Host "### Campaign Clone Operations - Integration Test ###" -ForegroundColor Cyan

# Step 1: Install dependencies if needed
Write-Host "Checking dependencies..." -ForegroundColor Yellow
$npmStatus = npm list
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies. Exiting." -ForegroundColor Red
        exit 1
    }
}

# Step 2: Run linting checks
Write-Host "Running lint checks..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "Lint checks failed. Please fix issues before continuing." -ForegroundColor Red
    exit 1
}
Write-Host "Lint checks passed." -ForegroundColor Green

# Step 3: Run unit tests
Write-Host "Running unit tests..." -ForegroundColor Yellow
npm test -- --run "src/components/test"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Unit tests failed. Please fix issues before continuing." -ForegroundColor Red
    exit 1
}
Write-Host "Unit tests passed." -ForegroundColor Green

# Step 4: Run integration tests
Write-Host "Running integration tests..." -ForegroundColor Yellow
npm test -- --run "src/components/test/integration"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Integration tests failed. Please fix issues before continuing." -ForegroundColor Red
    exit 1
}
Write-Host "Integration tests passed." -ForegroundColor Green

# Step 5: Build the application
Write-Host "Building application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Please fix issues before continuing." -ForegroundColor Red
    exit 1
}
Write-Host "Build completed successfully." -ForegroundColor Green

# Step 6: Verify key files exist in build
Write-Host "Verifying build output..." -ForegroundColor Yellow
$requiredFiles = @(
    "build/index.html",
    "build/static/js/main.*.js",
    "build/static/css/main.*.css"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    $matches = Get-ChildItem -Path $file -ErrorAction SilentlyContinue
    if (-not $matches) {
        Write-Host "Missing required file pattern: $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host "Build verification failed. Some files are missing." -ForegroundColor Red
    exit 1
}

# Step 7: Verify operations-related files
$operationsFiles = @(
    "src/components/operations/operation-recovery-dashboard.tsx",
    "src/components/operations/real-time-validation-preview.tsx",
    "src/hooks/use-operation-tracking.ts",
    "src/pages/operations/operation-dashboard.tsx"
)

$allOperationFilesExist = $true
foreach ($file in $operationsFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "Missing operations component: $file" -ForegroundColor Red
        $allOperationFilesExist = $false
    }
}

if (-not $allOperationFilesExist) {
    Write-Host "Operations component verification failed. Some files are missing." -ForegroundColor Red
    exit 1
}

# Step 8: Check documentation
$documentationFiles = @(
    "documentation/deployment-guide.md",
    "documentation/releases/v1.2-clone-operations.md",
    "documentation/user-guides/campaign-clone-operation-guide.md",
    "documentation/executive-summary-campaign-clone.md"
)

$allDocFilesExist = $true
foreach ($file in $documentationFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "Missing documentation file: $file" -ForegroundColor Red
        $allDocFilesExist = $false
    }
}

if (-not $allDocFilesExist) {
    Write-Host "Documentation verification failed. Some files are missing." -ForegroundColor Yellow
    Write-Host "Please ensure all documentation is complete before deployment." -ForegroundColor Yellow
} else {
    Write-Host "Documentation verification passed." -ForegroundColor Green
}

# Final summary
Write-Host "`n### Integration Test Summary ###" -ForegroundColor Cyan
Write-Host "✓ Dependencies verified" -ForegroundColor Green
Write-Host "✓ Lint checks passed" -ForegroundColor Green
Write-Host "✓ Unit tests passed" -ForegroundColor Green
Write-Host "✓ Integration tests passed" -ForegroundColor Green
Write-Host "✓ Build successful" -ForegroundColor Green
Write-Host "✓ Build files verified" -ForegroundColor Green
Write-Host "✓ Operations components verified" -ForegroundColor Green

if ($allDocFilesExist) {
    Write-Host "✓ Documentation complete" -ForegroundColor Green
} else {
    Write-Host "⚠ Documentation incomplete" -ForegroundColor Yellow
}

Write-Host "`nCampaign Clone Operation implementation is ready for deployment!" -ForegroundColor Cyan
Write-Host "Please refer to documentation/deployment-guide.md for deployment instructions." -ForegroundColor White
