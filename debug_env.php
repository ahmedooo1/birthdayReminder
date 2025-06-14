<?php
require_once "config.php";

header("Content-Type: application/json");

$debug_info = [
    "env_file_exists" => file_exists(".env"),
    "birthday_api_key" => env("BIRTHDAY_REMINDER_API_KEY", "NOT_FOUND"),
    "mail_host" => env("MAIL_HOST", "NOT_FOUND"),
    "app_base_url" => env("APP_BASE_URL", "NOT_FOUND"),
    "timestamp" => date("Y-m-d H:i:s")
];

echo json_encode($debug_info, JSON_PRETTY_PRINT);
?>
