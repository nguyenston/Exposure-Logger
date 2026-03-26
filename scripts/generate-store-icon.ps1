$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $root "assets\store-icon-512.png"
$iconPath = Join-Path $root "assets\icon.png"
$faviconPath = Join-Path $root "assets\favicon.png"
$splashPath = Join-Path $root "assets\splash-icon.png"
$androidForegroundPath = Join-Path $root "assets\android-icon-foreground.png"
$androidBackgroundPath = Join-Path $root "assets\android-icon-background.png"
$androidMonochromePath = Join-Path $root "assets\android-icon-monochrome.png"

$sceneSize = 512
$cream = [System.Drawing.Color]::FromArgb(0xF4, 0xEE, 0xE2)

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

function Resize-Bitmap {
  param(
    [System.Drawing.Bitmap]$Source,
    [int]$Width,
    [int]$Height
  )

  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  Set-GraphicsQuality $graphics
  $graphics.DrawImage($Source, 0, 0, $Width, $Height)
  $graphics.Dispose()
  return $bitmap
}

function Place-OnTransparentCanvas {
  param(
    [System.Drawing.Bitmap]$Source,
    [int]$CanvasSize,
    [double]$Scale
  )

  $bitmap = New-Object System.Drawing.Bitmap($CanvasSize, $CanvasSize)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  Set-GraphicsQuality $graphics
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $drawSize = [int]([Math]::Round($CanvasSize * $Scale))
  $offset = [int](($CanvasSize - $drawSize) / 2)
  $graphics.DrawImage($Source, $offset, $offset, $drawSize, $drawSize)
  $graphics.Dispose()
  return $bitmap
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

function Draw-Scene {
  param(
    [System.Drawing.Graphics]$Graphics,
    [bool]$Monochrome = $false
  )

  $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(26, 24, 18, 12))
  $shelfBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x5B, 0x40, 0x2F))
  $shelfFrontBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x71, 0x50, 0x3B))

  if ($Monochrome) {
    $mono = [System.Drawing.Color]::FromArgb(24, 19, 17)
    $rollBodyBrush = New-Object System.Drawing.SolidBrush($mono)
    $sideRollBodyBrush = New-Object System.Drawing.SolidBrush($mono)
    $labelBrush = New-Object System.Drawing.SolidBrush($mono)
    $sideLabelBrush = New-Object System.Drawing.SolidBrush($mono)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Transparent)
    $leaderBrush = New-Object System.Drawing.SolidBrush($mono)
    $holeBrush = $null
    $rimHighlightBrush = New-Object System.Drawing.SolidBrush($mono)
  } else {
    $rollBodyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x22, 0x1B, 0x18))
    $sideRollBodyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x18, 0x13, 0x11))
    $labelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0xE8, 0xA8, 0x1B))
    $sideLabelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0xA9, 0x72, 0x18))
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x17, 0x13, 0x11))
    $leaderBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x8F, 0x58, 0x37))
    $holeBrush = New-Object System.Drawing.SolidBrush($cream)
    $rimHighlightBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x37, 0x2C, 0x26))
  }

  $textFormat = New-Object System.Drawing.StringFormat
  $textFormat.Alignment = [System.Drawing.StringAlignment]::Center
  $textFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
  $textFormat.FormatFlags = [System.Drawing.StringFormatFlags]::NoWrap
  $largeFont = New-Object System.Drawing.Font("Arial", 46, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

  $shelfShadow = New-RoundedRectPath 78 352 356 44 18
  $Graphics.FillPath($shadowBrush, $shelfShadow)

  $shelfTop = New-RoundedRectPath 72 342 368 28 14
  $Graphics.FillPath($shelfBrush, $shelfTop)

  $shelfFront = New-RoundedRectPath 84 364 344 32 12
  $Graphics.FillPath($shelfFrontBrush, $shelfFront)

  Draw-FilmRollSide -Graphics $Graphics -X 104 -Y 144 -Width 120 -Height 208 -RollBodyBrush $sideRollBodyBrush -RollLabelBrush $sideLabelBrush -ShadowBrush $shadowBrush -RimHighlightBrush $rimHighlightBrush -LeaderBrush $leaderBrush -HoleBrush $null -TextBrush $textBrush -TextFormat $textFormat -LargeFont $largeFont -ShowText $false -ShowLeader $false
  Draw-FilmRollSide -Graphics $Graphics -X 288 -Y 144 -Width 120 -Height 208 -RollBodyBrush $sideRollBodyBrush -RollLabelBrush $sideLabelBrush -ShadowBrush $shadowBrush -RimHighlightBrush $rimHighlightBrush -LeaderBrush $leaderBrush -HoleBrush $holeBrush -TextBrush $textBrush -TextFormat $textFormat -LargeFont $largeFont -ShowText $false -ShowLeader $true
  Draw-FilmRollSide -Graphics $Graphics -X 188 -Y 116 -Width 136 -Height 236 -RollBodyBrush $rollBodyBrush -RollLabelBrush $labelBrush -ShadowBrush $shadowBrush -RimHighlightBrush $rimHighlightBrush -LeaderBrush $leaderBrush -HoleBrush $null -TextBrush $textBrush -TextFormat $textFormat -LargeFont $largeFont -ShowText $true -ShowLeader $false

  $shadowBrush.Dispose()
  $shelfBrush.Dispose()
  $shelfFrontBrush.Dispose()
  $rollBodyBrush.Dispose()
  $sideRollBodyBrush.Dispose()
  $labelBrush.Dispose()
  $sideLabelBrush.Dispose()
  $textBrush.Dispose()
  $leaderBrush.Dispose()
  if ($null -ne $holeBrush) {
    $holeBrush.Dispose()
  }
  $rimHighlightBrush.Dispose()
  $textFormat.Dispose()
  $largeFont.Dispose()
  $shelfShadow.Dispose()
  $shelfTop.Dispose()
  $shelfFront.Dispose()
}

$storeBitmap = New-Object System.Drawing.Bitmap($sceneSize, $sceneSize)
$storeGraphics = [System.Drawing.Graphics]::FromImage($storeBitmap)
Set-GraphicsQuality $storeGraphics
$storeGraphics.Clear($cream)
Draw-Scene -Graphics $storeGraphics
$storeGraphics.Dispose()

[System.IO.Directory]::CreateDirectory((Split-Path $outputPath -Parent)) | Out-Null
$storeBitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$iconBitmap = Resize-Bitmap -Source $storeBitmap -Width 1024 -Height 1024
$iconBitmap.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)

$faviconBitmap = Resize-Bitmap -Source $storeBitmap -Width 48 -Height 48
$faviconBitmap.Save($faviconPath, [System.Drawing.Imaging.ImageFormat]::Png)

$transparentScene = New-Object System.Drawing.Bitmap($sceneSize, $sceneSize)
$transparentGraphics = [System.Drawing.Graphics]::FromImage($transparentScene)
Set-GraphicsQuality $transparentGraphics
$transparentGraphics.Clear([System.Drawing.Color]::Transparent)
Draw-Scene -Graphics $transparentGraphics
$transparentGraphics.Dispose()

$splashBitmap = Place-OnTransparentCanvas -Source $transparentScene -CanvasSize 1024 -Scale 0.74
$splashBitmap.Save($splashPath, [System.Drawing.Imaging.ImageFormat]::Png)

$androidForegroundBitmap = Place-OnTransparentCanvas -Source $transparentScene -CanvasSize 1024 -Scale 0.8
$androidForegroundBitmap.Save($androidForegroundPath, [System.Drawing.Imaging.ImageFormat]::Png)

$monochromeScene = New-Object System.Drawing.Bitmap($sceneSize, $sceneSize)
$monochromeGraphics = [System.Drawing.Graphics]::FromImage($monochromeScene)
Set-GraphicsQuality $monochromeGraphics
$monochromeGraphics.Clear([System.Drawing.Color]::Transparent)
Draw-Scene -Graphics $monochromeGraphics -Monochrome $true
$monochromeGraphics.Dispose()

$androidMonochromeBitmap = Place-OnTransparentCanvas -Source $monochromeScene -CanvasSize 1024 -Scale 0.8
$androidMonochromeBitmap.Save($androidMonochromePath, [System.Drawing.Imaging.ImageFormat]::Png)

$backgroundBitmap = New-Object System.Drawing.Bitmap(1024, 1024)
$backgroundGraphics = [System.Drawing.Graphics]::FromImage($backgroundBitmap)
$backgroundGraphics.Clear($cream)
$backgroundGraphics.Dispose()
$backgroundBitmap.Save($androidBackgroundPath, [System.Drawing.Imaging.ImageFormat]::Png)

$storeBitmap.Dispose()
$iconBitmap.Dispose()
$faviconBitmap.Dispose()
$transparentScene.Dispose()
$splashBitmap.Dispose()
$androidForegroundBitmap.Dispose()
$monochromeScene.Dispose()
$androidMonochromeBitmap.Dispose()
$backgroundBitmap.Dispose()

Write-Output "Wrote $outputPath"
