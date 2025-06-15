<?php
/**
 * Fix Group Deletion Issue
 * 
 * This script fixes the database schema to allow birthdays to have nullable group_id
 * so that when groups are deleted, birthdays can be preserved without group association.
 */

require_once 'config.php';

try {
    echo "🔧 Fixing group deletion issue...\n\n";
    
    // Check current database type
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    echo "📊 Database driver: $driver\n";
    
    if ($driver === 'sqlite') {
        echo "🔧 Fixing SQLite schema...\n";
        
        // For SQLite, we need to recreate the table since ALTER COLUMN is not fully supported
        $pdo->beginTransaction();
        
        try {
            // Create a new table with the correct schema
            $pdo->exec("CREATE TABLE birthdays_new (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                date DATE NOT NULL,
                group_id TEXT,
                created_by TEXT NOT NULL,
                notes TEXT,
                notification_sent INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES groupes(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            )");
            
            // Copy data from old table
            $pdo->exec("INSERT INTO birthdays_new SELECT * FROM birthdays");
            
            // Drop old table
            $pdo->exec("DROP TABLE birthdays");
            
            // Rename new table
            $pdo->exec("ALTER TABLE birthdays_new RENAME TO birthdays");
            
            $pdo->commit();
            echo "✅ SQLite schema updated successfully!\n";
            
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        
    } elseif ($driver === 'mysql') {
        echo "🔧 Fixing MySQL schema...\n";
        
        // For MySQL, we can use ALTER TABLE
        $pdo->exec("ALTER TABLE birthdays MODIFY COLUMN group_id VARCHAR(50) NULL");
        $pdo->exec("ALTER TABLE birthdays DROP FOREIGN KEY birthdays_ibfk_1");
        $pdo->exec("ALTER TABLE birthdays ADD CONSTRAINT birthdays_ibfk_1 
                   FOREIGN KEY (group_id) REFERENCES groupes(id) ON DELETE SET NULL");
        
        echo "✅ MySQL schema updated successfully!\n";
    }
    
    echo "\n🎉 Database schema fixed! Groups can now be deleted without losing birthdays.\n";
    echo "📝 Birthdays will have their group_id set to NULL when their group is deleted.\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
