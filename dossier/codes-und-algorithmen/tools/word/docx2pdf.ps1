param([string]$docx, [string]$pdf)
# Wandelt eine Word-Datei mit Microsoft Word in PDF um (nur lesend geoeffnet).
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($docx, $false, $true)
  $doc.SaveAs2($pdf, 17)
  $doc.Close($false)
} finally {
  $word.Quit()
}
