Add-Type -AssemblyName System.Drawing
$srcPath = 'C:\Foxline\build\icon-source.png'
$outIco = 'C:\Foxline\build\icon.ico'
$outPng = 'C:\Foxline\build\icon.png'
$src = [System.Drawing.Image]::FromFile($srcPath)
$sizes = @(16,24,32,48,64,128,256)
$png512 = New-Object System.Drawing.Bitmap 512,512
$g512 = [System.Drawing.Graphics]::FromImage($png512)
$g512.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g512.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g512.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g512.Clear([System.Drawing.Color]::Transparent)
$g512.DrawImage($src,0,0,512,512)
$g512.Dispose()
$png512.Save($outPng,[System.Drawing.Imaging.ImageFormat]::Png)
$png512.Dispose()
$images = @()
foreach($s in $sizes){
  $bmp = New-Object System.Drawing.Bitmap $s,$s
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.DrawImage($src,0,0,$s,$s)
  $g.Dispose()
  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms,[System.Drawing.Imaging.ImageFormat]::Png)
  $images += ,@($s, $ms.ToArray())
  $ms.Dispose(); $bmp.Dispose()
}
$src.Dispose()
$fs = [System.IO.File]::Open($outIco,[System.IO.FileMode]::Create)
$bw = New-Object System.IO.BinaryWriter($fs)
$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]$images.Count)
$offset = 6 + 16 * $images.Count
foreach($img in $images){ $s=[int]$img[0]; $data=[byte[]]$img[1]; $b=if($s -ge 256){0}else{$s}; $bw.Write([byte]$b); $bw.Write([byte]$b); $bw.Write([byte]0); $bw.Write([byte]0); $bw.Write([UInt16]1); $bw.Write([UInt16]32); $bw.Write([UInt32]$data.Length); $bw.Write([UInt32]$offset); $offset += $data.Length }
foreach($img in $images){ $bw.Write([byte[]]$img[1]) }
$bw.Close(); $fs.Close()
"ico ok $((Get-Item $outIco).Length)"
