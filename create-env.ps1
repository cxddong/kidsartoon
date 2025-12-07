# 创建 .env 文件的 PowerShell 脚本

Write-Host "=== 创建 .env 文件 ===" -ForegroundColor Cyan

$envPath = Join-Path $PSScriptRoot ".env"

# 检查文件是否已存在
if (Test-Path $envPath) {
    Write-Host "`.env 文件已存在！" -ForegroundColor Yellow
    $overwrite = Read-Host "是否要覆盖? (y/n)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "已取消操作" -ForegroundColor Red
        exit
    }
    Copy-Item $envPath "$envPath.backup" -ErrorAction SilentlyContinue
    Write-Host "已备份原文件为 .env.backup" -ForegroundColor Gray
}

# 生成随机 API Key
$timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
$randomPart = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
$apiKey = "kat_$timestamp" + "_$randomPart"

Write-Host "`n生成的 API Key: $apiKey" -ForegroundColor Green
Write-Host "⚠️  请妥善保管这个 API Key！" -ForegroundColor Yellow

# 创建 .env 文件内容
$envContent = @"
# Kids Art Tales API 配置文件
# 自动生成时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# API Key 配置
# 这是自动生成的 API Key，请妥善保管
API_KEY=$apiKey

# 服务器端口
PORT=3000

# 第三方 API Keys (可选)
# 如果集成第三方服务，在这里配置
# OPENAI_API_KEY=your-openai-api-key
# STABILITY_AI_API_KEY=your-stability-api-key
# ELEVENLABS_API_KEY=your-elevenlabs-api-key
"@

# 写入文件
try {
    $envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline
    Write-Host "`n✓ .env 文件已成功创建！" -ForegroundColor Green
    Write-Host "文件位置: $envPath" -ForegroundColor Cyan
    
    Write-Host "`n=== 文件内容 ===" -ForegroundColor Yellow
    Get-Content $envPath | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    
    Write-Host "`n=== 下一步操作 ===" -ForegroundColor Cyan
    Write-Host "1. 重启服务器以应用新的 API Key" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor Gray
    Write-Host "`n2. 验证 API Key 是否生效" -ForegroundColor White
    Write-Host "   在浏览器 Console 中运行：" -ForegroundColor Gray
    Write-Host "   fetch('/api/api-keys/validate', {" -ForegroundColor Gray
    Write-Host "     headers: { 'X-API-Key': '$apiKey' }" -ForegroundColor Gray
    Write-Host "   }).then(res => res.json()).then(console.log)" -ForegroundColor Gray
    Write-Host "`n3. 在前端设置 API Key" -ForegroundColor White
    Write-Host "   在浏览器 Console 中运行：" -ForegroundColor Gray
    Write-Host "   localStorage.setItem('apiKey', '$apiKey')" -ForegroundColor Gray
    
    Write-Host "`n⚠️  重要提示:" -ForegroundColor Yellow
    Write-Host "  - 请妥善保管这个 API Key，不要分享给他人" -ForegroundColor White
    Write-Host "  - .env 文件已添加到 .gitignore，不会提交到 Git" -ForegroundColor White
    Write-Host "  - 如果需要，可以手动编辑 .env 文件修改配置" -ForegroundColor White
    
} catch {
    Write-Host "`n✗ 创建 .env 文件失败: $_" -ForegroundColor Red
    Write-Host "`n请手动创建 .env 文件，内容如下：" -ForegroundColor Yellow
    Write-Host $envContent -ForegroundColor Gray
}

Write-Host "`n"

