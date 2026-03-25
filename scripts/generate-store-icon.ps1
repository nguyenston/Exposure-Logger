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

$size = 512
$bitmap = New-Object System.Drawing.Bitmap($size, $size)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$graphics.Clear([System.Drawing.Color]::FromArgb(0xF4, 0xEE, 0xE2))

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
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.DrawImage($Source, 0, 0, $Width, $Height)
  $graphics.Dispose()
  return $bitmap
}

function New-TransparentMotif {
  param(
    [System.Drawing.Bitmap]$Source,
    [int]$CanvasSize,
    [double]$Scale = 1.0,
    [bool]$Monochrome = $false
  )

  $bg = [System.Drawing.Color]::FromArgb(0xF4, 0xEE, 0xE2)
  $cutout = New-Object System.Drawing.Bitmap($Source.Width, $Source.Height)

  for ($x = 0; $x -lt $Source.Width; $x++) {
    for ($y = 0; $y -lt $Source.Height; $y++) {
      $pixel = $Source.GetPixel($x, $y)
      $distance = [Math]::Abs($pixel.R - $bg.R) + [Math]::Abs($pixel.G - $bg.G) + [Math]::Abs($pixel.B - $bg.B)
      if ($distance -lt 24) {
        $cutout.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $pixel.R, $pixel.G, $pixel.B))
      } elseif ($Monochrome) {
        $cutout.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($pixel.A, 24, 19, 17))
      } else {
        $cutout.SetPixel($x, $y, $pixel)
      }
    }
  }

  $target = New-Object System.Drawing.Bitmap($CanvasSize, $CanvasSize)
  $graphics = [System.Drawing.Graphics]::FromImage($target)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $drawSize = [int]([Math]::Round($CanvasSize * $Scale))
  $offset = [int](($CanvasSize - $drawSize) / 2)
  $graphics.DrawImage($cutout, $offset, $offset, $drawSize, $drawSize)
  $graphics.Dispose()
  $cutout.Dispose()
  return $target
}

$shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(26, 24, 18, 12))
$shelfBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x5B, 0x40, 0x2F))
$shelfFrontBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x71, 0x50, 0x3B))
$rollBodyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x22, 0x1B, 0x18))
$sideRollBodyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x18, 0x13, 0x11))
$labelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0xE8, 0xA8, 0x1B))
$sideLabelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0xA9, 0x72, 0x18))
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x17, 0x13, 0x11))
$leaderBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x8F, 0x58, 0x37))
$holeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0xF4, 0xEE, 0xE2))
$rimHighlightBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0x37, 0x2C, 0x26))
$textFormat = New-Object System.Drawing.StringFormat
$textFormat.Alignment = [System.Drawing.StringAlignment]::Center
$textFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
$textFormat.FormatFlags = [System.Drawing.StringFormatFlags]::NoWrap
$largeFont = New-Object System.Drawing.Font("Arial", 46, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

function Draw-FilmRollSide {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [System.Drawing.Brush]$RollBodyBrush,
    [System.Drawing.Brush]$RollLabelBrush,
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
    $Graphics.FillPath($leaderBrush, $leaderPath)

    for ($i = 0; $i -lt 4; $i++) {
      $holeX = $leaderX - 6 + ($i * 9)
      $Graphics.FillRectangle($holeBrush, $holeX, ($leaderTop + 5), 5, 7)
    }

    $leaderPath.Dispose()
  }

  $nubPath = New-RoundedRectPath ($X + ($Width * 0.32)) ($Y - 16) ($Width * 0.36) 34 12
  $Graphics.FillPath($RollBodyBrush, $nubPath)

  $shadowPath = New-RoundedRectPath ($X + 4) ($Y + 6) $Width $Height ([Math]::Round($Width * 0.18))
  $Graphics.FillPath($shadowBrush, $shadowPath)

  $bodyPath = New-RoundedRectPath $X $Y $Width $Height ([Math]::Round($Width * 0.18))
  $Graphics.FillPath($RollBodyBrush, $bodyPath)

  $labelPath = New-RoundedRectPath ($X + 8) ($Y + 24) ($Width - 16) ($Height - 48) 16
  $Graphics.FillPath($RollLabelBrush, $labelPath)

  $topRim = New-RoundedRectPath ($X + 2) ($Y + 12) ($Width - 4) 18 10
  $bottomRim = New-RoundedRectPath ($X + 2) ($Y + $Height - 30) ($Width - 4) 18 10
  $Graphics.FillPath($rimHighlightBrush, $topRim)
  $Graphics.FillPath($rimHighlightBrush, $bottomRim)

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
    $Graphics.DrawString("400", $largeFont, $textBrush, $textRect, $textFormat)
    $Graphics.Restore($state)
  }

  $nubPath.Dispose()
  $shadowPath.Dispose()
  $bodyPath.Dispose()
  $labelPath.Dispose()
  $topRim.Dispose()
  $bottomRim.Dispose()
}

$shelfShadow = New-RoundedRectPath 78 352 356 44 18
$graphics.FillPath($shadowBrush, $shelfShadow)

$shelfTop = New-RoundedRectPath 72 342 368 28 14
$graphics.FillPath($shelfBrush, $shelfTop)

$shelfFront = New-RoundedRectPath 84 364 344 32 12
$graphics.FillPath($shelfFrontBrush, $shelfFront)

Draw-FilmRollSide $graphics 104 144 120 208 $sideRollBodyBrush $sideLabelBrush $false $false
Draw-FilmRollSide $graphics 288 144 120 208 $sideRollBodyBrush $sideLabelBrush $false $true
Draw-FilmRollSide $graphics 188 116 136 236 $rollBodyBrush $labelBrush $true $false

[System.IO.Directory]::CreateDirectory((Split-Path $outputPath -Parent)) | Out-Null
$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$iconBitmap = Resize-Bitmap -Source $bitmap -Width 1024 -Height 1024
$iconBitmap.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)

$faviconBitmap = Resize-Bitmap -Source $bitmap -Width 48 -Height 48
$faviconBitmap.Save($faviconPath, [System.Drawing.Imaging.ImageFormat]::Png)

$splashBitmap = New-TransparentMotif -Source $bitmap -CanvasSize 1024 -Scale 0.74
$splashBitmap.Save($splashPath, [System.Drawing.Imaging.ImageFormat]::Png)

$androidForegroundBitmap = New-TransparentMotif -Source $bitmap -CanvasSize 1024 -Scale 0.8
$androidForegroundBitmap.Save($androidForegroundPath, [System.Drawing.Imaging.ImageFormat]::Png)

$androidMonochromeBitmap = New-TransparentMotif -Source $bitmap -CanvasSize 1024 -Scale 0.8 -Monochrome $true
$androidMonochromeBitmap.Save($androidMonochromePath, [System.Drawing.Imaging.ImageFormat]::Png)

$backgroundBitmap = New-Object System.Drawing.Bitmap(1024, 1024)
$backgroundGraphics = [System.Drawing.Graphics]::FromImage($backgroundBitmap)
$backgroundGraphics.Clear([System.Drawing.Color]::FromArgb(0xF4, 0xEE, 0xE2))
$backgroundGraphics.Dispose()
$backgroundBitmap.Save($androidBackgroundPath, [System.Drawing.Imaging.ImageFormat]::Png)

$shadowBrush.Dispose()
$shelfBrush.Dispose()
$shelfFrontBrush.Dispose()
$rollBodyBrush.Dispose()
$sideRollBodyBrush.Dispose()
$labelBrush.Dispose()
$sideLabelBrush.Dispose()
$textBrush.Dispose()
$leaderBrush.Dispose()
$holeBrush.Dispose()
$rimHighlightBrush.Dispose()
$textFormat.Dispose()
$largeFont.Dispose()
$shelfShadow.Dispose()
$shelfTop.Dispose()
$shelfFront.Dispose()
$graphics.Dispose()
$bitmap.Dispose()
$iconBitmap.Dispose()
$faviconBitmap.Dispose()
$splashBitmap.Dispose()
$androidForegroundBitmap.Dispose()
$androidMonochromeBitmap.Dispose()
$backgroundBitmap.Dispose()

Write-Output "Wrote $outputPath"
