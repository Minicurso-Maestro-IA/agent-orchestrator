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

# O Windows carimba todo arquivo vindo da internet (Mark-of-the-Web), e o
# Expand-Archive repassa o carimbo para tudo que sai de dentro. É esse carimbo
# que faz o SmartScreen aparecer. Tirar do zip ANTES de extrair resolve de uma
# vez; depois seria preciso percorrer centenas de arquivos.
Passo "Tirando a marca de arquivo baixado da internet"
try {
  Unblock-File -Path $Zip -ErrorAction Stop
  Ok "zip desbloqueado"
} catch {
  Aviso "nao consegui desbloquear: $($_.Exception.Message)"
}

Passo "Descompactando o orquestrador em $appDir"
if (Test-Path $appDir) {
  Remove-Item -Recurse -Force $appDir
  Aviso "instalação anterior removida"
}
Expand-Archive -Path $Zip -DestinationPath $appDir -Force
$exe = Join-Path $appDir 'iFlow.exe'
if (-not (Test-Path $exe)) { throw "O zip não tem 'iFlow.exe' na raiz. Zip errado?" }
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

Passo "Copiando o projeto de exemplo para a pasta de trabalho"
$exemplo = Join-Path $appDir 'projeto-exemplo'
if (Test-Path $exemplo) {
  Copy-Item -Recurse -Force (Join-Path $exemplo '*') $workspaceDir
  Ok "projeto de exemplo em $workspaceDir"
} else {
  Aviso "projeto-exemplo nao veio no zip; copie a pasta minicurso\projeto-exemplo na mao"
}

Passo "Apontando o orquestrador para a pasta de trabalho do aluno"
# Terminais novos nascem no workspace, e o observador de documentos vigia ele.
# setx grava no perfil do usuário: vale para toda sessão futura, não para esta.
setx AGENT_ORCHESTRATOR_TERMINAL_CWD $workspaceDir | Out-Null
setx AGENT_ORCHESTRATOR_WATCH_DIR    $workspaceDir | Out-Null
Ok "AGENT_ORCHESTRATOR_TERMINAL_CWD e _WATCH_DIR = $workspaceDir"

Passo "Criando atalho na área de trabalho"
$lnk = Join-Path ([Environment]::GetFolderPath('Desktop')) 'iFlow.lnk'
$shell = New-Object -ComObject WScript.Shell
$atalho = $shell.CreateShortcut($lnk)
$atalho.TargetPath       = $exe
$atalho.WorkingDirectory = $workspaceDir
$atalho.Description      = 'iFlow - orquestrador de agentes de IA'
$atalho.Save()
Ok $lnk

Write-Host @"

------------------------------------------------------------
Máquina pronta. Falta o que só dá para fazer na mão:

  1. Abra um terminal NOVO (o PATH e as variáveis só valem em sessão nova).
  2. Rode, DENTRO de $workspaceDir, cada CLI que a turma vai usar:
       agy        (assistente de primeiro uso + login com conta Google)
       claude     (se for usar o Claude Code: confiar na pasta + login)
     Isso NAO pode ser automatizado, e e obrigatorio: enquanto esse pedido
     esta na tela, o agente nao le o prompt inicial, nao termina turno e o
     pipeline nao roteia nada.
  3. Dentro do agy, rode  /usage  e ANOTE o limite que aparecer.
     O Google não publica a cota do plano gratuito, e ela é semanal.
     É esse número que diz quantos turnos de agente a turma aguenta.
  4. Feche o agy e abra o atalho iFlow na área de trabalho.
  5. Crie um terminal escolhendo a IA "Antigravity CLI (grátis)" e veja se a
     skill chega como primeiro prompt.

No primeiro clique o Windows SmartScreen vai avisar que o app é de autor
desconhecido (o executável não é assinado): "Mais informações" > "Executar
assim mesmo".
------------------------------------------------------------
"@ -ForegroundColor White
