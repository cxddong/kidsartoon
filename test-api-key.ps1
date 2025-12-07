# API Key 功能测试脚本

Write-Host "`n=== API Key 功能测试 ===`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$apiKey = "dev-key-12345"

# 测试 1: 健康检查（不需要 API Key）
Write-Host "1. 测试健康检查..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET
    Write-Host "   ✓ 健康检查成功: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   响应: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ 健康检查失败: $_" -ForegroundColor Red
}

# 测试 2: 验证 API Key
Write-Host "`n2. 测试 API Key 验证..." -ForegroundColor Yellow
try {
    $headers = @{
        "X-API-Key" = $apiKey
    }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/api-keys/validate" -Method GET -Headers $headers
    Write-Host "   ✓ API Key 验证成功: $($response.StatusCode)" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host "   响应: $($json | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ API Key 验证失败: $_" -ForegroundColor Red
}

# 测试 3: 获取当前 API Key 信息
Write-Host "`n3. 测试获取 API Key 信息..." -ForegroundColor Yellow
try {
    $headers = @{
        "X-API-Key" = $apiKey
    }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/api-keys/current" -Method GET -Headers $headers
    Write-Host "   ✓ 获取 API Key 信息成功: $($response.StatusCode)" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host "   API Key 名称: $($json.name)" -ForegroundColor Gray
    Write-Host "   请求次数: $($json.requestsCount)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ 获取 API Key 信息失败: $_" -ForegroundColor Red
}

# 测试 4: 生成新的 API Key
Write-Host "`n4. 测试生成新的 API Key..." -ForegroundColor Yellow
try {
    $headers = @{
        "X-API-Key" = $apiKey
        "Content-Type" = "application/json"
    }
    $body = @{
        name = "Test API Key $(Get-Date -Format 'yyyyMMddHHmmss')"
        userId = "test-user-123"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/api-keys" -Method POST -Headers $headers -Body $body
    Write-Host "   ✓ 生成 API Key 成功: $($response.StatusCode)" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host "   新 API Key: $($json.apiKey)" -ForegroundColor Green
    Write-Host "   警告: $($json.warning)" -ForegroundColor Yellow
    $newApiKey = $json.apiKey
} catch {
    Write-Host "   ✗ 生成 API Key 失败: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   错误响应: $responseBody" -ForegroundColor Red
    }
}

# 测试 5: 使用 Authorization Bearer
Write-Host "`n5. 测试 Authorization Bearer..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $apiKey"
    }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/api-keys/validate" -Method GET -Headers $headers
    Write-Host "   ✓ Authorization Bearer 成功: $($response.StatusCode)" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host "   响应: $($json | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Authorization Bearer 失败: $_" -ForegroundColor Red
}

# 测试 6: 测试无效的 API Key
Write-Host "`n6. 测试无效的 API Key..." -ForegroundColor Yellow
try {
    $headers = @{
        "X-API-Key" = "invalid-key-12345"
    }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/api-keys/validate" -Method GET -Headers $headers
    Write-Host "   ✗ 应该返回 401，但返回了: $($response.StatusCode)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✓ 正确拒绝了无效的 API Key (401)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ 意外的错误: $_" -ForegroundColor Red
    }
}

# 测试 7: 测试没有 API Key 的请求（应该被拒绝）
Write-Host "`n7. 测试没有 API Key 的请求..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/api-keys/current" -Method GET
    Write-Host "   ✗ 应该返回 401，但返回了: $($response.StatusCode)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✓ 正确拒绝了没有 API Key 的请求 (401)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ 意外的错误: $_" -ForegroundColor Red
    }
}

Write-Host "`n=== 测试完成 ===`n" -ForegroundColor Cyan
Write-Host "提示: 确保服务器正在运行 (npm run dev)" -ForegroundColor Yellow

