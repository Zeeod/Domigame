import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { GameState, createGameState } from './GameState.js';
import { PlayerState, createPlayerState } from './PlayerState.js';
import { ActionResolver } from './ActionResolver.js';
import { CardRegistry } from '../cards/index.js';
import { EffectEngine } from './EffectEngine.js';
import { TriggerEffectHandler } from './effects/TriggerEffectHandler.js';
import { BasicEffectHandler } from './effects/BasicEffectHandler.js';
import { registerCoreEffects } from './registerCoreEffects.js';
import { EffectHandlerRegistry } from './EffectHandlerRegistry.js';
import { GameLogStore } from './GameLogStore.js';
import './registerExpansions.js';

describe('Plunder Expansion Mechanics', () => {
    let state: GameState;
    let player: PlayerState;

    // Manual registration of cards since extractCards might not work in test environment
    beforeAll(() => {
        registerCoreEffects();
        CardRegistry.register({
            id: 'shaman',
            name: 'Chamane',
            cost: 2,
            types: ['ACTION'],
            description: "+1 Action. +1 💰. Vous pouvez écarter une carte de votre main. (Mise en place : chaque joueur écarte un Domaine. Au début de votre tour, vous pouvez gagner une carte du rebut coûtant jusqu'à 1 💰).",
            effects: [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'ADD_MONEY', amount: 1 }, { type: 'SELECT_AND_APPLY', source: 'hand', max: 1, action: 'TRASH' as any }, { type: 'SHAMAN_EFFECT' as any }],
            expansion: 'plunder'
        });
        CardRegistry.register({
            id: 'cabin_boy',
            name: 'Mousse',
            cost: 4,
            types: ['ACTION'],
            description: "+1 Action. +2 💰. Quand vous recevez cette carte, mettez-la de côté. Au début de votre tour, jouez-la.",
            effects: [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'ADD_MONEY', amount: 2 }],
            onGain: [{ type: 'CABIN_BOY_EFFECT' as any }],
            expansion: 'plunder'
        });
        CardRegistry.register({
            id: 'harbor_village',
            name: 'Village de Port',
            cost: 4,
            types: ['ACTION'],
            description: "+1 Carte. +1 Action. La première fois que vous recevez +💰 d'un effet ce tour-ci, +1 Action.",
            effects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'HARBOR_VILLAGE_EFFECT' as any }],
            expansion: 'plunder'
        });
        CardRegistry.register({
            id: 'estate',
            name: 'Domaine',
            cost: 2,
            types: ['VICTORY'],
            expansion: 'base'
        });
        CardRegistry.register({
            id: 'copper',
            name: 'Cuivre',
            cost: 0,
            types: ['TREASURE'],
            expansion: 'base'
        });
        CardRegistry.register({
            id: 'curse',
            name: 'Malédiction',
            cost: 0,
            types: ['CURSE'],
            expansion: 'base'
        });
        CardRegistry.register({
            id: 'loot_sword',
            name: 'Épée de Butin',
            cost: 0,
            types: ['TREASURE', 'LOOT'],
            expansion: 'plunder'
        });
    });

    it('should have Plunder cards registered in CardRegistry', () => {
        const ids = CardRegistry.getAllIds();
        expect(ids).toContain('shaman');
        expect(ids).toContain('cabin_boy');
        expect(ids).toContain('harbor_village');
    });

    it('should have Plunder effect handlers registered', () => {
        expect(EffectHandlerRegistry.getRegisteredTypes()).toContain('CABIN_BOY_EFFECT');
        expect(EffectHandlerRegistry.getRegisteredTypes()).toContain('HARBOR_VILLAGE_EFFECT');
        expect(EffectHandlerRegistry.getRegisteredTypes()).toContain('SHAMAN_EFFECT');
    });

    beforeEach(() => {
        state = createGameState('test-seed');
        player = createPlayerState('p1', 'Player 1');
        state.players = [player];
        state.phase = 'ACTION';

        // Manual setup of starting cards in hand (startGame will move them to deck)
        player.hand = [
            { id: 'estate', instanceId: 'e1' },
            { id: 'estate', instanceId: 'e2' },
            { id: 'estate', instanceId: 'e3' },
            { id: 'copper', instanceId: 'c1' },
            { id: 'copper', instanceId: 'c2' },
            { id: 'copper', instanceId: 'c3' },
            { id: 'copper', instanceId: 'c4' }
        ];
        player.deck = [];
        GameLogStore.clear(state.id);
    });

    describe('Shaman Setup', () => {
        it('should trash an Estate when Shaman is in the kingdom', () => {
            state.kingdomCards = ['shaman'];
            state.supply['shaman'] = { cardId: 'shaman', count: 10, cards: [] };

            // Before startGame, hand has 7 cards (3 estates)
            expect(player.hand.length).toBe(7);
            expect(player.hand.filter(c => c.id === 'estate').length).toBe(3);

            ActionResolver.startGame(state);

            // After startGame, deck should have 6 cards (1 trashed), and then drawn 5
            // So deck should have 1 card left? (Total 7 - 1 trashed = 6. 6 - 5 drawn = 1 left in deck).
            // Trash should have 1 Estate.
            expect(state.trash.length).toBe(1);
            expect(state.trash[0].id).toBe('estate');
            expect(player.hand.length).toBe(5);
        });
    });

    describe('Harbor Village Trigger', () => {
        it('should give +1 Action the first time coins are added', () => {
            player.actions = 1;
            player.coins = 0;

            // Register Harbor Village trigger
            TriggerEffectHandler.handleRegisterTrigger(state, player, {
                trigger: 'ON_PLAYER_METRIC_CHANGE',
                filter: { metric: 'coins', change: 'positive' },
                effects: [{
                    type: 'CONDITION',
                    condition: 'FIRST_TIME_THIS_TURN_GLOBAL',
                    value: 'harbor_village_bonus',
                    trueEffects: [{ type: 'ADD_ACTIONS', amount: 1 }]
                }]
            });

            // 1. Add some coins
            BasicEffectHandler.handleModifyResource(state, player, {
                type: 'MODIFY_RESOURCE',
                resource: 'coins',
                amount: 1,
                operation: 'add'
            }, false);

            // Process the stack to resolve triggers
            EffectEngine.processStack(state);

            expect(player.coins).toBe(1);
            expect(player.actions).toBe(2); // 1 start + 1 from bonus

            // 2. Add coins again - should NOT give another action
            BasicEffectHandler.handleModifyResource(state, player, {
                type: 'MODIFY_RESOURCE',
                resource: 'coins',
                amount: 1,
                operation: 'add'
            }, false);

            expect(player.coins).toBe(2);
            expect(player.actions).toBe(2); // Still 2
        });
    });

    describe('Cabin Boy onGain', () => {
        it('should set aside and register a turn start trigger', () => {
            const card = { id: 'cabin_boy', instanceId: 'cb1' };
            player.hand.push(card);

            // Gain effect (using sourceCardInstanceId)
            EffectEngine.applyEffects(state, player.id, [{ type: 'CABIN_BOY_EFFECT' as any }], true, 'cb1');

            expect(player.hand).not.toContain(card);
            expect(player.aside).toContain(card);

            // Check for trigger
            const trigger = state.triggers?.find(t => t.type === 'TURN_START');
            expect(trigger).toBeDefined();
        });
    });

    describe('Loot Pile Primitive', () => {
        it('should gain a Loot from the loot pile', () => {
            state.nonSupply['loot_pile'] = {
                cardId: 'loot_pile',
                count: 1,
                cards: [{ id: 'loot_sword', instanceId: 'ls1' }]
            };

            EffectEngine.applyEffects(state, player.id, [{ type: 'GAIN_LOOT' as any }]);

            expect(player.hand.some(c => c.id === 'loot_sword')).toBe(true);
            expect(state.nonSupply['loot_pile'].count).toBe(0);
        });
    });
});
