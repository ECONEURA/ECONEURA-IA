#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

Write-Host "🧹 Cleaning build outputs..." -ForegroundColor Blue

# Remove build directories
@("dist", ".next", ".cache", "coverage") | ForEach-Object {
    if (Test-Path $_) {
        Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  Removed root $_" -ForegroundColor Gray
    }
}

# Clean apps directories
if (Test-Path "apps") {
    Get-ChildItem "apps" -Directory | ForEach-Object {
        $appDir = $_
        @(".next", ".cache", "coverage", "dist") | ForEach-Object {
            $cleanDir = $_
            $path = Join-Path $appDir.FullName $cleanDir
            if (Test-Path $path) {
                Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "  Removed $($appDir.Name)/$cleanDir" -ForegroundColor Gray
            }
        }
    }
}

# Clean packages directories
if (Test-Path "packages") {
    Get-ChildItem "packages" -Directory | ForEach-Object {
        $pkgDir = $_
        @("dist", ".cache", "coverage") | ForEach-Object {
            $cleanDir = $_
            $path = Join-Path $pkgDir.FullName $cleanDir
            if (Test-Path $path) {
                Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "  Removed $($pkgDir.Name)/$cleanDir" -ForegroundColor Gray
            }
        }
    }
}

# Remove TypeScript build info files
Get-ChildItem -Path . -Recurse -Name "*.tsbuildinfo" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item $_ -Force -ErrorAction SilentlyContinue
    Write-Host "  Removed $_" -ForegroundColor Gray
}

Write-Host "✅ Clean complete" -ForegroundColor Green