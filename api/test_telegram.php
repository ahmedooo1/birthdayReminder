<?php
// Simple endpoint to test Telegram delivery and show raw API response
header('Content-Type: application/json');

$token  = $_GET['token']   ?? $_POST['token']   ?? null;
$chatId = $_GET['chat_id'] ?? $_POST['chat_id'] ?? null;
$text   = $_GET['text']    ?? $_POST['text']    ?? "Test Telegram depuis birthdayReminder";

if (!$token || !$chatId) {
    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'error' => 'Provide token and chat_id, e.g. ?token=123:ABC&chat_id=123456789&text=Hello'
    ], JSON_PRETTY_PRINT);
    exit;
}

$url = "https://api.telegram.org/bot{$token}/sendMessage";
$data = [
    'chat_id' => $chatId,
    'text' => $text,
    'parse_mode' => 'HTML'
];

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query($data),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
]);
$res = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

$json = json_decode($res, true);

echo json_encode([
    'ok' => $httpCode === 200 && ($json['ok'] ?? false) === true,
    'http_code' => $httpCode,
    'curl_error' => $curlErr ?: null,
    'telegram_ok' => $json['ok'] ?? null,
    'telegram_description' => $json['description'] ?? null,
    'raw' => $json,
], JSON_PRETTY_PRINT);
