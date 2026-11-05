<#
.SYNOPSIS
    Acha o repositorio, atualiza, instala e abre o iFlow. Um comando so.
.DESCRIPTION
    Existe para nao ser preciso acertar caminho nenhum. Procura o repositorio a
    partir da propria pasta deste arquivo; se nao achar, procura na pasta do
    usuario e em C:\minicurso.

    Usa $env: em vez de setx de proposito: vale para esta janela, que e onde o
    app vai subir. O setx so e necessario para abrir pelo atalho do .exe.
.PARAMETER Branch
    Branch a usar. Padrao: integracao.
.PARAMETER Pasta
    Pasta de trabalho dos terminais. Padrao: a bateria 1.
#>
param(
    [string]$Branch = "integracao",
    [string]$Pasta,
    [string]$Raiz
)

$ErrorActionPreference = "Stop"
function Passo($t) { Write-Host "`n==> $t" -ForegroundColor Cyan }
function Ok($t)    { Write-Host "    OK  $t" -ForegroundColor Green }

if ($Raiz) { $raiz = $Raiz }
Passo "Procurando o repositorio"
if (-not $Raiz) { $raiz = $null }
$aqui = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }

# Candidatos obvios primeiro: e instantaneo, e cobre quase todo mundo.
$tentativas = @(
    $aqui,
    (Join-Path $aqui '..'),
    "$HOME\WebstormProjects\agent-orchestrator",
    "$HOME\agent-orchestrator",
    "$HOME\Documents\agent-orchestrator",
    "$HOME\source\repos\agent-orchestrator",
    "C:\minicurso\orquestrador",
    "C:\minicurso\agent-orchestrator"
)
foreach ($t in $tentativas) {
    if ($t -and (Test-Path (Join-Path $t 'electron.vite.config.ts'))) { $raiz = (Resolve-Path $t).Path; break }
}

# So entao a varredura - pulando node_modules, que e o que fazia isto demorar
# minutos sem imprimir nada e parecer travamento.
if (-not $raiz) {
    Write-Host "    procurando (pode levar um minuto)..." -ForegroundColor Gray
    foreach ($base in @($HOME, 'C:\minicurso')) {
        if (-not (Test-Path $base)) { continue }
        $achado = Get-ChildItem -Path $base -Directory -Recurse -Depth 4 -ErrorAction SilentlyContinue |
                  Where-Object { $_.Name -ne 'node_modules' -and (Test-Path (Join-Path $_.FullName 'electron.vite.config.ts')) } |
                  Select-Object -First 1
        if ($achado) { $raiz = $achado.FullName; break }
    }
}

if (-not $raiz) {
    Write-Host ""
    Write-Host "Nao achei o repositorio." -ForegroundColor Red
    Write-Host "Rode este script de dentro da pasta dele, ou diga onde esta:" -ForegroundColor Yellow
    Write-Host "  .\iniciar.ps1 -Raiz C:\caminho\do\agent-orchestrator" -ForegroundColor Yellow
    exit 1
}
Ok $raiz
Set-Location $raiz

Passo "Atualizando para a branch $Branch"
git fetch origin --prune
git checkout $Branch
git pull origin $Branch
Ok (git rev-parse --short HEAD)

Passo "Dependencias"
if (-not (Test-Path (Join-Path $raiz 'node_modules'))) {
    npm install
} else {
    Ok "node_modules ja existe (apague a pasta para reinstalar)"
}

if (-not $Pasta) { $Pasta = Join-Path $raiz 'minicurso\bateria-1-descontos' }
$env:AGENT_ORCHESTRATOR_SKILLS_DIR   = Join-Path $raiz 'minicurso\skills-virta'
$env:AGENT_ORCHESTRATOR_TERMINAL_CWD = $Pasta

Passo "Abrindo o iFlow"
Write-Host "    skills:   $env:AGENT_ORCHESTRATOR_SKILLS_DIR"
Write-Host "    trabalho: $env:AGENT_ORCHESTRATOR_TERMINAL_CWD"
npm run dev
