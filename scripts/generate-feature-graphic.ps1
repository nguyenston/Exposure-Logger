$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $root "assets\feature-graphic-1024x500.png"

function Set-GraphicsQuality {
  param([System.Drawing.Graphics]$Graphics)

  $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $Graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
}

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $diameter = $Radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-FilmRollSide {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [System.Drawing.Brush]$RollBodyBrush,
    [System.Drawing.Brush]$RollLabelBrush,
    [System.Drawing.Brush]$ShadowBrush,
    [System.Drawing.Brush]$RimHighlightBrush,
    [System.Drawing.Brush]$LeaderBrush,
    [System.Drawing.Brush]$HoleBrush,
    [System.Drawing.Brush]$TextBrush,
    [System.Drawing.StringFormat]$TextFormat,
    [System.Drawing.Font]$LargeFont,
    [bool]$ShowText,
    [bool]$ShowLeader
  )

  if ($ShowLeader) {
    $leaderTop = $Y + 18
    $leaderHeight = [Math]::Round($Height * 0.4)
    $leaderX = $X + $Width
    $leaderWidth = 28
    $leaderRadius = 8
    $leaderRight = $leaderX + $leaderWidth
    $leaderBottom = $leaderTop + $leaderHeight
    $leaderPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $leaderPath.AddLine($leaderX, $leaderTop, ($leaderRight - $leaderRadius), $leaderTop)
    $leaderPath.AddArc(($leaderRight - ($leaderRadius * 2)), $leaderTop, ($leaderRadius * 2), ($leaderRadius * 2), 270, 90)
    $leaderPath.AddLine($leaderRight, ($leaderTop + $leaderRadius), $leaderRight, ($leaderBottom - $leaderRadius))
    $leaderPath.AddArc(($leaderRight - ($leaderRadius * 2)), ($leaderBottom - ($leaderRadius * 2)), ($leaderRadius * 2), ($leaderRadius * 2), 0, 90)
    $leaderPath.AddLine(($leaderRight - $leaderRadius), $leaderBottom, $leaderX, $leaderBottom)
    $leaderPath.CloseFigure()
    $Graphics.FillPath($LeaderBrush, $leaderPath)

    if ($null -ne $HoleBrush) {
      for ($i = 0; $i -lt 4; $i++) {
        $holeX = $leaderX - 6 + ($i * 9)
        $Graphics.FillRectangle($HoleBrush, $holeX, ($leaderTop + 5), 5, 7)
      }
    }

    $leaderPath.Dispose()
  }

  $nubPath = New-RoundedRectPath ($X + ($Width * 0.32)) ($Y - 16) ($Width * 0.36) 34 12
  $Graphics.FillPath($RollBodyBrush, $nubPath)

  $shadowPath = New-RoundedRectPath ($X + 4) ($Y + 6) $Width $Height ([Math]::Round($Width * 0.18))
  $Graphics.FillPath($ShadowBrush, $shadowPath)

  $bodyPath = New-RoundedRectPath $X $Y $Width $Height ([Math]::Round($Width * 0.18))
  $Graphics.FillPath($RollBodyBrush, $bodyPath)

  $labelPath = New-RoundedRectPath ($X + 8) ($Y + 24) ($Width - 16) ($Height - 48) 16
  $Graphics.FillPath($RollLabelBrush, $labelPath)

  $topRim = New-RoundedRectPath ($X + 2) ($Y + 12) ($Width - 4) 18 10
  $bottomRim = New-RoundedRectPath ($X + 2) ($Y + $Height - 30) ($Width - 4) 18 10
  $Graphics.FillPath($RimHighlightBrush, $topRim)
  $Graphics.FillPath($RimHighlightBrush, $bottomRim)

  $stripeRect = [System.Drawing.RectangleF]::new(($X + $Width - 24), ($Y + 34), 12, ($Height - 68))
  $Graphics.FillRectangle($RollBodyBrush, $stripeRect)

  $leftMarkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x17, 0x13, 0x11))
  $Graphics.FillRectangle($leftMarkBrush, $X + 18, $Y + 42, 8, $Height - 84)
  $Graphics.FillRectangle($leftMarkBrush, $X + 32, $Y + 42, 4, $Height - 84)
  $leftMarkBrush.Dispose()

  if ($ShowText) {
    $state = $Graphics.Save()
    $Graphics.TranslateTransform(($X + ($Width * 0.52)), ($Y + ($Height * 0.46)))
    $Graphics.RotateTransform(90)
    $textRect = [System.Drawing.RectangleF]::new(-56, -40, 112, 80)
    $Graphics.DrawString("400", $LargeFont, $TextBrush, $textRect, $TextFormat)
    $Graphics.Restore($state)
  }

  $nubPath.Dispose()
  $shadowPath.Dispose()
  $bodyPath.Dispose()
  $labelPath.Dispose()
  $topRim.Dispose()
  $bottomRim.Dispose()
}

$width = 1024
$height = 500
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
Set-GraphicsQuality $graphics

$cream = [System.Drawing.Color]::FromArgb(0xF4, 0xEE, 0xE2)
$graphics.Clear($cream)

$goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0xE8, 0xA8, 0x1B))
$goldSoftBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0xCF, 0x92, 0x20))
$brownBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x5B, 0x40, 0x2F))
$brownSoftBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x8F, 0x58, 0x37))
$inkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x17, 0x13, 0x11))
$shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(24, 24, 18, 12))
$rollBodyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x22, 0x1B, 0x18))
$sideRollBodyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x18, 0x13, 0x11))
$rimHighlightBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x37, 0x2C, 0x26))
$holeBrush = New-Object System.Drawing.SolidBrush($cream)

$bgCircleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0xE9, 0xE0, 0xD2))
$graphics.FillEllipse($bgCircleBrush, 515, -20, 420, 420)
$graphics.FillEllipse($goldSoftBrush, 745, 260, 180, 180)

$shelfShadow = New-RoundedRectPath 520 344 360 44 18
$graphics.FillPath($shadowBrush, $shelfShadow)
$shelfTop = New-RoundedRectPath 510 334 380 30 14
$graphics.FillPath($brownBrush, $shelfTop)
$shelfFront = New-RoundedRectPath 526 358 348 34 12
$graphics.FillPath($brownSoftBrush, $shelfFront)

$textFormat = New-Object System.Drawing.StringFormat
$textFormat.Alignment = [System.Drawing.StringAlignment]::Center
$textFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
$textFormat.FormatFlags = [System.Drawing.StringFormatFlags]::NoWrap
$rollFont = New-Object System.Drawing.Font("Arial", 54, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

Draw-FilmRollSide -Graphics $graphics -X 548 -Y 136 -Width 128 -Height 212 -RollBodyBrush $sideRollBodyBrush -RollLabelBrush $goldSoftBrush -ShadowBrush $shadowBrush -RimHighlightBrush $rimHighlightBrush -LeaderBrush $brownSoftBrush -HoleBrush $null -TextBrush $inkBrush -TextFormat $textFormat -LargeFont $rollFont -ShowText $false -ShowLeader $false
Draw-FilmRollSide -Graphics $graphics -X 744 -Y 136 -Width 128 -Height 212 -RollBodyBrush $sideRollBodyBrush -RollLabelBrush $goldSoftBrush -ShadowBrush $shadowBrush -RimHighlightBrush $rimHighlightBrush -LeaderBrush $brownSoftBrush -HoleBrush $holeBrush -TextBrush $inkBrush -TextFormat $textFormat -LargeFont $rollFont -ShowText $false -ShowLeader $true
Draw-FilmRollSide -Graphics $graphics -X 636 -Y 104 -Width 152 -Height 244 -RollBodyBrush $rollBodyBrush -RollLabelBrush $goldBrush -ShadowBrush $shadowBrush -RimHighlightBrush $rimHighlightBrush -LeaderBrush $brownSoftBrush -HoleBrush $null -TextBrush $inkBrush -TextFormat $textFormat -LargeFont $rollFont -ShowText $true -ShowLeader $false

$titleFont = New-Object System.Drawing.Font("Georgia", 62, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$bodyFont = New-Object System.Drawing.Font("Segoe UI", 21, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$leftFormat = New-Object System.Drawing.StringFormat
$leftFormat.Alignment = [System.Drawing.StringAlignment]::Near
$leftFormat.LineAlignment = [System.Drawing.StringAlignment]::Near

$graphics.DrawString("Exposure`nLogger", $titleFont, $inkBrush, [System.Drawing.RectangleF]::new(86, 110, 420, 152), $leftFormat)
$graphics.DrawString("Your companion for film roll management and exposure logging", $bodyFont, $inkBrush, [System.Drawing.RectangleF]::new(90, 260, 420, 60), $leftFormat)

[System.IO.Directory]::CreateDirectory((Split-Path $outputPath -Parent)) | Out-Null
$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$goldBrush.Dispose()
$goldSoftBrush.Dispose()
$brownBrush.Dispose()
$brownSoftBrush.Dispose()
$inkBrush.Dispose()
$shadowBrush.Dispose()
$rollBodyBrush.Dispose()
$sideRollBodyBrush.Dispose()
$rimHighlightBrush.Dispose()
$holeBrush.Dispose()
$bgCircleBrush.Dispose()
$shelfShadow.Dispose()
$shelfTop.Dispose()
$shelfFront.Dispose()
$titleFont.Dispose()
$bodyFont.Dispose()
$textFormat.Dispose()
$rollFont.Dispose()
$leftFormat.Dispose()
$graphics.Dispose()
$bitmap.Dispose()

Write-Output "Wrote $outputPath"
