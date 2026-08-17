# Rapport d'Analyse : Comparaison Moteur vs Standard Pro
**Date:** 12 Février 2026
**Objet:** Audit technique du moteur Dominion actuel et roadmap vers une architecture professionnelle.

## 1. Résumé Exécutif
Le moteur actuel est **fonctionnel et riche en fonctionnalités**. Il supporte la majorité des cartes et des mécaniques complexes (Durée, Réactions, Événements). Cependant, pour atteindre un niveau "Professionnel" (robuste, évolutif, performant pour l'IA et le réseau), plusieurs refontes architecturales sont nécessaires.

**Note Globale Actuelle : B+**
*   *Logique de jeu :* A
*   *Architecture State :* B-
*   *Performance/Scalabilité :* C+
*   *Robustesse/Sécurité :* B

## 2. Analyse des Écarts (Gap Analysis)

### A. Gestion d'État (State Management)
*   **Actuel :** `GameState` est un gros objet JSON mutable. `cloneGameState` effectue une copie profonde (coûteuse) pour l'IA et les snapshots.
*   **Standard Pro :** État **Immuable** par défaut (via des librairies comme `Immer` ou `Immutable.js`). Cela permet :
    *   Des "undo/redo" gratuits (juste des pointeurs vers l'état précédent).
    *   Une détection de changement (change detection) performante pour l'UI (React/Vue).
    *   Des simulations IA beaucoup plus rapides (partage structurel de la mémoire).
*   **Action :** Migrer vers **Immer** pour les mutations d'état.

### B. Moteur d'Effets et Stack
*   **Actuel :** Une pile `effectStack` explicite. C'est le bon modèle pour Dominion.
*   **Standard Pro :**
    *   **Sécurité :** `processStack` a une limite simple de 1000 itérations. Il manque une détection de boucles infinies plus intelligente (ex: A déclenche B qui déclenche A).
    *   **Transactionnel :** Si une erreur survient au milieu d'une résolution, l'état reste "à moitié modifié". Un moteur pro utiliserait des transactions atomiques (tout ou rien).

### C. Gestion des Durées (Duration Cards)
*   **Actuel :** `DurationTracker` est séparé de la `ZoneManager`. La logique de nettoyage (`cleanup`) est fragile et les conditions (`CONDITIONAL`) sont marquées `TODO`.
*   **Standard Pro :** Le cycle de vie d'une carte (En jeu -> Durée -> Défausse) doit être géré par un système unifié qui garantit la cohérence entre la zone physique (`playArea`) et le statut logique (`isDuration`).
*   **Action :** Unifier `DurationTracker` et `TurnMachine` pour gérer les conditions complexes (ex: *Enchantress*, *Highway*).

### D. Networking et "Fog of War"
*   **Actuel :** Le `GameState` complet semble être passé partout. Le filtrage des informations privées (main adverse, deck) est fait au moment de l'affichage ou par des logs.
*   **Standard Pro :** Une couche de **Vue (View Layer)** stricte qui génère un état "sanitisé" pour chaque client *avant* l'envoi réseau. Le client ne doit *jamais* recevoir les données de la main adverse, même si l'UI les cache.
*   **Action :** Créer une classe `GameStateView` qui filtre l'état selon le `playerId`.

### E. Logs et Historique
*   **Actuel :** Les logs (`state.logs`, `state.history`) sont stockés *dans* l'objet `GameState`.
*   **Problème :** L'état grossit indéfiniment à chaque action. Cela ralentit le clonage et consomme de la mémoire inutilement pour l'IA.
*   **Standard Pro :** Les logs sont un flux séparé (Side Effect). L'état ne contient que le nécessaire pour *calculer* le coup suivant.
*   **Action :** Externaliser l'historique hors du `GameState` critique.

## 3. Roadmap de Professionnalisation

Voici les étapes recommandées pour passer au niveau supérieur :

### Phase 1 : Cœur et Performance (Priorité Haute)
1.  **Optimiser le State :** Sortir `logs`, `history` et `snapshots` de l'objet `GameState` (les stocker dans un `GameStore` externe).
2.  **Immutabilité :** Envisager l'adoption de structures immuables pour certaines parties critiques (Main, Deck, Supply) pour accélérer le clonage.

### Phase 2 : Robustesse
3.  **Refonte Durations :** Implémenter la logique conditionnelle complète pour les cartes Durée.
4.  **Transactions :** Ajouter un `try/catch` global dans `ActionResolver` qui restaure l'état précédent en cas de crash.

### Phase 3 : Architecture Réseau
5.  **View Layer :** Implémenter `createPlayerView(state, playerId)` qui retourne un état partiel sécurisé.
6.  **Séparation Serveur/Client :** S'assurer que le code du moteur (`ActionResolver`) est purement "Server-Side" ou "Shared", et que le Client ne fait que de l'affichage "bête".

## 4. Conclusion
Votre moteur est solide pour un projet de développement. Pour en faire un produit commercial ou open-source de référence ("Pro"), l'accent doit maintenant être mis sur **l'architecture des données** (Immutabilité, Séparation State/Logs) plutôt que sur l'ajout de nouvelles cartes.
