<?php
require_once 'config.php';

try {
    // Check if the column exists
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Users table columns:\n";
    foreach ($columns as $column) {
        echo "- " . $column['Field'] . " (" . $column['Type'] . ")\n";
    }
    
    // Specifically check for system_notifications_enabled
    $found = false;
    foreach ($columns as $column) {
        if ($column['Field'] === 'system_notifications_enabled') {
            $found = true;
            break;
        }
    }
    
    if ($found) {
        echo "\n✅ Column 'system_notifications_enabled' EXISTS\n";
    } else {
        echo "\n❌ Column 'system_notifications_enabled' DOES NOT EXIST\n";
        echo "\nTrying to add the column...\n";
        
        // Try to add the column
        $pdo->exec("ALTER TABLE users ADD COLUMN system_notifications_enabled TINYINT(1) DEFAULT 1");
        echo "✅ Column added successfully!\n";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
