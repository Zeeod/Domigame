
$cardsDir = "d:\Jeux\Developpement\dominion\shared\cards"
$results = @()

Get-ChildItem -Path $cardsDir -Filter "*.ts" -Recurse | Where-Object { $_.Name -ne "index.ts" } | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Simple regex for name, id, expansion, set
    $nameMatch = [regex]::Match($content, 'name:\s*[''"`](.*?)[''"`]')
    $idMatch = [regex]::Match($content, 'id:\s*[''"`](.*?)[''"`]')
    $expansionMatch = [regex]::Match($content, 'expansion:\s*[''"`](.*?)[''"`]')
    $setMatch = [regex]::Match($content, 'set:\s*[''"`](.*?)[''"`]')
    
    if ($idMatch.Success -and $nameMatch.Success) {
        $expansion = if ($expansionMatch.Success) { $expansionMatch.Groups[1].Value } else { if ($setMatch.Success) { $setMatch.Groups[1].Value } else { "N/A" } }
        $obj = New-Object PSObject -Property @{
            id = $idMatch.Groups[1].Value
            name = $nameMatch.Groups[1].Value
            expansion = $expansion
            file = $_.FullName
        }
        $results += $obj
    }
}

$results | ConvertTo-Json
