<?php
// Simple test endpoint to send a one-off SMS and return Twilio's response
header('Content-Type: application/json');

require_once __DIR__ . '/env.php';

$to   = $_GET['to']   ?? $_POST['to']   ?? null;
$body = $_GET['body'] ?? $_POST['body'] ?? 'Test SMS from birthdayReminder';

$sid   = env('TWILIO_ACCOUNT_SID', '');
$token = env('TWILIO_AUTH_TOKEN', '');
$from  = env('TWILIO_FROM_NUMBER', '');
$svc   = env('TWILIO_MESSAGING_SERVICE_SID', '');

if (empty($sid) || empty($token)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN']);
    exit;
}
if (!$to) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Provide ?to=+33XXXXXXXXX']);
    exit;
}

$data = [
    'To' => $to,
    'Body' => $body,
];
if (!empty($svc)) {
    $data['MessagingServiceSid'] = $svc;
} elseif (!empty($from)) {
    $data['From'] = $from;
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Set TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER']);
    exit;
}

$url = "https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json";

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query($data),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USERPWD => $sid . ':' . $token,
    CURLOPT_TIMEOUT => 20,
]);
$res = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

$twilio = json_decode($res, true);
echo json_encode([
    'ok' => $httpCode >= 200 && $httpCode < 300,
    'http_code' => $httpCode,
    'curl_error' => $curlErr ?: null,
    'twilio_sid' => $twilio['sid'] ?? null,
    'twilio_status' => $twilio['status'] ?? null,
    'error_code' => $twilio['error_code'] ?? null,
    'error_message' => $twilio['message'] ?? ($twilio['error_message'] ?? null),
    'raw' => $twilio,
], JSON_PRETTY_PRINT);
