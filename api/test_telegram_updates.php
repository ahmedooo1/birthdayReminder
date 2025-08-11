<?php
// Fetch Telegram updates to discover the correct chat.id after you message the bot
header('Content-Type: application/json');

$token  = $_GET['token']   ?? $_POST['token']   ?? null;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : null; // optional

if (!$token) {
    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'error' => 'Provide token, e.g. ?token=123:ABC'
    ], JSON_PRETTY_PRINT);
    exit;
}

$url = "https://api.telegram.org/bot{$token}/getUpdates";
if ($offset !== null) {
    $url .= '?offset=' . $offset;
}

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
]);
$res = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

$json = json_decode($res, true);

// Extract a friendly summary of chats found
$chats = [];
if (isset($json['ok']) && $json['ok'] && isset($json['result'])) {
    foreach ($json['result'] as $update) {
        $message = $update['message'] ?? $update['channel_post'] ?? null;
        if ($message && isset($message['chat'])) {
            $chat = $message['chat'];
            $chats[] = [
                'update_id' => $update['update_id'] ?? null,
                'chat_id' => $chat['id'] ?? null,
                'type' => $chat['type'] ?? null,
                'title_or_name' => $chat['title'] ?? trim(($chat['first_name'] ?? '') . ' ' . ($chat['last_name'] ?? '')),
                'username' => $chat['username'] ?? null,
                'last_text' => $message['text'] ?? null,
            ];
        }
    }
}

echo json_encode([
    'ok' => $httpCode === 200 && ($json['ok'] ?? false) === true,
    'http_code' => $httpCode,
    'curl_error' => $curlErr ?: null,
    'raw' => $json,
    'chats' => $chats,
    'hint' => 'Open your bot in Telegram and send any message to it, then reload this endpoint. Use the chat_id shown here for test_telegram.php.'
], JSON_PRETTY_PRINT);
