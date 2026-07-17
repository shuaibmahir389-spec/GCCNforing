$ProgressPreference = 'SilentlyContinue'
$port = 8000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Server started on http://localhost:$port/"
while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $url = $request.Url.LocalPath
        if ($url -eq "/api/sync") {
            $key = $request.QueryString["key"]
            $cloudUrls = @{
                "pdfs" = "https://extendsclass.com/api/json-storage/bin/acbabfb"
                "routine" = "https://extendsclass.com/api/json-storage/bin/eabbdff"
                "notices" = "https://extendsclass.com/api/json-storage/bin/dffaaee"
            }
            $targetUrl = $cloudUrls[$key]
            
            if ($null -eq $targetUrl) {
                $response.StatusCode = 400
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes('{"error": "Invalid key"}')
                $response.ContentType = "application/json"
                $response.ContentLength64 = $errBytes.Length
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            } elseif ($request.HttpMethod -eq "GET") {
                try {
                    $webRes = Invoke-WebRequest -UseBasicParsing -Uri $targetUrl -Method Get
                    $resStr = $webRes.Content
                    $resBytes = [System.Text.Encoding]::UTF8.GetBytes($resStr)
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.ContentLength64 = $resBytes.Length
                    $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
                } catch {
                    $response.StatusCode = 500
                    $errBytes = [System.Text.Encoding]::UTF8.GetBytes('{"error": "Proxy fetch failed"}')
                    $response.ContentType = "application/json"
                    $response.ContentLength64 = $errBytes.Length
                    $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                }
            } elseif ($request.HttpMethod -eq "POST" -or $request.HttpMethod -eq "PUT") {
                try {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                    $body = $reader.ReadToEnd()
                    $reader.Close()
                    $webRes = Invoke-WebRequest -UseBasicParsing -Uri $targetUrl -Method Put -Body $body -ContentType "application/json; charset=utf-8"
                    $resStr = $webRes.Content
                    $resBytes = [System.Text.Encoding]::UTF8.GetBytes($resStr)
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.ContentLength64 = $resBytes.Length
                    $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
                } catch {
                    # Safe check if response has been submitted
                    try {
                        $response.StatusCode = 500
                        $errObj = @{ error = "Proxy save failed"; message = $_.Exception.Message }
                        $resStr = $errObj | ConvertTo-Json -Compress
                        $errBytes = [System.Text.Encoding]::UTF8.GetBytes($resStr)
                        $response.ContentType = "application/json; charset=utf-8"
                        $response.ContentLength64 = $errBytes.Length
                        $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                    } catch {}
                }
            }
            $response.Close()
            continue
        }
        if ($url -eq "/") { $url = "/index.html" }
        
        # Clean up URL to relative path and join
        $relPath = $url.TrimStart('/')
        $filePath = [System.IO.Path]::Combine($pwd.Path, $relPath)
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            $ext = [System.IO.Path]::GetExtension($filePath)
            $contentType = "text/plain"
            if ($ext -eq ".html") { $contentType = "text/html; charset=utf-8" }
            elseif ($ext -eq ".css") { $contentType = "text/css" }
            elseif ($ext -eq ".js") { $contentType = "application/javascript" }
            elseif ($ext -eq ".pdf") { $contentType = "application/pdf" }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("File Not Found")
            $response.ContentLength64 = $errBytes.Length
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    } catch {
        Write-Host "Request processing error: $_"
        try { $response.Close() } catch {}
    }
}
$listener.Stop()
Write-Host "Server stopped."
