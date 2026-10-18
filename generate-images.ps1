# Generate 30 SVG placeholder images
$outputDir = "C:\GitHub\carousel-kegiatan-pelayanan\public\images\kegiatan"
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

for ($i = 1; $i -le 30; $i++) {
    $hue = ($i * 13) % 360
    $svg = "<svg xmlns=`"http://www.w3.org/2000/svg`" width=`"800`" height=`"500`" viewBox=`"0 0 800 500`"><rect width=`"800`" height=`"500`" fill=`"hsl($hue, 60%, 65%)`"/><text x=`"400`" y=`"250`" font-family=`"Arial, sans-serif`" font-size=`"48`" fill=`"white`" text-anchor=`"middle`" dominant-baseline=`"middle`">Kegiatan $i</text></svg>"
    $svg | Out-File -FilePath "$outputDir\ke$i.svg" -Encoding UTF8
    Write-Host "Created ke$i.svg"
}

Write-Host "Done! Created 30 SVG files."