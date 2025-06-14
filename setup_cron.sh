#!/bin/bash
# Script pour configurer le CRON job automatique pour les rappels d'anniversaire

# Ajouter une ligne CRON pour exécuter le script tous les jours à 08h00
echo "Configuration du CRON job pour les rappels d'anniversaire..."

# Commande CRON : tous les jours à 8h00
CRON_COMMAND="0 8 * * * /usr/bin/php /path/to/your/project/api/cron_send_email_reminders.php >> /var/log/birthday_reminders.log 2>&1"

# Ajouter au crontab
(crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -

echo "✅ CRON job configuré !"
echo "Les rappels d'anniversaire seront envoyés automatiquement tous les jours à 8h00"
echo "Logs disponibles dans : /var/log/birthday_reminders.log"

# Afficher le crontab actuel
echo ""
echo "CRON jobs actuels :"
crontab -l
