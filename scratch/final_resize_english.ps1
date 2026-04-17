Add-Type -AssemblyName System.Drawing
$src = "c:\antigravity\apple_assets\purchase_mockup.png"
$dst = "c:\antigravity\apple_assets\purchase_1284_2778.png"

$img = [System.Drawing.Image]::FromFile($src)
$bmp = New-Object System.Drawing.Bitmap(1284, 2778)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, 1284, 2778)
$g.Dispose()
$img.Dispose()
$bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
