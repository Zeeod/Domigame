# Roadmap : Moteur Dominion Professionnel (Actualisé)

Ce document détaille les tâches techniques pour élever le moteur au rang de produit professionnel (stabilité, performance, UX avancée).

## Phase 1 : Fondations et Performance (Complété)
*Objectif : Éliminer la dette technique et assurer une base solide.*

- [x] **Externalisation des Logs** (`GameLogStore`)
- [x] **Migration Immer** (Immutabilité totale du state)
- [x] **Sanitisation Réseau (Fog of War)** (`GameStateView`)
- [x] **Robustesse du Moteur** (Détection de boucles, transactions)

## Phase 2 : Intelligence Artificielle (Complété)
*Objectif : Fournir un challenge réel aux joueurs.*

- [x] **IA SmartBot (MCTS)**
    - [x] Implémentation de la recherche arborescente Monte Carlo.
    - [x] Budget de calcul de 300ms (ajustable).
    - [x] Utilisation du partage structurel d'Immer pour les simulations rapides.

## Phase 3 : Fonctionnalités Professionnelles (Complété)
*Objectif : Améliorer l'expérience utilisateur et la fiabilité réseau.*
 
- [x] **Gestion des Reconnexions & Synchronisation**
    - [x] Optimiser `StateSerializerV2` pour les états volumineux.
    - [x] Ajouter des numéros de séquence aux logs pour permettre un "catch-up" incrémental.
- [x] **Système de Timer Serveur**
    - [x] Temps limite par tour (ex: 60s).
    - [x] Auto-skip propre en cas de déconnexion prolongée ou timeout.
- [x] **Undo / Rewind "Intelligent"**
    - [x] Permettre un "Undo" immédiat pour les actions simples.
    - [x] Sécuriser les votes de Rewind pour éviter les abus.
- [x] **Statistiques en Temps Réel**
    - [x] Calculer les probabilités de pioche (Heuristique DeckEvaluator exposée).
    - [x] Affichage des cartes restantes dans le deck.

## Phase 4 : Finition et Publication (À venir)
- [ ] **Persistence Longue Durée** (Sauvegarde en DB pour reprise de partie).
- [ ] **Mode Spectateur Avancé** (Choix de la vue joueur à observer).
- [ ] **Audit de Conformité (Card Audit)** : Finaliser 100% des cartes Seaside/Prosperity.
