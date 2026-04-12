<#
.SYNOPSIS
Writes Exposure Logger CSV metadata into TIFF/JPEG scans with ExifTool.

.DESCRIPTION
Each immediate child folder under -Root is treated as one roll folder. Each roll
folder can contain one CSV export file and image files for that roll. Without
-Strict, folders without CSV files can still be used for TIFF compression.

DateTimeOriginal and CreateDate are written as local wall-clock time. The UTC
offset for that wall time is written to OffsetTimeOriginal. When a CSV row has
capturedAtOffset, that row offset is used by default; otherwise explicit CSV
offsets are converted to the computer's local timezone. Pass -TimeZone or
-TimeZoneOffset to override the shooting timezone explicitly.

The script is dry-run by default. Pass -Apply to actually invoke ExifTool.

.EXAMPLE
.\scripts\write-exif-from-roll-csv.ps1 -Root "D:\Scans"

.EXAMPLE
.\scripts\write-exif-from-roll-csv.ps1 -Root "D:\Scans" -MatchBy FileNameNumber -Apply

.EXAMPLE
.\scripts\write-exif-from-roll-csv.ps1 -Root "D:\Scans" -ReverseOrder -Apply

.EXAMPLE
.\scripts\write-exif-from-roll-csv.ps1 -Root "D:\Scans" -OutputRoot "D:\Compressed Scans" -CompressTiff -ReverseOrder -Apply

.EXAMPLE
.\scripts\write-exif-from-roll-csv.ps1 -Root "D:\Scans" -TimeZone "Eastern Standard Time" -Apply

.EXAMPLE
.\scripts\write-exif-from-roll-csv.ps1 -Root "D:\Scans" -TimeZoneOffset "UTC-04:00" -Apply
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Root,

  [ValidateSet('Auto', 'FileNameNumber', 'SortedOrder')]
  [string]$MatchBy = 'Auto',

  [string]$ExifTool = 'exiftool',

  [string]$ImageMagick = 'magick',

  [string]$OutputRoot,

  [switch]$Apply,

  [switch]$ReverseOrder,

  [switch]$CompressTiff,

  [switch]$Strict,

  [ValidateSet('Zip', 'LZW')]
  [string]$Compression = 'Zip',

  [switch]$RecurseImages,

  [switch]$OverwriteOriginal,

  [string]$TimeZone,

  [string]$TimeZoneOffset
)

$ErrorActionPreference = 'Stop'

$imageExtensions = @('.jpg', '.jpeg', '.tif', '.tiff')
$tiffExtensions = @('.tif', '.tiff')
$scriptRoot = Split-Path -Parent $PSCommandPath
$pathRoot = Split-Path -Parent $scriptRoot
$targetTimeZone = $null
$targetTimeZoneOffset = $null

function Resolve-ScriptRelativePath {
  param([Parameter(Mandatory = $true)][string]$Path)

  if ([System.IO.Path]::IsPathRooted($Path)) {
    return $Path
  }

  return Join-Path $pathRoot $Path
}

function Get-NaturalSortKey {
  param([Parameter(Mandatory = $true)][string]$Value)

  return [regex]::Replace($Value.ToLowerInvariant(), '\d+', {
    param($Match)
    $Match.Value.PadLeft(12, '0')
  })
}

function Get-FileNameFrameNumber {
  param([Parameter(Mandatory = $true)][System.IO.FileInfo]$File)

  $matches = [regex]::Matches($File.BaseName, '\d+')
  if ($matches.Count -eq 0) {
    return $null
  }

  return [int]$matches[$matches.Count - 1].Value
}

function Test-HasExplicitTimeZone {
  param([Parameter(Mandatory = $true)][string]$Value)

  return $Value.Trim() -match '(?i)(?:z|[+-]\d{2}:?\d{2})$'
}

function Convert-ToTimeSpanOffset {
  param([Parameter(Mandatory = $true)][string]$Value)

  $normalized = $Value.Trim()
  if ($normalized -notmatch '^(?:UTC|GMT)?([+-])(\d{2}):?(\d{2})$') {
    throw "-TimeZoneOffset must use UTC+/-HH:mm or GMT+/-HH:mm, for example UTC-04:00."
  }

  $hours = [int]$matches[2]
  $minutes = [int]$matches[3]
  if ($hours -gt 14 -or $minutes -gt 59) {
    throw "-TimeZoneOffset '$Value' is outside the valid offset range."
  }

  $offset = [TimeSpan]::new($hours, $minutes, 0)
  if ($matches[1] -eq '-') {
    return -$offset
  }

  return $offset
}

function Format-TimeSpanOffset {
  param([Parameter(Mandatory = $true)][TimeSpan]$Offset)

  $sign = if ($Offset.Ticks -lt 0) { '-' } else { '+' }
  $absolute = $Offset.Duration()
  return "{0}{1:00}:{2:00}" -f $sign, [math]::Floor($absolute.TotalHours), $absolute.Minutes
}

function Convert-ToTargetCapturedAt {
  param([Parameter(Mandatory = $true)][DateTimeOffset]$Date)

  if ($targetTimeZone) {
    return [System.TimeZoneInfo]::ConvertTime($Date, $targetTimeZone)
  }

  if ($targetTimeZoneOffset -ne $null) {
    return $Date.ToOffset($targetTimeZoneOffset)
  }

  return $Date.ToLocalTime()
}

function Convert-CapturedAtForExif {
  param(
    [string]$Value,
    [string]$CapturedAtOffset
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $null
  }

  try {
    if (Test-HasExplicitTimeZone $Value) {
      $date = [DateTimeOffset]::Parse(
        $Value,
        [System.Globalization.CultureInfo]::InvariantCulture,
        [System.Globalization.DateTimeStyles]::None
      )
      if ($targetTimeZone -or $targetTimeZoneOffset -ne $null) {
        $date = Convert-ToTargetCapturedAt $date
      } elseif (-not [string]::IsNullOrWhiteSpace($CapturedAtOffset)) {
        $date = $date.ToOffset((Convert-ToTimeSpanOffset $CapturedAtOffset))
      } else {
        $date = Convert-ToTargetCapturedAt $date
      }
    } else {
      $localDate = [DateTime]::Parse(
        $Value,
        [System.Globalization.CultureInfo]::InvariantCulture,
        [System.Globalization.DateTimeStyles]::None
      )

      if ($targetTimeZone) {
        $offset = $targetTimeZone.GetUtcOffset($localDate)
        $date = [DateTimeOffset]::new($localDate, $offset)
      } elseif ($targetTimeZoneOffset -ne $null) {
        $date = [DateTimeOffset]::new($localDate, $targetTimeZoneOffset)
      } else {
        $date = [DateTimeOffset]::new($localDate)
      }
    }

    return @{
      ExifDate = $date.DateTime.ToString('yyyy:MM:dd HH:mm:ss')
      XmpDate = $date.ToString('o')
      Offset = Format-TimeSpanOffset $date.Offset
    }
  } catch {
    Write-Warning "Could not parse capturedAt value '$Value'. Date tags will be skipped."
    return $null
  }
}

function Convert-FStopForExif {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $null
  }

  $normalized = $Value.Trim() -replace '^f/?', ''
  $number = 0.0
  if ([double]::TryParse(
      $normalized,
      [System.Globalization.NumberStyles]::Float,
      [System.Globalization.CultureInfo]::InvariantCulture,
      [ref]$number
    )) {
    return $number.ToString('0.###', [System.Globalization.CultureInfo]::InvariantCulture)
  }

  return $null
}

function Convert-ShutterForExif {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $null
  }

  $normalized = $Value.Trim().ToLowerInvariant()
  if ($normalized.EndsWith('s')) {
    return $normalized.Substring(0, $normalized.Length - 1)
  }

  if ($normalized -match '^\d+$') {
    return "1/$normalized"
  }

  return $normalized
}

function Convert-FocalLengthForExif {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $null
  }

  $match = [regex]::Match($Value, '(?i)(\d+(?:\.\d+)?)\s*mm\b')
  if (-not $match.Success) {
    return $null
  }

  return "$($match.Groups[1].Value)mm"
}

function Add-ExifArg {
  param(
    [Parameter(Mandatory = $true)][System.Collections.Generic.List[string]]$ArgumentList,
    [Parameter(Mandatory = $true)][string]$Tag,
    [AllowNull()][string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return
  }

  $ArgumentList.Add("-$Tag=$Value")
}

function Join-NonEmpty {
  param([string[]]$Values)

  return ($Values | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }) -join '; '
}

function Select-FirstNonEmpty {
  param([string[]]$Values)

  foreach ($value in $Values) {
    if (-not [string]::IsNullOrWhiteSpace($value)) {
      return $value
    }
  }

  return $null
}

function Build-Description {
  param($Row)

  $parts = [System.Collections.Generic.List[string]]::new()
  $rollLabel = Join-NonEmpty @($Row.rollNickname, $Row.rollId)
  $exposureLabel = Join-NonEmpty @($Row.fStop, $Row.shutterSpeed)
  $flashLabel = Join-NonEmpty @($Row.flash, $Row.flashPower)

  if ($rollLabel) { $parts.Add("Roll: $rollLabel") }
  if ($Row.exposureSequenceNumber) { $parts.Add("Frame: $($Row.exposureSequenceNumber)") }
  if ($Row.camera) { $parts.Add("Camera: $($Row.camera)") }
  if ($Row.filmStock) { $parts.Add("Film: $($Row.filmStock)") }
  if ($Row.shotIso) { $parts.Add("Shot ISO: $($Row.shotIso)") }
  if ($exposureLabel) { $parts.Add("Exposure: $exposureLabel") }
  if ($Row.lens) { $parts.Add("Lens: $($Row.lens)") }
  if ($flashLabel) { $parts.Add("Flash: $flashLabel") }
  if ($Row.ndStops) { $parts.Add("ND: $($Row.ndStops)") }
  if ($Row.exposureNotes) { $parts.Add("Notes: $($Row.exposureNotes)") }

  return Join-NonEmpty $parts
}

function Build-ExifToolArgs {
  param($Row)

  $args = [System.Collections.Generic.List[string]]::new()
  $args.Add('-P')
  if ($OverwriteOriginal -or -not [string]::IsNullOrWhiteSpace($OutputRoot)) {
    $args.Add('-overwrite_original')
  }

  $capturedAt = Convert-CapturedAtForExif $Row.capturedAt $Row.capturedAtOffset
  if ($capturedAt) {
    Add-ExifArg $args 'DateTimeOriginal' $capturedAt.ExifDate
    Add-ExifArg $args 'CreateDate' $capturedAt.ExifDate
    Add-ExifArg $args 'XMP:DateCreated' $capturedAt.XmpDate
    Add-ExifArg $args 'OffsetTimeOriginal' $capturedAt.Offset
  }

  Add-ExifArg $args 'Model' $Row.camera
  Add-ExifArg $args 'LensModel' $Row.lens
  Add-ExifArg $args 'FocalLength' (Select-FirstNonEmpty @($Row.lensFocalLength, (Convert-FocalLengthForExif $Row.lens)))
  Add-ExifArg $args 'ISO' (Select-FirstNonEmpty @($Row.shotIso, $Row.nativeIso))
  Add-ExifArg $args 'FNumber' (Convert-FStopForExif $Row.fStop)
  Add-ExifArg $args 'ExposureTime' (Convert-ShutterForExif $Row.shutterSpeed)
  Add-ExifArg $args 'CreatorTool' 'Exposure Logger'

  if (-not [string]::IsNullOrWhiteSpace($Row.latitude) -and -not [string]::IsNullOrWhiteSpace($Row.longitude)) {
    $latitude = [double]$Row.latitude
    $longitude = [double]$Row.longitude
    Add-ExifArg $args 'GPSLatitude' ([math]::Abs($latitude).ToString('0.########', [System.Globalization.CultureInfo]::InvariantCulture))
    Add-ExifArg $args 'GPSLatitudeRef' ($(if ($latitude -lt 0) { 'S' } else { 'N' }))
    Add-ExifArg $args 'GPSLongitude' ([math]::Abs($longitude).ToString('0.########', [System.Globalization.CultureInfo]::InvariantCulture))
    Add-ExifArg $args 'GPSLongitudeRef' ($(if ($longitude -lt 0) { 'W' } else { 'E' }))
  }

  $description = Build-Description $Row
  Add-ExifArg $args 'ImageDescription' $description
  Add-ExifArg $args 'Description' $description
  Add-ExifArg $args 'UserComment' $description
  Add-ExifArg $args 'XMP:Title' (Join-NonEmpty @($Row.rollNickname, "Frame $($Row.exposureSequenceNumber)"))
  Add-ExifArg $args 'XMP:Identifier' $Row.exposureId

  return $args
}

function Get-RollRowsByFrame {
  param([Parameter(Mandatory = $true)]$Rows)

  $map = @{}
  foreach ($row in $Rows) {
    if ([string]::IsNullOrWhiteSpace($row.exposureSequenceNumber)) {
      continue
    }

    $frame = [int]$row.exposureSequenceNumber
    if (-not $map.ContainsKey($frame)) {
      $map[$frame] = $row
    }
  }

  return $map
}

function Get-RollImageFiles {
  param([Parameter(Mandatory = $true)][System.IO.DirectoryInfo]$Folder)

  $mode = if ($RecurseImages) { 'AllDirectories' } else { 'TopDirectoryOnly' }
  return Get-ChildItem -LiteralPath $Folder.FullName -File -Recurse:($RecurseImages.IsPresent) |
    Where-Object { $imageExtensions -contains $_.Extension.ToLowerInvariant() } |
    Where-Object { -not (Test-IsInOutputRoot $_) } |
    Sort-Object @{ Expression = { Get-NaturalSortKey $_.Name } }
}

function Get-RelativePath {
  param(
    [Parameter(Mandatory = $true)][string]$BasePath,
    [Parameter(Mandatory = $true)][string]$TargetPath
  )

  $baseFullPath = [System.IO.Path]::GetFullPath($BasePath)
  $targetFullPath = [System.IO.Path]::GetFullPath($TargetPath)

  if (-not $baseFullPath.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
    $baseFullPath += [System.IO.Path]::DirectorySeparatorChar
  }

  $baseUri = [System.Uri]::new($baseFullPath)
  $targetUri = [System.Uri]::new($targetFullPath)
  $relativeUri = $baseUri.MakeRelativeUri($targetUri)
  $relativePath = [System.Uri]::UnescapeDataString($relativeUri.ToString())

  return $relativePath.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
}

function Get-OutputImagePath {
  param(
    [Parameter(Mandatory = $true)][System.IO.FileInfo]$Image,
    [Parameter(Mandatory = $true)][System.IO.DirectoryInfo]$RollFolder
  )

  if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
    return $Image.FullName
  }

  $relativeFolder = Get-RelativePath $rootItem.FullName $RollFolder.FullName
  $targetFolder = Join-Path $OutputRoot $relativeFolder
  return Join-Path $targetFolder $Image.Name
}

function Copy-ImageForOutput {
  param(
    [Parameter(Mandatory = $true)][System.IO.FileInfo]$Image,
    [Parameter(Mandatory = $true)][string]$TargetPath
  )

  $targetDirectory = Split-Path -Parent $TargetPath
  New-Item -ItemType Directory -Force -Path $targetDirectory | Out-Null
  Copy-Item -LiteralPath $Image.FullName -Destination $TargetPath -Force
}

function Compress-TiffForOutput {
  param(
    [Parameter(Mandatory = $true)][System.IO.FileInfo]$Image,
    [Parameter(Mandatory = $true)][string]$TargetPath
  )

  $targetDirectory = Split-Path -Parent $TargetPath
  New-Item -ItemType Directory -Force -Path $targetDirectory | Out-Null

  if ([System.IO.Path]::GetFullPath($Image.FullName) -eq [System.IO.Path]::GetFullPath($TargetPath)) {
    $tempPath = Join-Path $targetDirectory "$($Image.BaseName).compressed-$([guid]::NewGuid())$($Image.Extension)"
    & $ImageMagick $Image.FullName -compress $Compression $tempPath
    if ($LASTEXITCODE -ne 0) {
      if (Test-Path -LiteralPath $tempPath) {
        Remove-Item -LiteralPath $tempPath -Force
      }
      throw "ImageMagick failed for '$($Image.FullName)' with exit code $LASTEXITCODE."
    }

    Move-Item -LiteralPath $tempPath -Destination $TargetPath -Force
    return
  }

  & $ImageMagick $Image.FullName -compress $Compression $TargetPath
  if ($LASTEXITCODE -ne 0) {
    throw "ImageMagick failed for '$($Image.FullName)' with exit code $LASTEXITCODE."
  }
}

function Copy-ExistingMetadata {
  param(
    [Parameter(Mandatory = $true)][System.IO.FileInfo]$SourceImage,
    [Parameter(Mandatory = $true)][string]$TargetPath
  )

  $args = @(
    '-overwrite_original',
    '-TagsFromFile',
    $SourceImage.FullName,
    '-all:all',
    $TargetPath
  )

  & $ExifTool @args
  if ($LASTEXITCODE -ne 0) {
    throw "ExifTool failed to copy metadata from '$($SourceImage.FullName)' to '$TargetPath' with exit code $LASTEXITCODE."
  }
}

function Test-FileNameFrameCoverage {
  param(
    [Parameter(Mandatory = $true)][object[]]$Images,
    [Parameter(Mandatory = $true)]$RowsByFrame
  )

  if ($Images.Count -eq 0) {
    return $false
  }

  foreach ($image in $Images) {
    $frame = Get-FileNameFrameNumber $image
    if ($frame -ne $null -and $RowsByFrame.ContainsKey($frame)) {
      return $true
    }
  }

  return $false
}

function Invoke-RollFolder {
  param([Parameter(Mandatory = $true)][System.IO.DirectoryInfo]$Folder)

  $csvFiles = Get-ChildItem -LiteralPath $Folder.FullName -File -Filter '*.csv'
  if ($csvFiles.Count -eq 0) {
    if ($Strict) {
      Write-Host "Skip '$($Folder.Name)': no CSV file found and -Strict is enabled."
      return
    }

    if (-not $CompressTiff) {
      Write-Host "Skip '$($Folder.Name)': no CSV file found and no compression was requested."
      return
    }

    Invoke-FolderWithoutCsv $Folder
    return
  }

  if ($csvFiles.Count -gt 1) {
    Write-Warning "Skip '$($Folder.Name)': expected one CSV file, found $($csvFiles.Count)."
    return
  }

  $rows = Import-Csv -LiteralPath $csvFiles[0].FullName |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_.exposureSequenceNumber) }
  $rows = @($rows | Sort-Object @{ Expression = { [int]$_.exposureSequenceNumber } })
  $rowsByFrame = Get-RollRowsByFrame $rows
  $images = @(Get-RollImageFiles $Folder)

  if ($rows.Count -eq 0) {
    Write-Host "Skip '$($Folder.Name)': CSV has no exposure rows."
    return
  }

  if ($images.Count -eq 0) {
    Write-Host "Skip '$($Folder.Name)': no TIFF/JPEG images found."
    return
  }

  Write-Host "Roll '$($Folder.Name)': $($rows.Count) exposure rows, $($images.Count) image files."
  $useFileNameNumbers = $MatchBy -eq 'FileNameNumber' -or (
    $MatchBy -eq 'Auto' -and (Test-FileNameFrameCoverage $images $rowsByFrame)
  )

  for ($index = 0; $index -lt $images.Count; $index++) {
    $image = $images[$index]
    $row = $null
    $frame = $null

    if ($useFileNameNumbers) {
      $frame = Get-FileNameFrameNumber $image
      if ($frame -ne $null -and $rowsByFrame.ContainsKey($frame)) {
        $row = $rowsByFrame[$frame]
      }
    }

    if ($row -eq $null -and ($MatchBy -eq 'SortedOrder' -or $MatchBy -eq 'Auto')) {
      $rowIndex = if ($ReverseOrder) { $rows.Count - 1 - $index } else { $index }
      if ($rowIndex -ge 0 -and $rowIndex -lt $rows.Count) {
        $row = $rows[$rowIndex]
        $frame = [int]$row.exposureSequenceNumber
      }
    }

    if ($row -eq $null) {
      Write-Warning "No exposure row matched image '$($image.FullName)'."
      continue
    }

    $targetPath = Get-OutputImagePath $image $Folder
    $shouldCompressImage = $CompressTiff -and ($tiffExtensions -contains $image.Extension.ToLowerInvariant())
    $exifArgs = Build-ExifToolArgs $row
    if (-not $Apply) {
      Write-Host "DRY RUN: frame $frame -> $($image.Name)"
      if ($CompressTiff) {
        $compressionAction = if ($shouldCompressImage) { "compress $Compression" } else { 'copy without TIFF compression' }
        Write-Host "  output: $targetPath ($compressionAction)"
      }
      Write-Host "  $($exifArgs -join ' ')"
      continue
    }

    if ($OutputRoot) {
      if ($shouldCompressImage) {
        Compress-TiffForOutput $image $targetPath
      } else {
        Copy-ImageForOutput $image $targetPath
      }
    }

    $targetForExif = if ($OutputRoot) { $targetPath } else { $image.FullName }
    $invokeArgs = @($exifArgs) + @($targetForExif)
    Write-Host "Writing frame $frame -> $targetForExif"
    & $ExifTool @invokeArgs
    if ($LASTEXITCODE -ne 0) {
      throw "ExifTool failed for '$targetForExif' with exit code $LASTEXITCODE."
    }
  }
}

function Invoke-FolderWithoutCsv {
  param([Parameter(Mandatory = $true)][System.IO.DirectoryInfo]$Folder)

  $images = @(Get-RollImageFiles $Folder)
  if ($images.Count -eq 0) {
    Write-Host "Skip '$($Folder.Name)': no TIFF/JPEG images found."
    return
  }

  Write-Host "Folder '$($Folder.Name)': no CSV file found; compressing $($images.Count) image files."
  foreach ($image in $images) {
    $targetPath = Get-OutputImagePath $image $Folder
    $shouldCompressImage = $CompressTiff -and ($tiffExtensions -contains $image.Extension.ToLowerInvariant())

    if (-not $Apply) {
      $compressionAction = if ($shouldCompressImage) { "compress $Compression" } else { 'copy without TIFF compression' }
      Write-Host "DRY RUN: $($image.Name)"
      Write-Host "  output: $targetPath ($compressionAction)"
      continue
    }

    if ($OutputRoot) {
      if ($shouldCompressImage) {
        Compress-TiffForOutput $image $targetPath
        Copy-ExistingMetadata $image $targetPath
      } else {
        Copy-ImageForOutput $image $targetPath
      }
      continue
    }

    if ($shouldCompressImage) {
      Compress-TiffForOutput $image $targetPath
    }
  }
}

$Root = Resolve-ScriptRelativePath $Root
function Get-NormalizedFullPath {
  param([Parameter(Mandatory = $true)][string]$Path)

  $fullPath = [System.IO.Path]::GetFullPath($Path).TrimEnd(
    [System.IO.Path]::DirectorySeparatorChar,
    [System.IO.Path]::AltDirectorySeparatorChar
  )
  return $fullPath
}

function Test-IsInOutputRoot {
  param([Parameter(Mandatory = $true)][System.IO.FileSystemInfo]$Item)

  if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
    return $false
  }

  $itemPath = Get-NormalizedFullPath $Item.FullName
  $outputPath = Get-NormalizedFullPath $OutputRoot

  return $itemPath -eq $outputPath -or $itemPath.StartsWith(
    "$outputPath$([System.IO.Path]::DirectorySeparatorChar)",
    [System.StringComparison]::OrdinalIgnoreCase
  )
}

if ($OutputRoot) {
  $OutputRoot = Resolve-ScriptRelativePath $OutputRoot
}

if ($TimeZone -and $TimeZoneOffset) {
  throw "Use either -TimeZone or -TimeZoneOffset, not both."
}

if ($TimeZone) {
  try {
    $targetTimeZone = [System.TimeZoneInfo]::FindSystemTimeZoneById($TimeZone)
  } catch {
    throw "Time zone '$TimeZone' was not found. On Windows, use an ID like 'Eastern Standard Time'."
  }
}

if ($TimeZoneOffset) {
  $targetTimeZoneOffset = Convert-ToTimeSpanOffset $TimeZoneOffset
}

$rootItem = Get-Item -LiteralPath $Root
if (-not $rootItem.PSIsContainer) {
  throw "-Root must be a directory."
}

if ($CompressTiff -and -not $OutputRoot -and -not $OverwriteOriginal) {
  throw "-CompressTiff requires -OutputRoot unless -OverwriteOriginal is also passed."
}

if ($Apply) {
  if ($OutputRoot) {
    New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null
  }

  $command = Get-Command $ExifTool -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "ExifTool command '$ExifTool' was not found. Install ExifTool or pass -ExifTool with the full path."
  }

  if ($CompressTiff) {
    $magickCommand = Get-Command $ImageMagick -ErrorAction SilentlyContinue
    if (-not $magickCommand) {
      throw "ImageMagick command '$ImageMagick' was not found. Install ImageMagick or pass -ImageMagick with the full path."
    }
  }
} else {
  Write-Host 'Dry run only. Pass -Apply to write metadata.'
}

Get-ChildItem -LiteralPath $rootItem.FullName -Directory |
  Where-Object { -not (Test-IsInOutputRoot $_) } |
  Sort-Object @{ Expression = { Get-NaturalSortKey $_.Name } } |
  ForEach-Object { Invoke-RollFolder $_ }
