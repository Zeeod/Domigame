
# Implementation Plan - Fix Ally Split Piles

## Objective
Correctly implement the Allies expansion Split Piles, ensuring they have 16 cards (4 of each type) and are ordered correctly (cheapest on top).

## Changes

### 1. Update Card Definitions
**File:** `shared/cards/allies/piles.ts`

- Add `mixedPile` property to all 6 Ally split piles:
    - `augurs_pile`
    - `clashes_pile`
    - `forts_pile`
    - `odysseys_pile`
    - `townsfolk_pile`
    - `wizards_pile`
- Configure `mixedPile` as `type: 'ROTATING'`.
- Populate `cards` array with 16 card IDs for each pile.
- **Order:** The array must be ordered from **BOTTOM to TOP** (Cost $6 -> Cost $3), because the `ActionResolver` uses `pop()` to take cards from the supply.
    - Example (Clashes): `['territory', ..., 'battle_plan']` (so Battle Plan is popped first).

### 2. Resolve ID Conflicts
**File:** `shared/cards/allies/split_piles.ts`

- Rename `blacksmith` (Townsfolk) to `town_blacksmith` to avoid conflict with Base game Blacksmith.
- This ensures both cards can coexist in the registry.

## Verification
- Verified `GameRoomV2` supply generation logic handles `mixedPile` correctly.
- Created `server/tests/AlliesSplitPiles.test.ts` (temp) to verify pile initialization, count (16), and order. (Logic verified).
