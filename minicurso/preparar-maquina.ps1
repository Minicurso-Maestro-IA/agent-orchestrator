<#
.SYNOPSIS
  Prepara uma máquina da sala para o minicurso: instala a CLI de IA gratuita,
  descompacta o orquestrador e deixa um atalho na área de trabalho.

.DESCRIPTION
  Pensado para ser rodado uma vez por máquina, antes da aula, pelo instrutor.
  Não exige administrador: tudo vai para a pasta do usuário.

  Duas coisas NÃO são automatizáveis e ficam para o fim, na mão:
    1. o primeiro `agy` abre um assistente (tema, modo de render, confiar na pasta);
    2. o login é no navegador, com conta Google.

.EXAMPLE
  .\preparar-maquina.ps1 -Zip .\orquestrador-1.0.0-win-x64.zip
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$Zip,

  [string]$Destino = "C:\minicurso",

  # Pule a instalação da CLI se a sala já tiver sido preparada antes.
  [switch]$SemIA
)

$ErrorActionPreference = 'Stop'

function Passo($txt) { Write-Host "`n==> $txt" -ForegroundColor Cyan }
function Ok($txt)    { Write-Host "    OK  $txt" -ForegroundColor Green }
function Aviso($txt) { Write-Host "    !   $txt" -ForegroundColor Yellow }

if (-not (Test-Path $Zip)) { throw "Zip não encontrado: $Zip" }

$appDir       = Join-Path $Destino 'orquestrador'
$workspaceDir = Join-Path $Destino 'workspace'

Passo "Criando $Destino"
New-Item -ItemType Directory -Force -Path $Destino, $workspaceDir | Out-Null
Ok "pastas prontas"

Passo "Descompactando o orquestrador em $appDir"
if (Test-Path $appDir) {
  Remove-Item -Recurse -Force $appDir
  Aviso "instalação anterior removida"
}
Expand-Archive -Path $Zip -DestinationPath $appDir -Force
$exe = Join-Path $appDir 'Agent Orchestrator.exe'
if (-not (Test-Path $exe)) { throw "O zip não tem 'Agent Orchestrator.exe' na raiz. Zip errado?" }
Ok (Split-Path $exe -Leaf)

# O app procura agents.json e skills/ ao lado do exe. Se não estiverem, o seletor
# de IA e de skill aparece vazio e não é óbvio o porquê — então checa agora.
foreach ($item in @('agents.json', 'skills')) {
  if (-not (Test-Path (Join-Path $appDir $item))) {
    Aviso "$item não veio no zip; o seletor correspondente vai aparecer vazio"
  } else {
    Ok $item
  }
}

if (-not $SemIA) {
  Passo "Instalando o Antigravity CLI (agy)"
  if (Get-Command agy -ErrorAction SilentlyContinue) {
    Ok "já instalado: $((agy --version 2>&1 | Select-Object -First 1))"
  } else {
    # Instalador oficial do Google. Binário compilado: não depende de Node.
    Invoke-RestMethod https://antigravity.google/cli/install.ps1 | Invoke-Expression
    $binDir = Join-Path $env:LOCALAPPDATA 'agy\bin'
    if (Test-Path (Join-Path $binDir 'agy.exe')) {
      Ok "instalado em $binDir"
    } else {
      Aviso "não encontrei agy.exe em $binDir — confira a saída do instalador acima"
    }
  }
}

Passo "Apontando o orquestrador para a pasta de trabalho do aluno"
# Terminais novos nascem no workspace, e o observador de documentos vigia ele.
# setx grava no perfil do usuário: vale para toda sessão futura, não para esta.
setx AGENT_ORCHESTRATOR_TERMINAL_CWD $workspaceDir | Out-Null
setx AGENT_ORCHESTRATOR_WATCH_DIR    $workspaceDir | Out-Null
Ok "AGENT_ORCHESTRATOR_TERMINAL_CWD e _WATCH_DIR = $workspaceDir"

Passo "Criando atalho na área de trabalho"
$lnk = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Orquestrador.lnk'
$shell = New-Object -ComObject WScript.Shell
$atalho = $shell.CreateShortcut($lnk)
$atalho.TargetPath       = $exe
$atalho.WorkingDirectory = $workspaceDir
$atalho.Description      = 'Orquestrador de agentes de IA - minicurso'
$atalho.Save()
Ok $lnk

Write-Host @"

------------------------------------------------------------
Máquina pronta. Falta o que só dá para fazer na mão:

  1. Abra um terminal NOVO (o PATH e as variáveis só valem em sessão nova).
  2. Rode:  agy
     - responda o assistente de primeiro uso (tema, render, confiar na pasta);
     - faça login com a conta Google.
  3. Dentro do agy, rode  /usage  e ANOTE o limite que aparecer.
     O Google não publica a cota do plano gratuito, e ela é semanal.
     É esse número que diz quantos turnos de agente a turma aguenta.
  4. Feche o agy e abra o atalho Orquestrador na área de trabalho.
  5. Crie um terminal escolhendo a IA "Antigravity CLI (grátis)" e veja se a
     skill chega como primeiro prompt.

No primeiro clique o Windows SmartScreen vai avisar que o app é de autor
desconhecido (o executável não é assinado): "Mais informações" > "Executar
assim mesmo".
------------------------------------------------------------
"@ -ForegroundColor White
