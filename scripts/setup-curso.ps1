<#
.SYNOPSIS
    Prepara o ambiente do curso com o iFlow.
.DESCRIPTION
    Deixa o Antigravity CLI (agy) trabalhar sem pedir confirmação a cada ação,
    DENTRO DA PASTA DO EXERCÍCIO. A configuração anterior é salva, e o -Desfazer
    devolve tudo ao que era.

    Por que a pasta importa: "sem confirmação" vale para onde o agente tiver
    permissão. Apontando para a pasta do usuário, vale para Documentos, Desktop
    e qualquer repositório que ela tenha - e continua valendo depois da aula,
    para quem usar a máquina em seguida.
.PARAMETER Pasta
    A pasta do exercício. Padrão: C:\minicurso\workspace.
.PARAMETER Desfazer
    Restaura o settings.json que existia antes.
#>
param(
    [string]$Pasta = "C:\minicurso\workspace",
    [switch]$Desfazer
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== Configurando Ambiente para o Curso ===" -ForegroundColor Cyan

# 1. Configurar o settings.json do agy
$geminiCliDir = Join-Path $HOME ".gemini\antigravity-cli"
if (!(Test-Path $geminiCliDir)) {
    New-Item -ItemType Directory -Force -Path $geminiCliDir | Out-Null
    Write-Host " Diretório $geminiCliDir criado." -ForegroundColor Gray
}

$settingsPath = Join-Path $geminiCliDir "settings.json"
$backupPath   = "$settingsPath.antes-do-curso"

if ($Desfazer) {
    if (Test-Path $backupPath) {
        Move-Item -Force $backupPath $settingsPath
        Write-Host " Configuração anterior restaurada." -ForegroundColor Green
    } elseif (Test-Path $settingsPath) {
        Remove-Item $settingsPath
        Write-Host " Não havia configuração anterior; a do curso foi removida." -ForegroundColor Green
    } else {
        Write-Host " Nada a desfazer." -ForegroundColor Gray
    }
    exit 0
}

# Guarda o que existia: um aluno que já usa o agy não pode perder a configuração dele.
if ((Test-Path $settingsPath) -and -not (Test-Path $backupPath)) {
    Copy-Item $settingsPath $backupPath
    Write-Host " Configuração anterior salva em $backupPath" -ForegroundColor Gray
}

if (!(Test-Path $Pasta)) {
    New-Item -ItemType Directory -Force -Path $Pasta | Out-Null
}
$pastaCompleta = (Resolve-Path $Pasta).Path

# Mescla, em vez de sobrescrever: só as chaves do curso são tocadas.
$config = @{}
if (Test-Path $settingsPath) {
    try {
        $existente = Get-Content $settingsPath -Raw | ConvertFrom-Json
        foreach ($prop in $existente.PSObject.Properties) { $config[$prop.Name] = $prop.Value }
    } catch {
        Write-Host " settings.json anterior ilegível; começando do zero." -ForegroundColor Yellow
    }
}

$config["model"]             = "Gemini 3.8 Flash (Medium)"
$config["agentMode"]         = "auto"
$config["toolPermission"]    = "always-proceed"
$config["trustedWorkspaces"] = @($pastaCompleta)

$config | ConvertTo-Json -Depth 10 | Set-Content -Path $settingsPath -Encoding UTF8
Write-Host " agy liberado SOMENTE em: $pastaCompleta" -ForegroundColor Green
Write-Host " Para reverter:  .\setup-curso.ps1 -Desfazer" -ForegroundColor Gray

# 2. As skills ficam no repositório, lidas via AGENT_ORCHESTRATOR_SKILLS_DIR.
#    Copiá-las para o catálogo global do agy deixava arquivos na máquina depois
#    da aula, sem nada que os removesse, então deixou de ser feito aqui.

Write-Host "`n Pronto. O agy e o iFlow estão prontos para a aula.`n" -ForegroundColor Green
