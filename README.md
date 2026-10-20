# Dominion JS

Implémentation multijoueur en ligne du jeu de cartes Dominion (22 extensions), en TypeScript.
Le serveur fait autorité : toute la logique de jeu tourne côté serveur, le client React ne fait qu'afficher.

> Pour le détail de l'architecture et des conventions, lire [CONTEXT.md](CONTEXT.md).

## Démarrage rapide

Prérequis : Node.js 18+

```bash
npm install

npm run start   # Serveur de jeu (port 3005)
npm run dev     # Client Vite (port 3000), dans un 2e terminal
```

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Client en développement (port 3000, proxy vers le serveur) |
| `npm run start` | Serveur de jeu (port 3005) |
| `npm run build` | Build de production du client dans `dist/` |
| `npm run check-types` | Vérification TypeScript (client, serveur, moteur, tests) |
| `npm test` | Tous les tests Vitest |
| `npx vitest run tests/cards` | Les tests d'un seul dossier |
| `docker compose up -d --build` | Déploiement Docker (voir `docs/deployment/`) |

## Structure

```
client/        Frontend React (composants, hooks, contextes, styles)
server/        Backend Express + Socket.IO (salles, sérialisation, SQLite)
shared/        Moteur de jeu partagé
  engine/        Cœur du moteur (effets, phases, règles, économie)
  cards/         Définitions déclaratives des cartes, par extension
  bot/           IA (RandomBot, GreedyBot, SmartBot MCTS)
  types/, view/  Types et vue publique envoyée aux clients
tests/         Tous les tests
  engine/        Moteur
  cards/         Cartes par extension (+ validation/ par set)
  bot/           IA
  integration/   Parties complètes (stabilité, stress)
  regression/    Reproductions de bugs
  client/        Composants React
  helpers/       TestEngine et outils de test
scripts/       Outils hors jeu (tools/, audit/, debug/)
docs/          Roadmaps, rapports d'audit, déploiement, règles PDF
logs/          Sorties des tests et scripts (ignoré par git)
data/          Base SQLite (ignorée par git, créée au démarrage)
```

## Ajouter une carte

1. Créer la définition dans `shared/cards/<extension>/` (effets déclaratifs, pas de logique impérative).
2. L'enregistrer dans le registre de l'extension.
3. Ajouter un test dans `tests/cards/`.

## Avancement

Voir [docs/roadmap/ProEngineRoadmap.md](docs/roadmap/ProEngineRoadmap.md).

## Licence

MIT
