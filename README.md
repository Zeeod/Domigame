# Dominion Clone - Production Ready

A professional-grade, server-authoritative Dominion-style card game built with TypeScript, Socket.IO, and React.

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
# Start server (port 3005)
npm run start

# Start client (separate terminal)
cd client && npm run dev
```

### Testing

```bash
# Run all tests
npm run test

# Run stress tests (50+ bot games)
npx vitest run shared/tests/StressTest.test.ts
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (React)                      │
│  - Passive renderer (no game logic)                      │
│  - Socket.IO connection                                  │
│  - Component-based UI                                    │
└──────────────────────────┬──────────────────────────────┘
                           │ Socket.IO
┌──────────────────────────▼──────────────────────────────┐
│                      SERVER (Node.js)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ GameRoomV2  │  │SocketHandler│  │StateSerializer │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│         │                │                   │           │
│         ▼                ▼                   ▼           │
│  ┌─────────────────────────────────────────────────────┐│
│  │              SHARED ENGINE                          ││
│  │  RulesValidator → ActionResolver → EffectEngine     ││
│  │  TurnMachine → CardRegistry → GameState             ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## Key Features

- **Server Authoritative**: All game logic runs server-side
- **26 Base Cards**: Complete Dominion base set
- **Bot System**: RandomBot and GreedyBot for testing/solo play
- **Declarative Effects**: Cards are pure data, engine interprets them
- **Extension Ready**: Add new cards without engine changes

## Cards Implemented

| Category | Cards |
|----------|-------|
| Treasures | Copper, Silver, Gold |
| Victory | Estate, Duchy, Province, Gardens, Curse |
| Actions | Village, Smithy, Market, Militia, Chapel, Cellar, Moat, Woodcutter, Workshop, Moneylender, Witch, Festival, Laboratory, Bureaucrat, Council Room, Remodel, Throne Room, Adventurer, Library |

## Adding New Cards

1. Create card file in `shared/cards/base/`:

```typescript
import { CardDefinition } from '../../types/CardDefinition.js';

export const myCard: CardDefinition = {
    id: 'my_card',
    name: 'My Card',
    cost: 4,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'ADD_ACTIONS', amount: 1 }
    ],
    description: '+2 Cards, +1 Action'
};
```

2. Register in `shared/cards/index.ts`
3. Run tests to verify

## Project Structure

```
├── client/             # React frontend
│   ├── components/     # UI components
│   └── index.tsx       # Entry point
├── server/             # Node.js backend
│   ├── GameRoomV2.ts   # Room management
│   └── SocketHandler.ts# Socket events
├── shared/             # Shared code
│   ├── cards/          # Card definitions
│   ├── engine/         # Game engine
│   ├── bot/            # AI players
│   ├── types/          # TypeScript types
│   └── tests/          # Test suites
└── package.json
```

## Testing Strategy

- **Unit Tests**: Individual engine components
- **Simulation Tests**: Full games with bots
- **Stress Tests**: 50+ games to verify stability
- **Invariant Checks**: Runtime validation in dev mode

## License

MIT
