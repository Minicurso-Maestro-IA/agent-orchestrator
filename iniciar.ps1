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
    [string]$Pasta
)

$ErrorActionPreference = "Stop"
function Passo($t) { Write-Host "`n==> $t" -ForegroundColor Cyan }
function Ok($t)    { Write-Host "    OK  $t" -ForegroundColor Green }

Passo "Procurando o repositorio"
$raiz = $null
$aqui = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
if (Test-Path (Join-Path $aqui 'electron.vite.config.ts')) {
    $raiz = $aqui
} else {
    foreach ($base in @($HOME, 'C:\minicurso')) {
        if (-not (Test-Path $base)) { continue }
        $achado = Get-ChildItem -Path $base -Filter 'electron.vite.config.ts' -Recurse -Depth 5 -ErrorAction SilentlyContinue |
                  Where-Object { Test-Path (Join-Path $_.DirectoryName 'agents.json') } |
                  Select-Object -First 1
        if ($achado) { $raiz = $achado.DirectoryName; break }
    }
}
if (-not $raiz) {
    throw "Nao achei o repositorio. Rode este script de dentro da pasta dele, ou passe -Pasta."
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
