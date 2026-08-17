# CONTEXT.md — Dominion JS : Guide complet pour IA locale

> Ce fichier est le contexte principal pour l'IA de développement.
> Il décrit l'architecture, les patterns, les conventions et les points clés du projet.
> **Lis ce fichier en priorité avant de modifier quoi que ce soit.**

---

## 1. VUE D'ENSEMBLE DU PROJET

**Dominion JS** est une implémentation complète du jeu de cartes Dominion (+ toutes ses extensions) en ligne multijoueur.

- **Frontend** : React 19 + Vite + TypeScript (CSS Vanilla, pas de Tailwind)
- **Backend** : Node.js + Express 5 + Socket.IO (WebSockets temps-réel)
- **Moteur de jeu** : TypeScript pur dans `shared/`, 100% déterministe et sans effets de bord
- **Tests** : Vitest — 251 tests, 100% verts
- **Déploiement** : Docker multi-stage, port 3005, servi sur `dominion.zeeod.fr`
- **Langage** : Interface et logs en **français**

### Extensions implémentées (22 au total)
Base, Intrigue, Seaside, Alchemy, Prosperity, Cornucopia, Hinterlands, Dark Ages,
Guilds, Adventures, Empires, Nocturne, Renaissance, Menagerie, Allies, Plunder,
Rising Sun, Promos + Landscapes (Events, Projects, Landmarks, Traits, Ways)

---

## 2. STRUCTURE DES DOSSIERS

```
dominion/
├── client/               # Frontend React (Vite)
│   ├── components/       # Composants React (CardFrame, BoardLayout, SupplyGrid, ActionBar...)
│   ├── context/          # React Contexts (GameAnimations, HoverCard, Sound...)
│   ├── hooks/            # Hooks custom (useSocket, useGameState...)
│   └── AppV2.tsx         # App principale
├── server/               # Backend Node.js
│   ├── index.ts          # Point d'entrée Express + Socket.IO
│   ├── SocketHandler.ts  # Gestion des événements WebSocket
│   ├── GameRoomV2.ts     # Logique de salle multijoueur (700+ lignes)
│   ├── RoomManager.ts    # Gestion des salles actives
│   ├── StateSerializerV2.ts  # Sérialisation du GameState → client
│   └── Database.ts       # SQLite (better-sqlite3) — stats & classement
├── shared/               # Code partagé server+client
│   ├── engine/           # COEUR DU JEU — ne jamais toucher sans comprendre
│   │   ├── GameState.ts          # Types principaux (GameState, PlayerState...)
│   │   ├── EffectEngine.ts       # Moteur d'effets — pile récursive
│   │   ├── ActionResolver.ts     # Résolution des actions joueur
│   │   ├── PhaseEngine.ts        # Machine à phases (ACTION→BUY→NIGHT→CLEANUP)
│   │   ├── EventBus.ts           # Système d'événements (ON_GAIN, ON_BUY...)
│   │   ├── DurationManager.ts    # Cartes durée (Orange) — multi-tours
│   │   ├── registerCoreEffects.ts# Tous les handlers d'effets (1100+ lignes)
│   │   ├── EffectUtils.ts        # Utilitaires (draw, discard, trash, shuffle...)
│   │   ├── EconomyEngine.ts      # Calcul des couts (réductions, dettes...)
│   │   ├── RulesValidator.ts     # Validation des règles avant action
│   │   ├── SupplyGenerator.ts    # Génération de la réserve (supply)
│   │   ├── VictoryChecker.ts     # Calcul des PV et fin de partie
│   │   └── effects/              # Handlers d'effets par catégorie
│   │       ├── BasicEffectHandler.ts     # ADD_MONEY, ADD_ACTIONS, ADD_BUYS...
│   │       ├── DrawEffectHandler.ts      # DRAW, DRAW_UP_TO, REVEAL...
│   │       ├── GainEffectHandler.ts      # GAIN, GAIN_TO_HAND, GAIN_UP_TO...
│   │       ├── TrashEffectHandler.ts     # TRASH, TRASH_FROM_HAND...
│   │       ├── ZoneEffectHandler.ts      # MOVE_CARD, TRASH_SELF, EXILE...
│   │       ├── ChoiceEffectHandler.ts    # CHOOSE_CARDS, SELECT_OPTION...
│   │       ├── ConditionEffectHandler.ts # CONDITION (évaluation de conditions)
│   │       ├── AttackEffectHandler.ts    # Attaques, réactions (Moat...)
│   │       ├── CleanupEffectHandler.ts   # Phase de nettoyage
│   │       └── TriggerEffectHandler.ts   # ON_GAIN, ON_PLAY triggers
│   ├── cards/            # Définitions déclaratives de toutes les cartes
│   │   ├── index.ts      # CardRegistry — registre central
│   │   ├── base/         # Village, Market, Witch...
│   │   ├── intrigue/     # Nobles, Schemers...
│   │   ├── empires/      # Gathering, Debt cards (Marché Fermier...)
│   │   ├── nocturne/     # Night cards, Boons, Hexes...
│   │   └── ...           # (toutes les extensions)
│   ├── types/            # Types TypeScript (EffectDefinition, CardDefinition...)
│   └── view/             # Types de vue publique (PublicGameView)
├── style.css             # CSS global principal (50KB)
├── Dockerfile            # Multi-stage build
├── docker-compose.yml    # Config déploiement (port 3005)
└── tsconfig.json         # TypeScript strict
```

---

## 3. ARCHITECTURE DU MOTEUR DE JEU

### 3.1 GameState — État central

```typescript
interface GameState {
    phase: 'PREGAME' | 'ACTION' | 'BUY' | 'NIGHT' | 'CLEANUP' | 'GAMEOVER';
    players: PlayerState[];
    currentPlayerIndex: number;
    supply: Record<string, SupplyPile>;
    nonSupply: Record<string, SupplyPile>;
    landscapeState: Record<string, { tokens: Record<string, number>; state: any }>;
    effectStack: EffectStackItem[];
    pendingDecision: Decision | null;
    trash: CardInstance[];
    landscapes: string[];
    lastGainedCard?: CardInstance;
    lastTrashedCard?: CardInstance;
    lastDecisionResults?: { cards?: CardInstance[]; option?: string };
}

interface PlayerState {
    id: string;
    name: string;
    hand: CardInstance[];
    deck: CardInstance[];
    discardPile: CardInstance[];
    playArea: CardInstance[];
    actions: number;
    buys: number;
    coins: number;
    vpTokens: number;
    tokens: Record<string, number>;  // debt, coffers, villagers, favors...
    exileMat: CardInstance[];
}

interface SupplyPile {
    cardId: string;
    count: number;
    cards: CardInstance[];
    tokens?: Record<string, number>;  // ex: { vp: 3 } pour Marché Fermier
    isMixed?: boolean;
    traits?: string[];
}
```

### 3.2 CardDefinition — Définition déclarative d'une carte

```typescript
interface CardDefinition {
    id: string;           // snake_case unique (ex: 'village', 'farmers_market')
    name: string;         // Nom en français (ex: 'Village')
    cost: number | { coin?: number; debt?: number; potion?: boolean };
    types: CardType[];    // ['ACTION'], ['ACTION', 'ATTACK'], etc.
    effects: EffectDefinition[];
    onGain?: EffectDefinition[];
    onTrash?: EffectDefinition[];
    onBuy?: EffectDefinition[];
    onDiscard?: EffectDefinition[];
    durationEffects?: EffectDefinition[];  // Effets orange au prochain tour
    nightEffects?: EffectDefinition[];     // Effets de nuit (Nocturne)
    set: string;
    isLandscape?: boolean;
}

type CardType = 'ACTION' | 'TREASURE' | 'VICTORY' | 'CURSE' | 'ATTACK' |
    'REACTION' | 'DURATION' | 'NIGHT' | 'GATHERING' | 'RESERVE' |
    'TRAVELLER' | 'SPIRIT' | 'HEIRLOOM' | 'FATE' | 'DOOM' |
    'LIAISON' | 'ALLY' | 'TRAIT' | 'EVENT' | 'LANDMARK' | 'PROJECT' | 'WAY' |
    'PROPHECY' | 'SHADOW' | 'FORT';
```

### 3.3 EffectDefinition — Exemples d'effets

```typescript
// Effets basiques
{ type: 'ADD_ACTIONS', amount: 2 }
{ type: 'ADD_MONEY', amount: 3 }
{ type: 'ADD_BUYS', amount: 1 }
{ type: 'DRAW', amount: 2 }
{ type: 'TRASH_SELF' }

// Effets de gain
{ type: 'GAIN', cardId: 'silver' }
{ type: 'GAIN_UP_TO', maxCost: 5, destination: 'hand' }
{ type: 'GAIN_TO_HAND', cardId: 'gold' }

// Choix du joueur
{
    type: 'CHOOSE_CARDS',
    from: 'hand',
    count: 1,
    next: [{ type: 'TRASH' }]
}
{
    type: 'SELECT_OPTION',
    options: [
        { label: '+2 Cartes', effects: [{ type: 'DRAW', amount: 2 }] },
        { label: '+2 Pieces', effects: [{ type: 'ADD_MONEY', amount: 2 }] }
    ]
}

// Conditions
{
    type: 'CONDITION',
    condition: 'PILE_HAS_VP',
    pileId: 'farmers_market',
    trueEffects: [{ type: 'TAKE_VP_FROM_PILE', pileId: 'farmers_market' }, { type: 'TRASH_SELF' }],
    falseEffects: [{ type: 'GATHER_VP', pileId: 'farmers_market', amount: 1 }, { type: 'ADD_MONEY', amount: 1 }]
}

// Attaques
{ type: 'ATTACK', attackEffect: { type: 'DISCARD_DOWN_TO', targetSize: 3 } }

// Tokens sur les piles
{ type: 'GATHER_VP', pileId: 'farmers_market', amount: 1 }
{ type: 'TAKE_VP_FROM_PILE', pileId: 'farmers_market' }
```

### 3.4 Pipeline de résolution

```
ActionResolver.playCard(cardId)
    └─► EffectEngine.processEffects(effects)
          └─► Pour chaque effet → EffectHandlerRegistry.resolve(type, ...)
                ├─ needsChoice: true → state.pendingDecision = {...}
                │    └─► Client envoie décision → EffectEngine.handleDecision(...)
                └─ needsChoice: false → push effets suivants sur effectStack (LIFO)
```

**Règle fondamentale** : L'`effectStack` est une **pile LIFO**.
On push les effets dans l'ordre inverse pour les résoudre dans l'ordre normal.

### 3.5 EventBus

```typescript
EventBus.emit('ON_GAIN', { playerId, card, source: 'buy' | 'effect' })
EventBus.emit('ON_PLAY', { playerId, card })
EventBus.emit('ON_BUY', { playerId, card })
EventBus.emit('ON_TRASH', { playerId, card })
EventBus.emit('ON_DISCARD', { playerId, card })
EventBus.emit('START_OF_TURN', { playerId })
EventBus.emit('END_OF_TURN', { playerId })
EventBus.emit('START_BUY_PHASE', { playerId })
```

---

## 4. PATTERNS DE CODE — CONVENTIONS OBLIGATOIRES

### 4.1 Créer une nouvelle carte

```typescript
// shared/cards/<extension>/nom_carte.ts
import { CardDefinition } from '../../types/CardDefinition.js';

export const village: CardDefinition = {
    id: 'village',
    name: 'Village',
    cost: 3,
    types: ['ACTION'],
    set: 'base',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 }
    ]
};
```

Puis dans `shared/cards/index.ts` :
```typescript
import { village } from './base/village.js';
CardRegistry.register(village);
```

### 4.2 Créer un handler d'effet

```typescript
// Dans shared/engine/registerCoreEffects.ts
EffectHandlerRegistry.register('MY_EFFECT', (state, player, effect, ctx) => {
    // Modifier state directement (pas d'immer ici)
    // Utiliser Logger.log() pour les messages en jeu
    Logger.log(state, `Message en français`, player.id);
    return { state, needsChoice: false };
});

// Si choix nécessaire:
EffectHandlerRegistry.register('MY_CHOICE_EFFECT', (state, player, effect, ctx) => {
    state.pendingDecision = {
        id: generateDecisionId(),
        playerId: player.id,
        type: PromptType.CHOOSE_CARDS,
        constraints: { from: 'hand', count: 1 },
        context: {
            onSuccess: effect.onSuccess,  // Toujours propager!
            next: effect.next,
            sourceCardInstanceId: ctx.sourceCardInstanceId
        }
    };
    return { state, needsChoice: true };
});
```

### 4.3 Propagation du contexte (CRITIQUE)

Toujours propager `onSuccess`, `next`, `sourceCardInstanceId` dans les contextes imbriqués :

```typescript
const newCtx = {
    ...ctx,
    sourceCardInstanceId: ctx.sourceCardInstanceId || cardInstanceId
};
```

---

## 5. COMMUNICATION CLIENT ↔ SERVEUR

### Client → Serveur (Socket.IO)
```
'play_card'     { cardId, instanceId }
'buy_card'      { cardId }
'choose'        { choiceId, payload }
'toggle_ready'
'end_turn'
'create_room'   { name, color, expansions[], ... }
'join_room'     { roomId, name, color }
```

### Serveur → Client
```
'game_state'    SerializedPublicState    ← Etat complet après chaque action
'room_joined'   { roomId, playerId }
'game_over'     { winner, scores }
'error'         { message }
```

### Sérialisation (StateSerializerV2.ts)

Le `GameState` interne est sérialisé avant envoi. La main des adversaires est masquée.
Les `tokens` des piles supply sont inclus (ex: jetons PV sur Marché Fermier).

---

## 6. FRONTEND — COMPOSANTS CLÉS

### CardFrame.tsx (composant universel de carte)
```typescript
<CardFrame
    cardId="village"       // ID de la carte
    variant="mini"         // 'mini' (112px) | 'full' | 'micro'
    count={5}              // Nombre dans la pile
    showCount={true}
    showCost={true}
    tokens={{ vp: 3 }}     // Tokens sur la pile (badge vert)
    isPurchasable={true}
    isSelectable={false}
    selected={false}
    dimmed={false}
    onClick={(e) => {}}
/>
```

### SupplyGrid.tsx
- Catégorise automatiquement en trésors, victoires, royaume
- Passe les `tokens` de la pile au `CardFrame`
- La colonne landscapes (`landscape-column`) utilise `repeat(auto-fill, minmax(112px, 1fr))`

### BoardLayout.tsx (layout principal, ~1600 lignes)
- `zone-11-kingdom` : Réserve principale (SupplyGrid variant="kingdom")
- `zone-6-7-supply` : Trésors & Victoires
- `zone-12-play-area` : Zone de jeu
- `action-bar-zone` : ActionBar (ressources, boutons)

---

## 7. TESTS

```bash
npm test                                           # Tous les tests (251)
npx vitest run server/tests/validation/X.test.ts   # Un fichier
```

### TestEngine API (server/tests/validation/TestUtils.ts)
```typescript
const engine = new TestEngine({
    playerCount: 2,
    cards: ['village', 'market'],
    hand: ['village', 'copper', 'copper', 'copper', 'copper']
});
engine.playCard('village');
engine.handleChoice('Défaussez', ['copper']);
engine.buyCard('market');
engine.endTurn();
expect(engine.getPlayer(0).actions).toBe(0);
```

---

## 8. GOTCHAS ET PIÈGES

1. **Attack Effect Unpacking** : `effect.attackEffect ?? effect` dans AttackEffectHandler
2. **LIFO sur effectStack** : Toujours push dans l'ordre inverse
3. **Tokens VP supply** : Doivent être sérialisés dans StateSerializerV2 ET passés au CardFrame
4. **Contexte imbriqué** : Toujours propager `sourceCardInstanceId`, `onSuccess`, `next`
5. **Cartes Durée** : Gérées par DurationManager, ne pas les déplacer manuellement
6. **Import extensions** : Toujours `.js` à la fin (ESM) : `import { x } from './y.js'`
7. **Phase initiale** : Dans TestEngine, `state.phase = 'ACTION'` par défaut

---

## 9. COMMANDES UTILES

```bash
npm run dev          # Vite dev server (port 3000)
npm run start        # Serveur de jeu (port 3005)
npm run build        # Build production (dist/)
npm run check-types  # TypeScript strict (0 erreur)
npm test             # Vitest (251 tests)

docker compose up -d --build   # Build et run Docker
docker compose logs -f         # Logs en temps réel
```

---

## 10. RÈGLES DE DÉVELOPPEMENT

1. **TypeScript strict** : 0 erreur. `npm run check-types` doit passer.
2. **Effets déclaratifs** : Jamais de logique impérative dans CardDefinition. Tout = EffectDefinition.
3. **Handlers retournent** : Toujours `{ state, needsChoice: boolean }`.
4. **Logs en français** : `Logger.log(state, "message", playerId)`
5. **IDs en snake_case** : `farmers_market`, `war_chest`
6. **Noms en français** : `name: 'Marché Fermier'`
7. **Exports nommés** : Pas de `export default` dans les cartes
8. **Tests avant push** : `npm test` doit être 100% vert

---

## 11. FICHIERS LES PLUS IMPORTANTS

| Fichier | Role | Taille |
|---------|------|--------|
| `shared/engine/EffectEngine.ts` | Coeur du moteur d'effets | ~37KB |
| `shared/engine/registerCoreEffects.ts` | Tous les handlers | ~52KB |
| `shared/engine/ActionResolver.ts` | Resolution des actions | ~38KB |
| `server/GameRoomV2.ts` | Logique salle multijoueur | ~69KB |
| `shared/cards/index.ts` | Registre de toutes les cartes | ~34KB |
| `client/components/BoardLayout.tsx` | Layout principal | ~88KB |
| `style.css` | CSS global | ~50KB |
| `server/StateSerializerV2.ts` | Serialisation etat | ~21KB |

---

*Dominion JS — 22 extensions — 251 tests verts — 0 erreur TypeScript*
