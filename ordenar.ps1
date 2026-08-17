<#
═══════════════════════════════════════════════════════════════
  LABORATORIO ANIMADO · ordenar.ps1

  Coge los archivos sueltos de esta carpeta y construye el sitio
  ordenado en .\sitio\, listo para subir a GitHub.

  No borra ni mueve nada: copia. Si algo sale mal, tus archivos
  originales siguen intactos.

  NOTA: desde agosto de 2026 el sitio se entrega ya montado, con las
  animaciones dentro de \animaciones\ y las rutas corregidas. Este
  script solo hace falta si partes de archivos sueltos.

  Uso:  clic derecho → «Ejecutar con PowerShell»
        o bien:       .\ordenar.ps1
        comprobar sin escribir nada:  .\ordenar.ps1 -Revisar
═══════════════════════════════════════════════════════════════
#>

[CmdletBinding()]
param(
  [switch]$Revisar,                 # solo informa, no escribe
  [string]$Destino = 'sitio'
)

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

# Archivos que pertenecen al shell, no a ninguna animación
$COMUNES = @('shell.js', 'lab.css', 'catalogo.js', 'index.html', 'ordenar.ps1', 'MANUAL.md')

$avisos = New-Object System.Collections.Generic.List[string]
$errores = New-Object System.Collections.Generic.List[string]

function Escribir($texto, $color = 'Gray') { Write-Host $texto -ForegroundColor $color }
function Titulo($texto) {
  Write-Host ''
  Write-Host "  $texto" -ForegroundColor Cyan
  Write-Host ('  ' + ('─' * $texto.Length)) -ForegroundColor DarkGray
}

Titulo 'Laboratorio Animado · ordenar'

# ── 1 · Comprobar que están los archivos del shell ────────────
Titulo '1 · Archivos comunes'
foreach ($c in @('shell.js', 'lab.css', 'catalogo.js', 'index.html')) {
  if (Test-Path $c) { Escribir "    ok   $c" 'Green' }
  else { $errores.Add("Falta $c, sin el no funciona nada."); Escribir "    NO   $c" 'Red' }
}
if ($errores.Count -gt 0) {
  Write-Host ''
  foreach ($e in $errores) { Escribir "  $e" 'Red' }
  Write-Host ''
  Read-Host '  Pulsa Intro para salir'
  exit 1
}

# ── 2 · Descubrir animaciones ─────────────────────────────────
Titulo '2 · Animaciones encontradas'
$animaciones = @()
Get-ChildItem -Filter '*.html' -File | ForEach-Object {
  if ($COMUNES -contains $_.Name) { return }
  $id = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
  $js = "$id.js"
  if (-not (Test-Path $js)) {
    $avisos.Add("$($_.Name) no tiene su $js al lado. Se salta.")
    Escribir "    ??   $id  (sin $js)" 'Yellow'
    return
  }
  $portada = if (Test-Path "$id-portada.jpg") { "$id-portada.jpg" } else { $null }
  if (-not $portada) { $avisos.Add("$id no tiene portada. Genérala con el boton «Portada 16:9».") }

  $animaciones += [pscustomobject]@{
    Id = $id; Html = $_.Name; Js = $js; Portada = $portada
  }
  $marca = if ($portada) { 'con portada' } else { 'sin portada' }
  Escribir "    ok   $id  ($marca)" 'Green'
}

if ($animaciones.Count -eq 0) {
  Escribir '    No hay ninguna animación en esta carpeta.' 'Yellow'
  Write-Host ''
  Read-Host '  Pulsa Intro para salir'
  exit 0
}

# ── 3 · Contrastar con el catálogo ────────────────────────────
Titulo '3 · Catálogo'
$catalogo = Get-Content 'catalogo.js' -Raw -Encoding UTF8
$enCatalogo = [regex]::Matches($catalogo, "id\s*:\s*'([^']+)'") |
              ForEach-Object { $_.Groups[1].Value }

foreach ($a in $animaciones) {
  if ($enCatalogo -contains $a.Id) { Escribir "    ok   $($a.Id) esta listada" 'Green' }
  else {
    $avisos.Add("$($a.Id) no aparece en catalogo.js: no saldra en la galeria.")
    Escribir "    ??   $($a.Id) NO esta en catalogo.js" 'Yellow'
  }
}
foreach ($id in $enCatalogo) {
  if (-not ($animaciones.Id -contains $id)) {
    $avisos.Add("catalogo.js menciona '$id' pero no hay archivos suyos aqui.")
    Escribir "    ??   catalogo.js cita '$id' y no esta" 'Yellow'
  }
}

# ── 4 · Archivos que NO forman parte del sitio ────────────────
Titulo '4 · Archivos que se quedan fuera'
$sueltos = Get-ChildItem -File | Where-Object {
  $_.Extension -in '.srt', '.png', '.mp4', '.webm', '.txt' -or
  ($_.Extension -eq '.jpg' -and $_.Name -notlike '*-portada.jpg')
}
if ($sueltos) {
  foreach ($s in $sueltos) { Escribir "    --   $($s.Name)" 'DarkGray' }
  Escribir '    Subtitulos, capturas y videos no van al repositorio.' 'DarkGray'
  Escribir '    Los .srt se suben a YouTube; los videos, a cada plataforma.' 'DarkGray'
} else {
  Escribir '    Ninguno.' 'DarkGray'
}

if ($Revisar) {
  Titulo 'Revision terminada'
  if ($avisos.Count -eq 0) { Escribir '    Todo en orden.' 'Green' }
  else { foreach ($v in $avisos) { Escribir "    · $v" 'Yellow' } }
  Write-Host ''
  Read-Host '  Pulsa Intro para salir'
  exit 0
}

# ── 5 · Construir el sitio ────────────────────────────────────
Titulo "5 · Construyendo .\$Destino"
if (Test-Path $Destino) { Remove-Item $Destino -Recurse -Force }
New-Item -ItemType Directory -Path $Destino | Out-Null
New-Item -ItemType Directory -Path "$Destino\animaciones" | Out-Null

Copy-Item 'shell.js', 'lab.css', 'index.html' -Destination $Destino
if (Test-Path 'MANUAL.md') { Copy-Item 'MANUAL.md' -Destination $Destino }

# catalogo.js con la estructura cambiada a carpetas
($catalogo -replace "LAB_RUTA_ANIM\s*=\s*'[^']*'", "LAB_RUTA_ANIM = 'animaciones/'") |
  Set-Content "$Destino\catalogo.js" -Encoding UTF8 -NoNewline
Escribir '    ok   catalogo.js  (ruta: animaciones/)' 'Green'

foreach ($a in $animaciones) {
  $dir = "$Destino\animaciones"

  # El html pasa a ser index.html y sube dos niveles para el shell
  $html = Get-Content $a.Html -Raw -Encoding UTF8
  $html = $html -replace '(?<=href=")lab\.css(?=")', '../lab.css'
  $html = $html -replace '(?<=src=")shell\.js(?=")', '../shell.js'
  $html = $html -replace '(?<=src=")catalogo\.js(?=")', '../catalogo.js'
  Set-Content "$dir\$($a.Html)" $html -Encoding UTF8 -NoNewline

  Copy-Item $a.Js -Destination $dir
  if ($a.Portada) { Copy-Item $a.Portada -Destination $dir }

  # Comprobar que de verdad esta todo donde toca
  $faltan = @()
  foreach ($f in @($a.Html, $a.Js)) {
    if (-not (Test-Path "$dir\$f")) { $faltan += $f }
  }
  if ($a.Portada -and -not (Test-Path "$dir\$($a.Portada)")) { $faltan += $a.Portada }

  $copiado = Get-Content "$dir\$($a.Html)" -Raw -Encoding UTF8
  if ($copiado -notmatch '\.\./lab\.css') { $faltan += 'ruta de lab.css sin corregir' }
  if ($copiado -notmatch '\.\./shell\.js') { $faltan += 'ruta de shell.js sin corregir' }
  if ($copiado -match 'src="catalogo\.js"') { $faltan += 'ruta de catalogo.js sin corregir' }

  if ($faltan.Count -gt 0) {
    $errores.Add("$($a.Id): $($faltan -join ', ')")
    Escribir "    NO   animaciones\$($a.Id)\  ->  $($faltan -join ', ')" 'Red'
  } else {
    Escribir "    ok   animaciones\$($a.Id)\  (verificado)" 'Green'
  }
}

# ── 6 · Resumen ───────────────────────────────────────────────
Titulo 'Listo'
if ($errores.Count -gt 0) {
  Escribir '    La copia NO se completo bien:' 'Red'
  foreach ($e in $errores) { Escribir "    · $e" 'Red' }
} else {
  Escribir "    $($animaciones.Count) animacion(es) en .\$Destino · todo verificado" 'Green'
  Escribir '    Sube el contenido de esa carpeta a GitHub.' 'Gray'
}

if ($avisos.Count -gt 0) {
  Titulo 'Cosas que revisar'
  foreach ($v in $avisos) { Escribir "    · $v" 'Yellow' }
}

Write-Host ''
Read-Host '  Pulsa Intro para salir'
