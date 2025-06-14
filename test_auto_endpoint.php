<?php
// Test de l'endpoint auto_birthday_reminders.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Test de l'endpoint automatique...\n";
$_GET['api_key'] = 'bd_12345_auto_reminder_secret_key_change_this';
include 'api/auto_birthday_reminders.php';
?>
