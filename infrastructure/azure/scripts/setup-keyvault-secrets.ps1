# ECONEURA Key Vault Secrets Setup
# PowerShell script to initialize Azure Key Vault with required secrets

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "econeura-$Environment-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$KeyVaultName
)

# Import required modules
Import-Module Az.KeyVault -Force
Import-Module Az.Accounts -Force

# Color output functions
function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Main execution
try {
    Write-Info "Setting up Azure Key Vault secrets for ECONEURA $Environment environment"
    
    # Connect to Azure
    Write-Info "Connecting to Azure subscription: $SubscriptionId"
    $context = Set-AzContext -SubscriptionId $SubscriptionId
    Write-Success "Connected to Azure subscription: $($context.Subscription.Name)"
    
    # Discover Key Vault if not provided
    if (-not $KeyVaultName) {
        Write-Info "Discovering Key Vault in resource group: $ResourceGroupName"
        $keyVaults = Get-AzKeyVault -ResourceGroupName $ResourceGroupName
        if ($keyVaults.Count -eq 0) {
            throw "No Key Vault found in resource group: $ResourceGroupName"
        }
        $KeyVaultName = $keyVaults[0].VaultName
        Write-Info "Using Key Vault: $KeyVaultName"
    }
    
    # Generate secure secrets
    Write-Info "Generating secure secrets..."
    
    $secrets = @{
        "jwt-secret-$Environment" = [System.Web.Security.Membership]::GeneratePassword(64, 16)
        "postgres-admin-password" = [System.Web.Security.Membership]::GeneratePassword(32, 8)
        "nextauth-secret-$Environment" = [System.Web.Security.Membership]::GeneratePassword(48, 12)
        "redis-password-$Environment" = [System.Web.Security.Membership]::GeneratePassword(24, 6)
        "webhook-secret-$Environment" = [System.Web.Security.Membership]::GeneratePassword(40, 10)
    }
    
    # Environment-specific database URL
    $postgresHost = "econeura-$Environment-postgres.postgres.database.azure.com"
    $databaseUrl = "postgresql://econeura_admin:$($secrets['postgres-admin-password'])@$postgresHost`:5432/econeura_db?sslmode=require"
    $secrets["database-url-$Environment"] = $databaseUrl
    
    # Prompt for OpenAI API Key (sensitive, don't generate)
    do {
        $openaiKey = Read-Host "Enter OpenAI API Key for $Environment environment" -AsSecureString
        $openaiKeyPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($openaiKey))
    } while ([string]::IsNullOrWhiteSpace($openaiKeyPlain))
    
    $secrets["openai-api-key"] = $openaiKeyPlain
    
    # Store secrets in Key Vault
    Write-Info "Storing secrets in Key Vault: $KeyVaultName"
    
    foreach ($secretName in $secrets.Keys) {
        try {
            $secureString = ConvertTo-SecureString $secrets[$secretName] -AsPlainText -Force
            $result = Set-AzKeyVaultSecret -VaultName $KeyVaultName -Name $secretName -SecretValue $secureString
            Write-Success "Created secret: $secretName"
        }
        catch {
            Write-Error "Failed to create secret $secretName`: $($_.Exception.Message)"
        }
    }
    
    # Set up access policies for GitHub Actions (if service principal exists)
    Write-Info "Checking for GitHub Actions service principal..."
    try {
        $spName = "econeura-github-actions-$Environment"
        $sp = Get-AzADServicePrincipal -DisplayName $spName -ErrorAction SilentlyContinue
        
        if ($sp) {
            Write-Info "Setting Key Vault access policy for: $spName"
            Set-AzKeyVaultAccessPolicy -VaultName $KeyVaultName -ServicePrincipalName $sp.AppId -PermissionsToSecrets Get,List
            Write-Success "Access policy configured for GitHub Actions"
        } else {
            Write-Warning "GitHub Actions service principal not found. Manual access policy setup required."
        }
    }
    catch {
        Write-Warning "Could not configure GitHub Actions access policy: $($_.Exception.Message)"
    }
    
    # Output summary
    Write-Info "Secret setup completed for environment: $Environment"
    Write-Info "Key Vault: $KeyVaultName"
    Write-Info "Secrets created: $($secrets.Keys.Count)"
    
    # Generate environment file template
    $envTemplate = @"
# ECONEURA Environment Configuration - $Environment
# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')

# Database
DATABASE_URL=`@Microsoft.KeyVault(SecretUri=https://$KeyVaultName.vault.azure.net/secrets/database-url-$Environment/)

# Authentication
JWT_SECRET=`@Microsoft.KeyVault(SecretUri=https://$KeyVaultName.vault.azure.net/secrets/jwt-secret-$Environment/)
NEXTAUTH_SECRET=`@Microsoft.KeyVault(SecretUri=https://$KeyVaultName.vault.azure.net/secrets/nextauth-secret-$Environment/)

# AI Services
OPENAI_API_KEY=`@Microsoft.KeyVault(SecretUri=https://$KeyVaultName.vault.azure.net/secrets/openai-api-key/)

# Cache
REDIS_PASSWORD=`@Microsoft.KeyVault(SecretUri=https://$KeyVaultName.vault.azure.net/secrets/redis-password-$Environment/)

# Webhooks
WEBHOOK_SECRET=`@Microsoft.KeyVault(SecretUri=https://$KeyVaultName.vault.azure.net/secrets/webhook-secret-$Environment/)

# Environment
NODE_ENV=$Environment
ENVIRONMENT=$Environment
"@
    
    $envPath = ".\env-template-$Environment.txt"
    $envTemplate | Out-File -FilePath $envPath -Encoding UTF8
    Write-Success "Environment template saved to: $envPath"
    
    Write-Success "🚀 Key Vault setup completed successfully for $Environment environment!"
    
} catch {
    Write-Error "Script execution failed: $($_.Exception.Message)"
    Write-Error "Stack trace: $($_.ScriptStackTrace)"
    exit 1
}

# Security reminder
Write-Warning "SECURITY REMINDER:"
Write-Warning "- Keep the generated environment template secure"
Write-Warning "- Verify Key Vault access policies are correctly configured"  
Write-Warning "- Monitor Key Vault access logs regularly"
Write-Warning "- Rotate secrets periodically according to your security policy"