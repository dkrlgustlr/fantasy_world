param(
  [int]$Width = 590,
  [int]$Height = 860
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$cardsPath = Join-Path $root 'data/cards.json'
$artDir = Join-Path $root 'public/assets/cards/generated'
$frameDir = Join-Path $root 'public/assets/ui/cards'
$outDir = Join-Path $root 'public/assets/cards/full'

if (!(Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

$json = [System.IO.File]::ReadAllText($cardsPath, [System.Text.Encoding]::UTF8)
$cards = $json | ConvertFrom-Json

$frameById = @{}
foreach ($id in @('mountain', 'cavern', 'bell_tower', 'forest', 'earth_elemental')) { $frameById[$id] = 'land' }
foreach ($id in @('fountain_of_life', 'swamp', 'flood', 'island', 'water_elemental')) { $frameById[$id] = 'water' }
foreach ($id in @('rainstorm', 'blizzard', 'smoke', 'whirlwind', 'air_elemental')) { $frameById[$id] = 'weather' }
foreach ($id in @('wildfire', 'candle', 'forge', 'lightning', 'fire_elemental')) { $frameById[$id] = 'fire' }
foreach ($id in @('rangers', 'elven_archers', 'light_cavalry', 'dwarvish_infantry', 'knights')) { $frameById[$id] = 'army' }
foreach ($id in @('collector', 'beastmaster', 'necromancer', 'warlock', 'enchantress')) { $frameById[$id] = 'wizard' }
foreach ($id in @('king', 'queen', 'princess', 'warlord', 'empress')) { $frameById[$id] = 'leader' }
foreach ($id in @('unicorn', 'basilisk', 'warhorse', 'dragon', 'hydra')) { $frameById[$id] = 'beast' }
foreach ($id in @('warship', 'magic_wand', 'sword_of_keth', 'elven_longbow', 'airship')) { $frameById[$id] = 'weapon' }
foreach ($id in @('shield_of_keth', 'gem_of_order', 'world_tree', 'book_of_changes', 'protection_rune')) { $frameById[$id] = 'artifact' }
foreach ($id in @('mirage', 'shapeshifter', 'doppelganger')) { $frameById[$id] = 'wild' }

$discardLabel = -join ([char[]](0xBC84, 0xB9AC, 0xAE30))
$detailLabel = -join ([char[]](0xC790, 0xC138, 0xD788))
$bonusLabel = -join ([char[]](0xBCF4, 0xB108, 0xC2A4))
$penaltyLabel = -join ([char[]](0xD328, 0xB110, 0xD2F0))
$oldPenaltyLabel = -join ([char[]](0xD398, 0xB110, 0xD2F0))
$invalidLabel = -join ([char[]](0xBB34, 0xD6A8))

$cardFontFamily = 'Gungsuh'
$fallbackFontFamily = 'Malgun Gothic'

$landTerm = -join ([char[]](0xB545))
$waterTerm = -join ([char[]](0xBB3C))
$weatherTerm = -join ([char[]](0xB0A0, 0xC528))
$fireTerm = -join ([char[]](0xBD88))
$armyTerm = -join ([char[]](0xAD70, 0xB300))
$wizardTerm = -join ([char[]](0xB9C8, 0xBC95, 0xC0AC))
$leaderTerm = -join ([char[]](0xC9C0, 0xB3C4, 0xC790))
$beastTerm = -join ([char[]](0xC57C, 0xC218))
$weaponTerm = -join ([char[]](0xBB34, 0xAE30))
$artifactTerm = -join ([char[]](0xC720, 0xBB3C))
$copyTerm = -join ([char[]](0xBCF5, 0xC0AC))

$termColors = [ordered]@{
  $landTerm = '#8a5a2b'
  $waterTerm = '#1170b8'
  $weatherTerm = '#4d607a'
  $fireTerm = '#bd3b20'
  $armyTerm = '#59616c'
  $wizardTerm = '#a32074'
  $leaderTerm = '#6b3fc0'
  $beastTerm = '#277b4b'
  $weaponTerm = '#2f4055'
  $artifactTerm = '#b86b00'
  $bonusLabel = '#0f7a38'
  $penaltyLabel = '#b9322a'
  $invalidLabel = '#b9322a'
}

function New-Rect {
  param([int]$X, [int]$Y, [int]$W, [int]$H)
  return New-Object System.Drawing.RectangleF($X, $Y, $W, $H)
}

function New-Brush {
  param([string]$Color)
  return New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($Color))
}

function New-CardFont {
  param(
    [float]$Size,
    [System.Drawing.FontStyle]$Style = [System.Drawing.FontStyle]::Regular
  )
  $font = New-Object System.Drawing.Font($cardFontFamily, $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
  if ($font.FontFamily.Name -ne $cardFontFamily) {
    $font.Dispose()
    $font = New-Object System.Drawing.Font($fallbackFontFamily, $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
  }
  return $font
}

function Draw-ImageCover {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Image]$Image,
    [System.Drawing.RectangleF]$Rect
  )

  $scale = [Math]::Max($Rect.Width / $Image.Width, $Rect.Height / $Image.Height)
  $sourceWidth = [int][Math]::Round($Rect.Width / $scale)
  $sourceHeight = [int][Math]::Round($Rect.Height / $scale)
  $sourceX = [int][Math]::Max(0, ($Image.Width - $sourceWidth) / 2)
  $sourceY = [int][Math]::Max(0, ($Image.Height - $sourceHeight) * 0.18)
  $sourceWidth = [Math]::Min($sourceWidth, $Image.Width - $sourceX)
  $sourceHeight = [Math]::Min($sourceHeight, $Image.Height - $sourceY)
  $sourceRect = New-Object System.Drawing.Rectangle($sourceX, $sourceY, $sourceWidth, $sourceHeight)
  $destRect = New-Object System.Drawing.Rectangle([int]$Rect.X, [int]$Rect.Y, [int]$Rect.Width, [int]$Rect.Height)
  $Graphics.DrawImage($Image, $destRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
}

function New-RoundedRectPath {
  param(
    [System.Drawing.RectangleF]$Rect,
    [float]$Radius
  )

  $diameter = $Radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($Rect.X, $Rect.Y, $diameter, $diameter, 180, 90)
  $path.AddArc(($Rect.Right - $diameter), $Rect.Y, $diameter, $diameter, 270, 90)
  $path.AddArc(($Rect.Right - $diameter), ($Rect.Bottom - $diameter), $diameter, $diameter, 0, 90)
  $path.AddArc($Rect.X, ($Rect.Bottom - $diameter), $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-ExpandedRuleBox {
  param(
    [System.Drawing.Graphics]$Graphics
  )

  $rect = New-Rect 52 548 486 286
  $path = New-RoundedRectPath -Rect $rect -Radius 10
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.ColorTranslator]::FromHtml('#f0dcc0'),
    [System.Drawing.ColorTranslator]::FromHtml('#d6ba91'),
    [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
  )
  $borderPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#2f2118'), 6)
  $innerPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#8b6a43'), 3)
  $highlightPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 255, 246, 218), 2)

  try {
    $Graphics.FillPath($brush, $path)
    $Graphics.DrawPath($borderPen, $path)
    $innerRect = New-Rect 63 559 464 264
    $Graphics.DrawRectangle($innerPen, $innerRect.X, $innerRect.Y, $innerRect.Width, $innerRect.Height)
    $Graphics.DrawLine($highlightPen, 72, 571, 518, 571)
  } finally {
    $highlightPen.Dispose()
    $innerPen.Dispose()
    $borderPen.Dispose()
    $brush.Dispose()
    $path.Dispose()
  }
}

function Draw-TextCenter {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [System.Drawing.Font]$Font,
    [System.Drawing.RectangleF]$Rect,
    [System.Drawing.Brush]$Brush,
    [System.Drawing.Brush]$ShadowBrush = $null,
    [int]$ShadowOffset = 2
  )

  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $format.Trimming = [System.Drawing.StringTrimming]::EllipsisCharacter
  $format.FormatFlags = [System.Drawing.StringFormatFlags]::NoWrap

  if ($ShadowBrush -ne $null) {
    $shadowRect = New-Object System.Drawing.RectangleF(
      ($Rect.X + $ShadowOffset),
      ($Rect.Y + $ShadowOffset),
      $Rect.Width,
      $Rect.Height
    )
    $Graphics.DrawString($Text, $Font, $ShadowBrush, $shadowRect, $format)
  }
  $Graphics.DrawString($Text, $Font, $Brush, $Rect, $format)
  $format.Dispose()
}

function Draw-WrappedText {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [System.Drawing.RectangleF]$Rect,
    [string]$Color = '#1f1712'
  )

  $fontSize = 25
  $font = $null
  $brush = New-Brush $Color
  try {
    while ($fontSize -ge 15) {
      if ($font -ne $null) { $font.Dispose() }
      $font = New-CardFont $fontSize ([System.Drawing.FontStyle]::Bold)
      $lines = @(Get-WrappedLines -Graphics $Graphics -Text $Text -Font $font -MaxWidth $Rect.Width)
      $lineHeight = [int][Math]::Ceiling($font.GetHeight($Graphics) * 1.02)
      if (($lines.Count * $lineHeight) -le $Rect.Height) {
        break
      }
      $fontSize -= 1
    }

    $lines = @(Get-WrappedLines -Graphics $Graphics -Text $Text -Font $font -MaxWidth $Rect.Width)
    $lineHeight = [int][Math]::Ceiling($font.GetHeight($Graphics) * 1.02)
    $maxLines = [int][Math]::Floor($Rect.Height / $lineHeight)
    $drawLines = @($lines | Select-Object -First $maxLines)
    if ($lines.Count -gt $maxLines -and $drawLines.Count -gt 0) {
      $drawLines[$drawLines.Count - 1] = ($drawLines[$drawLines.Count - 1].TrimEnd('.') + '...')
    }

    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Near
    $format.Trimming = [System.Drawing.StringTrimming]::EllipsisCharacter

    $totalHeight = $drawLines.Count * $lineHeight
    $y = $Rect.Y + [Math]::Max(0, ($Rect.Height - $totalHeight) / 2)
    foreach ($line in $drawLines) {
      $lineRect = New-Object System.Drawing.RectangleF($Rect.X, $y, $Rect.Width, $lineHeight)
      $Graphics.DrawString($line, $font, $brush, $lineRect, $format)
      $y += $lineHeight
    }
    $format.Dispose()
  } finally {
    if ($font -ne $null) { $font.Dispose() }
    $brush.Dispose()
  }
}

function Trim-RulePrefixSeparator {
  param([string]$Text)

  $result = $Text.Trim()
  while ($result.StartsWith(':') -or $result.StartsWith('.') -or $result.StartsWith(' ')) {
    $result = $result.Substring(1).Trim()
  }
  return $result
}

function Normalize-RuleText {
  param([string]$Text)

  $textValue = $Text.Replace($oldPenaltyLabel, $penaltyLabel).Trim()
  $sentences = @($textValue -split '\.')
  $normalized = New-Object System.Collections.Generic.List[string]
  $pendingPrefix = $null

  foreach ($rawSentence in $sentences) {
    $sentence = $rawSentence.Trim()
    if ([string]::IsNullOrWhiteSpace($sentence)) { continue }

    if ($sentence -eq $bonusLabel -or $sentence -eq $penaltyLabel) {
      $pendingPrefix = $sentence
      continue
    }

    $prefix = $null
    if ($pendingPrefix -ne $null) {
      $prefix = $pendingPrefix
      $pendingPrefix = $null
    } elseif ($sentence.StartsWith($bonusLabel)) {
      $prefix = $bonusLabel
      $sentence = Trim-RulePrefixSeparator $sentence.Substring($bonusLabel.Length)
    } elseif ($sentence.StartsWith($penaltyLabel)) {
      $prefix = $penaltyLabel
      $sentence = Trim-RulePrefixSeparator $sentence.Substring($penaltyLabel.Length)
    } elseif (($sentence -match '[+][0-9]') -and !$sentence.Contains($copyTerm)) {
      $prefix = $bonusLabel
    } elseif (($sentence -match '-[0-9]') -or $sentence.Contains($invalidLabel)) {
      $prefix = $penaltyLabel
    }

    if ($prefix -ne $null) {
      $sentence = $prefix + ': ' + $sentence
    }
    $normalized.Add($sentence)
  }

  if ($normalized.Count -eq 0) { return $textValue }
  return ([string]::Join('. ', $normalized.ToArray()) + '.')
}

function Get-RuleTextColor {
  param([string]$Text)

  if ($Text -match '[+][0-9]') { return '#0f7a38' }
  if ($Text -match '-[0-9]') { return '#b9322a' }
  foreach ($term in $termColors.Keys) {
    if ($Text.Contains($term)) {
      return $termColors[$term]
    }
  }
  return '#1f1712'
}

function New-TextRun {
  param(
    [string]$Text,
    [string]$Color
  )

  return [pscustomobject]@{
    Text = $Text
    Color = $Color
  }
}

function Add-RichLine {
  param(
    [System.Collections.Generic.List[object]]$Lines,
    [System.Collections.Generic.List[object]]$Runs,
    [float]$Width
  )

  if ($Runs.Count -eq 0) { return }
  $Lines.Add([pscustomobject]@{
    Runs = @($Runs.ToArray())
    Width = $Width
  })
}

function Get-RichWrappedLines {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [System.Drawing.Font]$Font,
    [float]$MaxWidth
  )

  $matches = [regex]::Matches(($Text -replace '\s+', ' '), '\S+\s*')
  $lines = New-Object System.Collections.Generic.List[object]
  $currentRuns = New-Object System.Collections.Generic.List[object]
  [float]$currentWidth = 0

  foreach ($match in $matches) {
    $token = [string]$match.Value
    $color = Get-RuleTextColor $token
    [float]$tokenWidth = $Graphics.MeasureString($token, $Font).Width

    if ($currentRuns.Count -gt 0 -and ($currentWidth + $tokenWidth) -gt $MaxWidth) {
      Add-RichLine -Lines $lines -Runs $currentRuns -Width $currentWidth
      $currentRuns = New-Object System.Collections.Generic.List[object]
      [float]$currentWidth = 0
    }

    if ($tokenWidth -le $MaxWidth) {
      $currentRuns.Add((New-TextRun -Text $token -Color $color))
      $currentWidth += $tokenWidth
      continue
    }

    foreach ($ch in $token.ToCharArray()) {
      $piece = [string]$ch
      [float]$pieceWidth = $Graphics.MeasureString($piece, $Font).Width
      if ($currentRuns.Count -gt 0 -and ($currentWidth + $pieceWidth) -gt $MaxWidth) {
        Add-RichLine -Lines $lines -Runs $currentRuns -Width $currentWidth
        $currentRuns = New-Object System.Collections.Generic.List[object]
        [float]$currentWidth = 0
      }
      $currentRuns.Add((New-TextRun -Text $piece -Color $color))
      $currentWidth += $pieceWidth
    }
  }

  Add-RichLine -Lines $lines -Runs $currentRuns -Width $currentWidth
  return $lines
}

function Draw-RichWrappedText {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [System.Drawing.RectangleF]$Rect
  )

  $fontSize = 34
  $font = $null
  try {
    while ($fontSize -ge 20) {
      if ($font -ne $null) { $font.Dispose() }
      $font = New-CardFont $fontSize ([System.Drawing.FontStyle]::Bold)
      $lines = @(Get-RichWrappedLines -Graphics $Graphics -Text $Text -Font $font -MaxWidth $Rect.Width)
      $lineHeight = [int][Math]::Ceiling($font.GetHeight($Graphics) * 1.02)
      if (($lines.Count * $lineHeight) -le $Rect.Height) {
        break
      }
      $fontSize -= 1
    }

    $lines = @(Get-RichWrappedLines -Graphics $Graphics -Text $Text -Font $font -MaxWidth $Rect.Width)
    $lineHeight = [int][Math]::Ceiling($font.GetHeight($Graphics) * 1.02)
    $maxLines = [int][Math]::Max(1, [Math]::Floor($Rect.Height / $lineHeight))
    $drawLines = @($lines | Select-Object -First $maxLines)
    $totalHeight = $drawLines.Count * $lineHeight
    [float]$y = $Rect.Y + [Math]::Max(0, ($Rect.Height - $totalHeight) / 2)

    foreach ($line in $drawLines) {
      $lineRuns = @($line.Runs)
      [float]$x = $Rect.X + [Math]::Max(0, ($Rect.Width - $line.Width) / 2)
      foreach ($run in $lineRuns) {
        $brush = New-Brush $run.Color
        try {
          $Graphics.DrawString($run.Text, $font, $brush, $x, $y)
        } finally {
          $brush.Dispose()
        }
        $x += $Graphics.MeasureString($run.Text, $font).Width
      }
      $y += $lineHeight
    }
  } finally {
    if ($font -ne $null) { $font.Dispose() }
  }
}

function Get-WrappedLines {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [System.Drawing.Font]$Font,
    [float]$MaxWidth
  )

  $tokens = $Text -replace '\s+', ' ' -split ' '
  $lines = New-Object System.Collections.Generic.List[string]
  $current = ''

  foreach ($token in $tokens) {
    if ([string]::IsNullOrWhiteSpace($token)) { continue }
    $candidate = if ($current.Length -eq 0) { $token } else { "$current $token" }
    if ($Graphics.MeasureString($candidate, $Font).Width -le $MaxWidth) {
      $current = $candidate
      continue
    }

    if ($current.Length -gt 0) {
      $lines.Add($current)
    }

    if ($Graphics.MeasureString($token, $Font).Width -le $MaxWidth) {
      $current = $token
      continue
    }

    $piece = ''
    foreach ($ch in $token.ToCharArray()) {
      $candidatePiece = "$piece$ch"
      if ($Graphics.MeasureString($candidatePiece, $Font).Width -le $MaxWidth) {
        $piece = $candidatePiece
      } else {
        if ($piece.Length -gt 0) { $lines.Add($piece) }
        $piece = [string]$ch
      }
    }
    $current = $piece
  }

  if ($current.Length -gt 0) {
    $lines.Add($current)
  }
  return $lines
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
    95L
  )
  $Bitmap.Save($Path, $encoder, $params)
}

$white = New-Brush '#fff5dc'
$dark = New-Brush '#1b120c'
$shadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(190, 0, 0, 0))

try {
  foreach ($card in $cards) {
    $frameKey = if ($frameById.ContainsKey($card.id)) { $frameById[$card.id] } else { 'wild' }
    $framePath = Join-Path $frameDir "frame-$frameKey.png"
    $artPath = Join-Path $artDir "$($card.id).png"
    $outPath = Join-Path $outDir "$($card.id).png"

    if (!(Test-Path $framePath)) { throw "Missing frame: $framePath" }
    if (!(Test-Path $artPath)) { throw "Missing art: $artPath" }

    $frame = [System.Drawing.Image]::FromFile($framePath)
    $art = [System.Drawing.Image]::FromFile($artPath)
    try {
      $canvas = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
      $graphics = [System.Drawing.Graphics]::FromImage($canvas)
      try {
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

        $graphics.DrawImage($frame, 0, 0, $Width, $Height)
        Draw-ImageCover -Graphics $graphics -Image $art -Rect (New-Rect 45 130 500 300)

        $baseFont = New-CardFont 54 ([System.Drawing.FontStyle]::Bold)
        $suitFont = New-CardFont 36 ([System.Drawing.FontStyle]::Bold)
        $nameFont = New-CardFont 39 ([System.Drawing.FontStyle]::Bold)
        try {
          Draw-TextCenter -Graphics $graphics -Text ([string]$card.base) -Font $baseFont -Rect (New-Rect 62 43 112 82) -Brush $white -ShadowBrush $shadow -ShadowOffset 3
          Draw-TextCenter -Graphics $graphics -Text ([string]$card.suit) -Font $suitFont -Rect (New-Rect 388 43 150 72) -Brush $white -ShadowBrush $shadow -ShadowOffset 3
          Draw-TextCenter -Graphics $graphics -Text ([string]$card.name) -Font $nameFont -Rect (New-Rect 70 454 450 70) -Brush $white -ShadowBrush $shadow -ShadowOffset 3
          $ruleText = Normalize-RuleText ([string]$card.text)
          Draw-ExpandedRuleBox -Graphics $graphics
          Draw-RichWrappedText -Graphics $graphics -Text $ruleText -Rect (New-Rect 82 598 426 210)
        } finally {
          $baseFont.Dispose()
          $suitFont.Dispose()
          $nameFont.Dispose()
        }

        Save-Png -Bitmap $canvas -Path $outPath
      } finally {
        $graphics.Dispose()
        $canvas.Dispose()
      }
    } finally {
      $frame.Dispose()
      $art.Dispose()
    }
  }
} finally {
  $white.Dispose()
  $dark.Dispose()
  $shadow.Dispose()
}

Write-Output "Rendered $($cards.Count) full card images to $outDir."
