Write-Host "Starting Excel conversion..."
# NOTE: Paths for assets in the "00 AUGUST ADDITIONS" folder are exported from src/augustAdditions.ts
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$inputPath = 'e:\\Rajkumar\\Bridge_Slab_Design\\Attached_Assets\\Stability Analysis SUBMERSIBLE BRIDGE ACROSS SOM RIVER.XLS'
$outputPath = 'e:\\Rajkumar\\Bridge_Slab_Design\\Attached_Assets\\Stability Analysis SUBMERSIBLE BRIDGE ACROSS SOM RIVER.xlsx'
$wb = $excel.Workbooks.Open($inputPath)
# 51 = xlOpenXMLWorkbook (xlsx)
$wb.SaveAs($outputPath, 51)
$wb.Close()
$excel.Quit()
Write-Host "Conversion completed."
