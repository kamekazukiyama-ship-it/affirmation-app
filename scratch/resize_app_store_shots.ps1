Add-Type -AssemblyName System.Drawing
$sourceDir = "C:\Users\kamek\.gemini\antigravity\brain\9d8d6805-eb6d-40d0-884a-5216fe515f20\"
$destBase = "c:\antigravity\AppStore_PERFECT\"

$sources = @(
    @{ name = "01_Multilingual_1.png"; src = "multilingual_feature_screen_1776401530367.png" },
    @{ name = "02_Multilingual_2.png"; src = "multilingual_player_screen_v2_1776401588850.png" },
    @{ name = "03_Home_EN.png"; src = "media__1776401248678.png" },
    @{ name = "04_Player_EN.png"; src = "media__1776401248709.png" },
    @{ name = "05_AI_Create_EN.png"; src = "media__1776401355245.png" }
)

$sizes = @(
    @{ folder = "6.5_inch_Screenshots"; width = 1242; height = 2688 },
    @{ folder = "6.7_inch_Screenshots"; width = 1290; height = 2796 },
    @{ folder = "iPad"; width = 2048; height = 2732 }
)

foreach ($size in $sizes) {
    $targetDir = Join-Path $destBase $size.folder
    if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }

    foreach ($item in $sources) {
        $inputPath = Join-Path $sourceDir $item.src
        $outputPath = Join-Path $targetDir $item.name
        
        Write-Host "Processing $($item.name) for $($size.folder)..."
        
        $bmp = [System.Drawing.Image]::FromFile($inputPath)
        $newBmp = New-Object System.Drawing.Bitmap($size.width, $size.height)
        $g = [System.Drawing.Graphics]::FromImage($newBmp)
        
        $g.Clear([System.Drawing.Color]::FromArgb(255, 10, 10, 26))
        
        $ratio = [Math]::Min($size.width / $bmp.Width, $size.height / $bmp.Height)
        $newWidth = [int]($bmp.Width * $ratio)
        $newHeight = [int]($bmp.Height * $ratio)
        $posX = [int](($size.width - $newWidth) / 2)
        $posY = [int](($size.height - $newHeight) / 2)
        
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.DrawImage($bmp, $posX, $posY, $newWidth, $newHeight)
        
        $newBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        $g.Dispose()
        $newBmp.Dispose()
        $bmp.Dispose()
    }
}
Write-Host "All resizing complete!"
