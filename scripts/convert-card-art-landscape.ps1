param(
  [int]$Width = 824,
  [int]$Height = 500
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$generatedDir = Join-Path $root 'public/assets/cards/generated'
$backupDir = Join-Path $root 'public/assets/cards/generated-originals'

if (!(Test-Path $backupDir)) {
  New-Item -ItemType Directory -Path $backupDir | Out-Null
}

function Draw-CoverImage {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Image]$Image,
    [int]$CanvasWidth,
    [int]$CanvasHeight
  )

  $scale = [Math]::Max($CanvasWidth / $Image.Width, $CanvasHeight / $Image.Height)
  $drawWidth = [int][Math]::Ceiling($Image.Width * $scale)
  $drawHeight = [int][Math]::Ceiling($Image.Height * $scale)
  $x = [int](($CanvasWidth - $drawWidth) / 2)
  $y = [int](($CanvasHeight - $drawHeight) / 2)
  $Graphics.DrawImage($Image, $x, $y, $drawWidth, $drawHeight)
}

function Draw-FocalCoverImage {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Image]$Image,
    [int]$CanvasWidth,
    [int]$CanvasHeight
  )

  $scale = [Math]::Max($CanvasWidth / $Image.Width, $CanvasHeight / $Image.Height)
  $sourceWidth = [int][Math]::Round($CanvasWidth / $scale)
  $sourceHeight = [int][Math]::Round($CanvasHeight / $scale)
  $sourceX = [int][Math]::Max(0, ($Image.Width - $sourceWidth) / 2)
  $sourceY = [int][Math]::Max(0, ($Image.Height - $sourceHeight) * 0.18)
  $sourceWidth = [Math]::Min($sourceWidth, $Image.Width - $sourceX)
  $sourceHeight = [Math]::Min($sourceHeight, $Image.Height - $sourceY)
  $sourceRect = New-Object System.Drawing.Rectangle($sourceX, $sourceY, $sourceWidth, $sourceHeight)
  $destRect = New-Object System.Drawing.Rectangle(0, 0, $CanvasWidth, $CanvasHeight)
  $Graphics.DrawImage($Image, $destRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
}

function Save-Png {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path
  )

  $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/png' } |
    Select-Object -First 1
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality,
    92L
  )
  $Bitmap.Save($Path, $encoder, $params)
}

$converted = 0

foreach ($file in Get-ChildItem -LiteralPath $generatedDir -Filter '*.png' | Sort-Object Name) {
  $fileName = $file.Name
  $path = $file.FullName
  $backupPath = Join-Path $backupDir $fileName

  if (!(Test-Path $backupPath)) {
    Copy-Item -LiteralPath $path -Destination $backupPath
  }

  $source = [System.Drawing.Image]::FromFile($backupPath)
  try {
    $canvas = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    try {
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

      Draw-FocalCoverImage -Graphics $graphics -Image $source -CanvasWidth $Width -CanvasHeight $Height

      Save-Png -Bitmap $canvas -Path $path
      $converted++
    } finally {
      $graphics.Dispose()
      $canvas.Dispose()
    }
  } finally {
    $source.Dispose()
  }
}

Write-Output "Converted $converted card illustrations to ${Width}x${Height}."
