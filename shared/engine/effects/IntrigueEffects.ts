import { GameState, PlayerState } from '../GameState.js';
import { EffectHandlerRegistry } from '../EffectHandlerRegistry.js';
import { EffectEngine } from '../EffectEngine.js';
import { EffectUtils } from '../EffectUtils.js';
import { EconomyEngine } from '../EconomyEngine.js';
import { CardRegistry } from '../../cards/index.js';
import { TrashEffectHandler } from './TrashEffectHandler.js';
import { GainEffectHandler } from './GainEffectHandler.js';
import { chosenInstanceIds } from './OpponentChoiceEffects.js';

const nameOf = (id: string) => CardRegistry.get(id)?.name || id;

/** Players in turn order starting with `first`. */
function fromPlayer(state: GameState, firstId: string): PlayerState[] {
    const i = state.players.findIndex(p => p.id === firstId);
    return [...state.players.slice(i), ...state.players.slice(0, Math.max(i, 0))];
}

export function registerIntrigueEffects(): void {
    // ------------------------------------------------------------------
    // Masquerade: each player with cards in hand picks one; then they all pass
    // their card to the next such player to their left, at once.
    // ------------------------------------------------------------------
    const askPick = (state: GameState, order: string[], index: number) => {
        const p = state.players.find(x => x.id === order[index])!;
        state.pendingDecision = {
            id: `masquerade_${index}_${Date.now()}`,
            playerId: p.id,
            type: 'CHOOSE_CARDS' as any,
            message: 'Mascarade : choisissez une carte à passer au joueur suivant',
            constraints: { min: 1, max: 1, sourceZone: 'hand' },
            context: { specialAction: 'MASQUERADE_PICK', order, index }
        } as any;
    };

    EffectHandlerRegistry.register('PASS_TO_LEFT', (state, player) => {
        const order = fromPlayer(state, player.id).filter(p => p.hand.length > 0).map(p => p.id);
        if (order.length < 2) return { state, needsChoice: false };
        (state as any).masqueradePicks = {};
        askPick(state, order, 0);
        return { state, needsChoice: true };
    });

    EffectEngine.registerDecisionHandler('MASQUERADE_PICK', (state, playerId, payload, decision) => {
        const { order, index } = decision.context;
        const p = state.players.find(x => x.id === playerId)!;
        const id = chosenInstanceIds(payload)[0] ?? p.hand[0]?.instanceId;
        const idx = p.hand.findIndex(c => c.instanceId === id);
        if (idx !== -1) (state as any).masqueradePicks[playerId] = p.hand.splice(idx, 1)[0];

        if (index + 1 < order.length) { askPick(state, order, index + 1); return; }

        // Everybody has picked: pass to the next player (in the same list) at once
        const picks = (state as any).masqueradePicks;
        order.forEach((fromId: string, i: number) => {
            const card = picks[fromId];
            const to = state.players.find(x => x.id === order[(i + 1) % order.length])!;
            if (card) to.hand.push(card);
        });
        delete (state as any).masqueradePicks;
        EffectUtils.log(state, 'Mascarade : chacun passe une carte à son voisin de gauche.');
    });

    // ------------------------------------------------------------------
    // Courtier: reveal a card from your hand; for each type it has, choose a
    // different option: +1 Action; +1 Buy; +$3; gain a Gold.
    // ------------------------------------------------------------------
    EffectHandlerRegistry.register('COURTIER', (state, player) => {
        if (player.hand.length === 0) return { state, needsChoice: false };
        state.pendingDecision = {
            id: `courtier_${Date.now()}`,
            playerId: player.id,
            type: 'CHOOSE_CARDS' as any,
            message: 'Courtisan : dévoilez une carte de votre main',
            constraints: { min: 1, max: 1, sourceZone: 'hand' },
            context: { specialAction: 'COURTIER_REVEAL' }
        } as any;
        return { state, needsChoice: true };
    });

    EffectEngine.registerDecisionHandler('COURTIER_REVEAL', (state, playerId, payload) => {
        const p = state.players.find(x => x.id === playerId)!;
        const card = p.hand.find(c => c.instanceId === chosenInstanceIds(payload)[0]) ?? p.hand[0];
        if (!card) return;
        EffectUtils.revealCards(state, [card], 'ALL', 'Courtisan');
        const n = Math.min(4, CardRegistry.get(card.id)?.types.length || 1);
        EffectUtils.log(state, `${p.name} dévoile ${nameOf(card.id)} (${n} type(s)).`, p.id);
        state.pendingDecision = {
            id: `courtier_opts_${Date.now()}`,
            playerId: p.id,
            type: 'SELECT_OPTION',
            message: `Courtisan : choisissez ${n} option(s) différente(s)`,
            options: [
                { label: '+1 Action', effects: [{ type: 'ADD_ACTIONS', amount: 1 }] },
                { label: '+1 Achat', effects: [{ type: 'ADD_BUYS', amount: 1 }] },
                { label: '+3 💰', effects: [{ type: 'ADD_MONEY', amount: 3 }] },
                { label: 'Recevoir un Or', effects: [{ type: 'GAIN_CARD', cardId: 'gold' }] }
            ],
            constraints: { min: n, max: n, exclusive: true },
            context: { specialAction: 'COURTIER_OPTIONS' }
        } as any;
    });

    // ------------------------------------------------------------------
    // Swindler (attack part, resolved for each victim): trash the top card of
    // the victim's deck; the ATTACKER chooses a card with the same cost for them to gain.
    // ------------------------------------------------------------------
    EffectHandlerRegistry.register('SWINDLER_ATTACK', (state, victim, _effect, ctx) => {
        const top = EffectUtils.handleDrawCardsToLimbo(state, victim, 1).cards[0];
        if (!top) return { state, needsChoice: false };
        TrashEffectHandler.trashCard(state, victim, top);
        const attackerId: string = ctx.attackerId || state.players[state.currentPlayerIndex].id;
        const def: any = CardRegistry.get(top.id);
        const cost = EconomyEngine.getCardCost(state, victim.id, top.id);
        const choices = Object.keys(state.supply).filter(id => {
            const d: any = CardRegistry.get(id);
            return state.supply[id].count > 0 && d
                && EconomyEngine.getCardCost(state, victim.id, id) === cost
                && (d.potionCost || 0) === (def?.potionCost || 0)
                && (d.debtCost || 0) === (def?.debtCost || 0);
        });
        if (choices.length === 0) return { state, needsChoice: false };
        state.pendingDecision = {
            id: `swindler_${victim.id}_${Date.now()}`,
            playerId: attackerId,
            type: 'CHOOSE_CARDS' as any,
            message: `Escroc : choisissez la carte que ${victim.name} reçoit (coût ${cost})`,
            constraints: { min: 1, max: 1, sourceZone: 'supply', filter: { cardIds: choices, exactCost: cost, allowPotionOrDebt: true } },
            context: { specialAction: 'SWINDLER_PICK', victimId: victim.id }
        } as any;
        return { state, needsChoice: true };
    });

    EffectEngine.registerDecisionHandler('SWINDLER_PICK', (state, _attackerId, payload, decision) => {
        const victim = state.players.find(x => x.id === decision.context.victimId);
        if (victim && payload.cardId) {
            GainEffectHandler.handleGainCard(state, victim, { type: 'GAIN_CARD', cardId: payload.cardId });
        }
    });
}
