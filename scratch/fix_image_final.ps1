Add-Type -AssemblyName System.Drawing

$source = "c:\antigravity\apple_assets\purchase_mockup.png"
$target1 = "c:\antigravity\apple_assets\purchase_1284x2778.png"

if (Test-Path $source) {
    Write-Host "ソースファイルが見つかりました: $source"
    
    # 1284 x 2778 (iPhone 6.5 inch)
    $img = [System.Drawing.Image]::FromFile($source)
    $bmp1 = New-Object System.Drawing.Bitmap(1284, 2778)
    $g1 = [System.Drawing.Graphics]::FromImage($bmp1)
    $g1.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g1.DrawImage($img, 0, 0, 1284, 2778)
    $g1.Dispose()
    $bmp1.Save($target1, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp1.Dispose()
    $img.Dispose()
    
    Write-Host "成功: $target1 を作成しました。"
} else {
    Write-Host "エラー: ソースファイルが見つかりません: $source"
}
