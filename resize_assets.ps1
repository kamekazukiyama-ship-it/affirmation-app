Add-Type -AssemblyName System.Drawing
$iconPath = "C:\PlayStore_Android\icon_512.png"
$featurePath = "C:\PlayStore_Android\feature_graphic.png"

# Resize Icon to 512x512
if (Test-Path $iconPath) {
    try {
        $icon = [System.Drawing.Image]::FromFile($iconPath)
        $newIcon = New-Object System.Drawing.Bitmap(512, 512)
        $g = [System.Drawing.Graphics]::FromImage($newIcon)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.DrawImage($icon, 0, 0, 512, 512)
        $newIcon.Save("C:\PlayStore_Android\icon_512_upload.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $g.Dispose()
        $newIcon.Dispose()
        $icon.Dispose()
        Write-Host "Icon resized to 512x512: icon_512_upload.png"
    } catch {
        Write-Host "Error resizing icon: $_"
    }
}

# Resize Feature Graphic to 1024x500
if (Test-Path $featurePath) {
    try {
        $feature = [System.Drawing.Image]::FromFile($featurePath)
        $newFeature = New-Object System.Drawing.Bitmap(1024, 500)
        $g = [System.Drawing.Graphics]::FromImage($newFeature)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.DrawImage($feature, 0, 0, 1024, 500)
        $newFeature.Save("C:\PlayStore_Android\feature_graphic_upload.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $g.Dispose()
        $newFeature.Dispose()
        $feature.Dispose()
        Write-Host "Feature Graphic resized to 1024x500: feature_graphic_upload.png"
    } catch {
        Write-Host "Error resizing feature graphic: $_"
    }
}
