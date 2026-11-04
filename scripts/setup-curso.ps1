<#
.SYNOPSIS
    Script de preparação do ambiente para o curso com Agent Orchestrator.
.DESCRIPTION
    Configura automaticamente as permissões do Antigravity CLI (agy) para execução sem prompts manuais
    e prepara o ambiente para receber as ordens e guardrails diretamente das Skills especializadas.
#>

$ErrorActionPreference = "Stop"

Write-Host "`n=== Configurando Ambiente para o Curso ===" -ForegroundColor Cyan

# 1. Configurar ~/.gemini/antigravity-cli/settings.json
$geminiCliDir = Join-Path $HOME ".gemini\antigravity-cli"
if (!(Test-Path $geminiCliDir)) {
    New-Item -ItemType Directory -Force -Path $geminiCliDir | Out-Null
    Write-Host " Diretório $geminiCliDir criado." -ForegroundColor Gray
}

$settingsPath = Join-Path $geminiCliDir "settings.json"
$settingsContent = @"
{
  "model": "Gemini 3.8 Flash (Medium)",
  "agentMode": "auto",
  "toolPermission": "always-proceed",
  "trustedWorkspaces": [
    "$($HOME -replace '\\', '\\')"
  ]
}
"@

[System.IO.File]::WriteAllText($settingsPath, $settingsContent, [System.Text.Encoding]::UTF8)
Write-Host " Permissões do agy configuradas em: $settingsPath" -ForegroundColor Green

# 2. Copiar Skills locais para o diretório global do Gemini se desejado
$projectSkillsDir = Join-Path $PSScriptRoot "..\skills"
$globalSkillsDir = Join-Path $HOME ".gemini\config\skills"

if (Test-Path $projectSkillsDir) {
    if (!(Test-Path $globalSkillsDir)) {
        New-Item -ItemType Directory -Force -Path $globalSkillsDir | Out-Null
    }
    Copy-Item -Path "$projectSkillsDir\*" -Destination $globalSkillsDir -Recurse -Force
    Write-Host " Skills copiadas para o catálogo do Gemini ($globalSkillsDir)." -ForegroundColor Green
}

Write-Host "`n Configuração concluída! O agy e o Agent Orchestrator estão prontos para a aula.`n" -ForegroundColor Green
