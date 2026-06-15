Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param (
        [string]$SourcePath,
        [string]$DestinationPath,
        [int]$Width,
        [int]$Height
    )
    if (!(Test-Path $SourcePath)) {
        Write-Error "Source file not found: $SourcePath"
        return
    }
    
    $src = [System.Drawing.Image]::FromFile($SourcePath)
    $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Set high quality resize settings
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($src, 0, 0, $Width, $Height)
    
    $bmp.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    $src.Dispose()
}

$baseDir = "c:\laragon\www\dhikr-counter"
$iconSrc = "$baseDir\assets\images\icon.png"

# Create destinations
Resize-Image -SourcePath $iconSrc -DestinationPath "$baseDir\public\icon-192.png" -Width 192 -Height 192
Resize-Image -SourcePath $iconSrc -DestinationPath "$baseDir\public\icon-512.png" -Width 512 -Height 512
Resize-Image -SourcePath $iconSrc -DestinationPath "$baseDir\public\favicon.ico" -Width 32 -Height 32

Write-Host "Icons resized and updated successfully in public directory!"
