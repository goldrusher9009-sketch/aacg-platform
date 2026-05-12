<?php
/**
 * IronForge Platform Proxy
 * Place this at: public_html/platform/index.php on HostGator
 * Serves allamericancg.com/platform -> web-production-b2192.up.railway.app
 */

$railway_base = 'https://web-production-b2192.up.railway.app';

// Get the requested path after /platform
$request_uri = $_SERVER['REQUEST_URI'];
$platform_pos = strpos($request_uri, '/platform');
if ($platform_pos !== false) {
    $path = substr($request_uri, $platform_pos + strlen('/platform'));
} else {
    $path = '/';
}

if (empty($path)) $path = '/';

// For the root, redirect to admin
if ($path === '/' || $path === '') {
    $path = '/admin/index.html';
}

$target_url = $railway_base . $path;

// For HTML/JS/CSS asset requests - proxy them
$ext = strtolower(pathinfo(parse_url($path, PHP_URL_PATH), PATHINFO_EXTENSION));

if (in_array($ext, ['js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'ico', 'svg', 'woff', 'woff2', 'ttf'])) {
    // Proxy the asset
    $content = @file_get_contents($target_url);
    if ($content !== false) {
        $mime_map = [
            'js' => 'application/javascript',
            'css' => 'text/css',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'ico' => 'image/x-icon',
            'svg' => 'image/svg+xml',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf',
        ];
        header('Content-Type: ' . ($mime_map[$ext] ?? 'application/octet-stream'));
        echo $content;
        exit;
    }
}

// For HTML pages - redirect directly to Railway (avoids proxy complexity)
header('Location: ' . $target_url, true, 302);
exit;
