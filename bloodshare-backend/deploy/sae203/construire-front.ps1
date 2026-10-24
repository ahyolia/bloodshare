# Construit le front web (Expo) branché sur le backend sae203, prêt à glisser dans Netlify.
# À lancer depuis PowerShell (Node est installé côté Windows, pas dans WSL) :
#
#   pwsh -ExecutionPolicy Bypass -File bloodshare-backend\deploy\sae203\construire-front.ps1
#
# pwsh (PowerShell 7) et non powershell (5.1) : ce dernier lit ce fichier UTF-8 comme de
# l'ANSI et affiche les accents de travers.
#
# Produit Téléchargements\aima-dist-sae203 (dossier) et aima-dist-sae203.zip. Voir DEVOPS.md, section 6.
$ErrorActionPreference = 'Stop'

$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$mobile = Join-Path $repo 'bloodshare-mobile'
$envProd = Join-Path $repo 'bloodshare-backend\.env.production'
$sortie = Join-Path ([Environment]::GetFolderPath('UserProfile')) 'Downloads\aima-dist-sae203'
$zip = "$sortie.zip"
$api = 'https://sae203.hopto.org/~cameliaa/api'

function Lire-Variable($nom) {
    $ligne = Select-String -Path $envProd -Pattern "^$nom=(.+)$"
    if (-not $ligne) { throw "$nom introuvable dans $envProd" }
    $ligne.Matches[0].Groups[1].Value.Trim()
}

if (-not (Test-Path $envProd)) { throw "$envProd introuvable : la clé VAPID publique en vient." }
$vapidPublique = Lire-Variable 'VAPID_PUBLIC_KEY'
$vapidPrivee = Lire-Variable 'VAPID_PRIVATE_KEY'

# 📖 Les EXPO_PUBLIC_* sont gravées dans le JS au moment du build. Définies ici, elles
#    l'emportent sur le .env.local du poste (config de dev), qui n'est pas modifié.
$env:EXPO_PUBLIC_API_URL = $api
$env:EXPO_PUBLIC_VAPID_PUBLIC_KEY = $vapidPublique

foreach ($chemin in $sortie, $zip) {
    if (Test-Path $chemin) { Remove-Item -Recurse -Force $chemin -Confirm:$false }
}

Write-Host '▶ Build web'
Push-Location $mobile
try {
    # 📖 node direct plutôt que npx : npx passe par cmd.exe, qui refuse les chemins
    #    \\wsl.localhost\... (« Les chemins d'accès UNC ne sont pas pris en charge »).
    node .\node_modules\expo\bin\cli export -p web --output-dir $sortie --clear
    if ($LASTEXITCODE -ne 0) { throw "expo export a échoué (code $LASTEXITCODE)" }
} finally {
    Pop-Location
}

Write-Host '▶ Vérification'
$js = (Get-ChildItem $sortie -Recurse -Include *.js | ForEach-Object { Get-Content $_.FullName -Raw }) -join "`n"
if (-not $js.Contains($api)) { throw "L'URL $api n'est pas dans le build." }
if ($js.Contains('localhost:8000')) { throw 'Le build contient encore localhost:8000.' }
if (-not $js.Contains($vapidPublique)) { throw "La clé VAPID publique de .env.production n'est pas dans le build." }
if ($js.Contains($vapidPrivee)) { throw 'La clé VAPID PRIVÉE est dans le build : ne pas publier.' }
foreach ($f in '_redirects', 'manifest.json', 'sw.js', 'index.html') {
    if (-not (Test-Path (Join-Path $sortie $f))) { throw "$f manquant dans le build." }
}

Compress-Archive -Path "$sortie\*" -DestinationPath $zip
Write-Host "✅ Prêt : $sortie"
Write-Host "   et $zip ($([math]::Round((Get-Item $zip).Length / 1MB, 1)) Mo)"
Write-Host '   Netlify : site aima-nc > Deploys > glisser le dossier ou le zip.'
