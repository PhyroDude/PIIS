[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
    [string]$RootCaPath,

    [ValidateSet('CurrentUser', 'LocalMachine')]
    [string]$Scope = 'CurrentUser'
)

$ErrorActionPreference = 'Stop'

try {
    $resolvedPath = (Resolve-Path -LiteralPath $RootCaPath).Path
    $certificate = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($resolvedPath)

    if ($certificate.HasPrivateKey) {
        throw 'El archivo proporcionado contiene una clave privada. Debes usar únicamente rootCA.pem, nunca rootCA-key.pem ni un PFX/P12.'
    }

    if ($certificate.Subject -ne $certificate.Issuer) {
        throw 'El certificado proporcionado no parece ser una CA raíz autofirmada.'
    }

    $storeLocation = if ($Scope -eq 'LocalMachine') {
        [System.Security.Cryptography.X509Certificates.StoreLocation]::LocalMachine
    } else {
        [System.Security.Cryptography.X509Certificates.StoreLocation]::CurrentUser
    }

    $store = [System.Security.Cryptography.X509Certificates.X509Store]::new(
        [System.Security.Cryptography.X509Certificates.StoreName]::Root,
        $storeLocation
    )
    $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
    try {
        $alreadyInstalled = @($store.Certificates | Where-Object { $_.Thumbprint -eq $certificate.Thumbprint }).Count -gt 0
        if ($alreadyInstalled) {
            Write-Output "La CA de InterLAB ya está instalada en $Scope. No se hicieron cambios."
        } else {
            $store.Add($certificate)
            Write-Output "CA raíz de InterLAB instalada en el almacén Root de $Scope."
        }
    } finally {
        $store.Close()
    }

    Write-Output "Huella SHA-1 para verificación: $($certificate.Thumbprint)"
    Write-Output 'Reinicia el navegador antes de probar el acceso HTTPS.'
} catch {
    Write-Error "No se pudo instalar la CA raíz de InterLAB: $($_.Exception.Message)"
    exit 1
}
