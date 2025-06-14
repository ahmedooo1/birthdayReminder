<?php
require_once 'api/config.php';
require_once 'api/utils.php';

echo "=== TEST DU SYSTÈME DE RAPPELS D'ANNIVERSAIRE ===\n\n";

// Créer un anniversaire pour aujourd'hui et demain pour test
$today = date('Y-m-d');
$tomorrow = date('Y-m-d', strtotime('+1 day'));
$in3days = date('Y-m-d', strtotime('+3 days'));

echo "Dates de test :\n";
echo "- Aujourd'hui : $today\n";
echo "- Demain : $tomorrow\n";
echo "- Dans 3 jours : $in3days\n\n";

try {
    // Vérifier les utilisateurs et leurs paramètres
    echo "=== UTILISATEURS ET PARAMÈTRES ===\n";
    $stmt = $pdo->query("
        SELECT id, username, email, email_notifications, notification_days, first_name, last_name
        FROM users 
        WHERE email_notifications = 1
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($users as $user) {
        echo "Utilisateur: {$user['username']}\n";
        echo "  - Email: {$user['email']}\n";
        echo "  - Notifications: " . ($user['email_notifications'] ? 'OUI' : 'NON') . "\n";
        echo "  - Jours d'avance: {$user['notification_days']}\n";
        echo "  - Nom complet: {$user['first_name']} {$user['last_name']}\n\n";
    }
    
    // Vérifier les anniversaires existants
    echo "\n=== ANNIVERSAIRES EXISTANTS ===\n";
    $stmt = $pdo->query("SELECT id, name, date, group_id FROM birthdays ORDER BY date");
    $birthdays = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($birthdays as $birthday) {
        $daysUntil = daysUntilNextBirthday($birthday['date']);
        echo "Anniversaire: {$birthday['name']}\n";
        echo "  - Date: {$birthday['date']}\n";
        echo "  - Jours restants: $daysUntil\n";
        echo "  - Groupe ID: {$birthday['group_id']}\n\n";
    }
    
    // Créer un anniversaire de test pour demain
    echo "\n=== CRÉATION D'UN ANNIVERSAIRE DE TEST ===\n";
    $testBirthdayId = uniqid();
    $groupId = null;
    
    // Trouver un groupe existant
    $stmt = $pdo->query("SELECT id FROM groupes LIMIT 1");
    $group = $stmt->fetch();
    if ($group) {
        $groupId = $group['id'];
    }
    
    if ($groupId) {
        $stmt = $pdo->prepare("
            INSERT INTO birthdays (id, name, date, group_id, created_by, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $testBirthdayId,
            'Test Anniversaire Demain',
            $tomorrow,
            $groupId,
            $users[0]['id'] ?? 'admin_demo',
            'Anniversaire de test créé automatiquement'
        ]);
        
        echo "✅ Anniversaire de test créé pour demain ($tomorrow)\n";
        echo "   - ID: $testBirthdayId\n";
        echo "   - Groupe: $groupId\n\n";
    } else {
        echo "❌ Aucun groupe trouvé pour créer l'anniversaire de test\n\n";
    }
    
    // Tester le script de rappel
    echo "\n=== TEST DU SCRIPT DE RAPPEL ===\n";
    echo "Exécution du script cron_send_email_reminders.php...\n\n";
    
    ob_start();
    include 'api/cron_send_email_reminders.php';
    $output = ob_get_clean();
    
    echo $output;
    
    // Nettoyer l'anniversaire de test
    if (isset($testBirthdayId)) {
        echo "\n=== NETTOYAGE ===\n";
        $stmt = $pdo->prepare("DELETE FROM birthdays WHERE id = ?");
        $stmt->execute([$testBirthdayId]);
        echo "✅ Anniversaire de test supprimé\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

echo "\n=== FIN DU TEST ===\n";
?>
