<?php
// Simple router for development server
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Remove query string for routing
$route = strtok($path, '?');

// API routes
if (strpos($route, '/api/') === 0) {
    $apiFile = __DIR__ . $route;
    if (file_exists($apiFile)) {
        include $apiFile;
        return;
    }
}

// Frontend routes
if (strpos($route, '/front/') === 0) {
    $frontFile = __DIR__ . $route;
    if (file_exists($frontFile)) {
        return false; // Let PHP serve the file
    }
}

// Default route - serve index.html for root
if ($route === '/' || $route === '') {
    $indexFile = __DIR__ . '/front/index.html';
    if (file_exists($indexFile)) {
        header('Content-Type: text/html');
        readfile($indexFile);
        return;
    }
}

// File not found
http_response_code(404);
echo "File not found: " . $route;
?>
