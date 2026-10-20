# Plan d'Action : Parité Dominion Steam

Ce plan détaille les étapes nécessaires pour amener ce projet au niveau d'excellence et de complétude de la version officielle sur Steam.

## Phase 1 : Consolidation du Moteur (Infrastructure)
> [!IMPORTANT]
> Le `EffectEngine.ts` actuel est un monolithe. Pour supporter la complexité des dernières extensions, une modularisation est impérative.

- **Modularisation de l'EffectEngine** : 
    - *Stratégie* : Extraire les handlers d'effets dans des classes dédiées (ex: `ZoneEffectHandler`, `EconomicEffectHandler`, `AttackEffectHandler`).
    - *Bénéfice* : Réduire `EffectEngine.ts` à un orchestrateur de flux d'effets, facilitant les tests unitaires isolés.
    - *Extension* : Créer un `ExpansionEffectRegistry` pour enregistrer dynamiquement des effets spécifiques à certaines extensions (ex: "Debt" pour Empires) sans polluer le moteur de base.
- **Système de "Mats" Générique** : Créer une structure flexible dans `PlayerState` pour gérer tous les types de plateaux secondaires (Village Indigène, Île, Taverne, Exil).
- **Standardisation des Jetons** : Unifier la gestion des Jetons PV, Pièces (Coffers), Villageois, et Faveurs.

## Phase 2 : Parité des Mécaniques de Jeu
Implémenter les systèmes manquants qui font la richesse des versions modernes :
- **Alliés & Faveurs** : Support des cartes de Liaison et de la ressource "Faveur".
- **Plunder & Traits** : Implémenter les "Traits" qui modifient les piles du Royaume.
- **Rising Sun & Prophéties** : Gérer les conditions de déclenchement différées et les événements mondiaux.

## Phase 3 : Intelligence Artificielle & Solo
Steam est réputé pour son IA "Hard".
- **Moteur de Décision** : Passer d'un bot purement aléatoire à un bot basé sur des priorités (Buy List) et des heuristiques de deck-building.
- **Simulation Monte-Carlo (Optionnel)** : Pour une IA de niveau tournoi.
- **Mode Campagne / Défis** : Créer des scénarios fixes (Daily Challenges) comme sur Steam.

## Phase 4 : Expérience Utilisateur (UX) & Visuels
Pour égaler le "feeling" premium de Steam :
- **Animations de Transition** : Micro-animations lors du passage de la main à l'aire de jeu (GSAP ou Framer Motion).
- **Log de Jeu Visuel** : Un historique plus lisible avec des icônes pour chaque action.
- **Zoom & Inspection** : Améliorer la vue détaillée des cartes avec les erratas et clarifications de règles intégrées.

## Phase 5 : Écosystème Multiplayer
- **Système de Matchmaking** : Utiliser des serveurs de signalisation pour des parties classées (ELO).
- **Gestion de Profil** : Statistiques de victoires, deck favori, temps de jeu.

---

## Roadmap Estimée
| Milestone | Focus | Durée Est. |
| :--- | :--- | :--- |
| **M1** | Refactorisation & Mats | 2 semaines |
| **M2** | Expansions "Allies" & "Plunder" | 3 semaines |
| **M3** | IA Avancée & Défis | 2 semaines |
| **M4** | Polish UI & Animations | 2 semaines |
