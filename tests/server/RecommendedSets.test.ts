/**
 * Recommended Kingdoms (from the rulebooks) and banned cards.
 */
import { describe, it, expect } from 'vitest';
import { GameRoomV2 } from '../../server/GameRoomV2.js';
import { RECOMMENDED_SETS } from '../../shared/cards/recommendedSets.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { SupplyGenerator } from '../../shared/engine/SupplyGenerator.js';

const noop = () => undefined;
const io: any = { to: () => ({ emit: noop }), emit: noop, sockets: { sockets: new Map() } };

function roomFor(set: typeof RECOMMENDED_SETS[number]) {
    const room = new GameRoomV2(io, 'rec_' + Math.random(), {
        kingdomCards: set.cards,
        sheltersMode: 'never',
        landscapeInstructions: set.landscapes || [],
        turnTimeoutMs: 0,
        setupOverrides: { forCards: set.cards, bane: set.bane, druidBoons: set.druidBoons, riverboatCard: set.riverboatCard, approachingArmyPile: set.approachingArmyPile, traitTargets: set.traitTargets, mouseCard: set.mouseCard },
    } as any);
    room.addPlayer({ id: 's1', join: noop, emit: noop } as any, 'A', '#fff', 'p1');
    room.addPlayer({ id: 's2', join: noop, emit: noop } as any, 'B', '#fff', 'p2');
    return room;
}

describe('Royaumes recommandés des livrets', () => {
    const kingdom = new Set(CardRegistry.getKingdomCandidates());
    const landscapes = new Set(CardRegistry.getLandscapeCandidates().map((c: any) => c.id));

    it('chaque royaume a 10 cartes Royaume distinctes et des paysages qui existent', () => {
        expect(RECOMMENDED_SETS.length).toBeGreaterThan(250);
        for (const s of RECOMMENDED_SETS) {
            expect(new Set(s.cards).size, s.name).toBe(10);
            s.cards.forEach(c => expect(kingdom.has(c), `${s.name}: ${c}`).toBe(true));
            (s.landscapes || []).forEach(l => expect(landscapes.has(l), `${s.name}: ${l}`).toBe(true));
            for (const id of [s.bane, s.riverboatCard, s.approachingArmyPile, s.mouseCard, ...(s.druidBoons || [])]) {
                if (id) expect(CardRegistry.get(id), `${s.name}: ${id}`).toBeTruthy();
            }
        }
    });

    it('chaque royaume se met en place comme dans le livret', () => {
        for (const s of RECOMMENDED_SETS) {
            const room = roomFor(s);
            const state = room.createInitialGameState();
            const where = (id: string) => state.supply[id] || state.nonSupply?.[id];
            s.cards.forEach(c => expect(where(c), `${s.name}: ${c}`).toBeTruthy());
            (s.landscapes || []).forEach(l => expect(state.landscapes, s.name).toContain(l));
            if (s.bane) expect((state.landscapeState as any).young_witch_bane?.state?.baneId, s.name).toBe(s.bane);
            if (s.druidBoons) expect([...(state.landscapeState as any).druid_boons.state.boons].sort(), s.name).toEqual([...s.druidBoons].sort());
            if (s.riverboatCard) expect((state as any).riverboatCard, s.name).toBe(s.riverboatCard);
            if (s.approachingArmyPile) expect(where(s.approachingArmyPile), s.name).toBeTruthy();
            if (s.mouseCard) expect((state.landscapeState as any).way_of_the_mouse?.state?.cardId, s.name).toBe(s.mouseCard);
            for (const [trait, pile] of Object.entries(s.traitTargets || {})) {
                expect(state.supply[pile]?.traits, `${s.name}: ${trait}`).toContain(trait);
            }
        }
    }, 120000);

    it('les réglages imposés sont ignorés si l\'hôte change une carte', () => {
        const s = RECOMMENDED_SETS.find(x => x.bane)!;
        const room = roomFor(s);
        const changed = [...s.cards.filter(c => c !== s.cards[0] || c === 'young_witch'), ...(s.cards[0] === 'young_witch' ? [] : ['chapel'])].slice(0, 10);
        const state = room.createInitialGameState(changed.includes('chapel') ? changed : [...changed.slice(0, 9), 'chapel']);
        // The Bane is then chosen at random (it may differ from the rulebook's)
        expect((state.landscapeState as any).young_witch_bane?.state?.baneId).toBeTruthy();
    });
});

describe('Cartes bannies', () => {
    it('ne sortent jamais au tirage du Royaume, du Fléau ni des paysages', () => {
        const all = CardRegistry.getKingdomCandidates();
        const banned = all.filter((_, i) => i % 2 === 0); // half the cards
        const bannedSet = new Set(banned);
        for (let i = 0; i < 40; i++) {
            const k = SupplyGenerator.generate({ count: 10, excludeCards: banned, seed: 'ban' + i });
            k.forEach(c => expect(bannedSet.has(c), c).toBe(false));
            const bane = SupplyGenerator.pickBaneCard(k, { seed: 'b' + i, excludeCards: banned });
            if (bane) expect(bannedSet.has(bane)).toBe(false);
        }
        const events = CardRegistry.getLandscapeCandidates().filter((c: any) => c.types.includes('EVENT')).map((c: any) => c.id);
        const keep = events[0];
        for (let i = 0; i < 20; i++) {
            const l = SupplyGenerator.getLandscapes({ landscapeInstructions: ['event'], excludeCards: events.filter((e: string) => e !== keep), seed: 'l' + i });
            expect(l).toEqual([keep]);
        }
    });
});
