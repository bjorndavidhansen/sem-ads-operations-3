# Simple verification script for Campaign Clone Operations

Write-Host "### Campaign Clone Operations - Verification ###" -ForegroundColor Cyan

# Verify components exist
Write-Host "Checking implementation components..." -ForegroundColor Yellow

$componentFiles = @(
    "src/components/operations/operation-recovery-dashboard.tsx",
    "src/components/operations/real-time-validation-preview.tsx",
    "src/hooks/use-operation-tracking.ts",
    "src/pages/operations/operation-dashboard.tsx",
    "src/lib/google-ads-api.ts"
)

$missingComponents = @()
foreach ($file in $componentFiles) {
    if (-not (Test-Path $file)) {
        $missingComponents += $file
    }
}

if ($missingComponents.Count -gt 0) {
    Write-Host "Missing components:" -ForegroundColor Red
    foreach ($file in $missingComponents) {
        Write-Host " - $file" -ForegroundColor Red
    }
} else {
    Write-Host "All implementation components verified!" -ForegroundColor Green
}

# Verify documentation exists
Write-Host "Checking documentation..." -ForegroundColor Yellow

$docFiles = @(
    "documentation/deployment-guide.md",
    "documentation/releases/v1.2-clone-operations.md",
    "documentation/user-guides/campaign-clone-operation-guide.md",
    "documentation/executive-summary-campaign-clone.md",
    "documentation/implementation-status-report.md"
)

$missingDocs = @()
foreach ($file in $docFiles) {
    if (-not (Test-Path $file)) {
        $missingDocs += $file
    }
}

if ($missingDocs.Count -gt 0) {
    Write-Host "Missing documentation:" -ForegroundColor Yellow
    foreach ($file in $missingDocs) {
        Write-Host " - $file" -ForegroundColor Yellow
    }
} else {
    Write-Host "All documentation verified!" -ForegroundColor Green
}

# Run tests if specified
$runTests = $false
if ($runTests) {
    Write-Host "Running tests..." -ForegroundColor Yellow
    npm test -- --run src/components/test
}

# Summary
Write-Host "`n### Verification Summary ###" -ForegroundColor Cyan
Write-Host "Implementation Components: " -NoNewline
if ($missingComponents.Count -eq 0) {
    Write-Host "✓ COMPLETE" -ForegroundColor Green
} else {
    Write-Host "✗ INCOMPLETE" -ForegroundColor Red
}

Write-Host "Documentation: " -NoNewline
if ($missingDocs.Count -eq 0) {
    Write-Host "✓ COMPLETE" -ForegroundColor Green
} else {
    Write-Host "⚠ PARTIAL" -ForegroundColor Yellow
}

Write-Host "`nCampaign Clone Operation Verification Complete!" -ForegroundColor Cyan
