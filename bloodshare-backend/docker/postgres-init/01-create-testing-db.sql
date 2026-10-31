-- Base séparée pour `php artisan test` (voir phpunit.xml) : RefreshDatabase vide et
-- remigre la base qu'on lui donne à chaque lancement de la suite. Sans cette base
-- dédiée, les tests tournent contre la vraie base de dev et la vident.
-- Ce script ne s'exécute qu'au PREMIER démarrage du conteneur (volume Postgres vide) —
-- voir DEVOPS.md pour la commande à lancer si le volume existe déjà.
CREATE DATABASE bloodshare_testing;
