Write-Host "Moving legacy directories into archive..."
if (!(Test-Path -Path "archive")) { New-Item -ItemType Directory -Path "archive" }
$dirs = @('client','api','netlify','ETERNAL_RESEARCH_CHILD')
foreach ($d in $dirs) {
    $src = "$d"
    $dst = "archive/$d"
    if (Test-Path $src) {
        Write-Host "git mv $src $dst"
        git mv $src $dst
    } else {
        Write-Host "Directory $src not found, skipping."
    }
}
Write-Host "Legacy move completed."
