import { GameState, PlayerState, CardInstance } from '../GameState.js';
import { EffectHandlerRegistry } from '../EffectHandlerRegistry.js';
import { EffectUtils } from '../EffectUtils.js';
import { CardRegistry } from '../../cards/index.js';
import { discardCards } from '../Discard.js';
import { TrashEffectHandler } from './TrashEffectHandler.js';

/** Top card of the deck, reshuffling the discard if needed (undefined if none). */
function takeTop(state: GameState, player: PlayerState): CardInstance | undefined {
    if (player.deck.length === 0 && player.discardPile.length > 0) {
        EffectUtils.reshuffleDiscard(state, player);
        player.discardPile = [];
    }
    return player.deck.shift();
}

const named = (state: GameState, ctx: any): string | undefined => ctx?.namedCardId ?? (state as any).lastNamedCard;
const nameOf = (id: string) => CardRegistry.get(id)?.name || id;

/**
 * Effects built around "name a card": Wishing Well, Mystic, Doctor, Journeyman,
 * Sorceress, Sorcerer… The NAME_CARD decision itself is resolved by EffectEngine
 * (handleNameCardDecision) and stores the name in state.lastNamedCard.
 */
export function registerNamingEffects(): void {
    const nameCard = (state: GameState, player: PlayerState, effect: any, ctx: any) => {
        state.pendingDecision = {
            id: `name_card_${Date.now()}_${player.id}`,
            playerId: player.id,
            type: 'NAME_CARD' as any,
            message: effect.message || 'Nommez une carte',
            constraints: { min: 1, max: 1 },
            context: {
                onSelect: effect.next,
                sourceCardInstanceId: ctx?.sourceCardInstanceId,
                attackerId: ctx?.attackerId
            }
        } as any;
        return { state, needsChoice: true };
    };
    EffectHandlerRegistry.register('NAME_CARD', nameCard);
    EffectHandlerRegistry.register('NAME_A_CARD', nameCard);

    // Wishing Well / Mystic: reveal the top card; if it is the named card, put it into your hand
    EffectHandlerRegistry.register('TAKE_TOP_IF_NAMED', (state, player, _effect, ctx) => {
        const top = takeTop(state, player);
        if (!top) return { state, needsChoice: false };
        EffectUtils.revealCards(state, [top], 'ALL', `${player.name} dévoile`);
        if (top.id === named(state, ctx)) {
            player.hand.push(top);
            EffectUtils.log(state, `${player.name} dévoile ${nameOf(top.id)} : c'est la bonne carte, il la prend en main.`, player.id);
        } else {
            player.deck.unshift(top);
            EffectUtils.log(state, `${player.name} dévoile ${nameOf(top.id)} : raté.`, player.id);
        }
        return { state, needsChoice: false };
    });
    // Mystic shorthand: name a card, then the check above
    EffectHandlerRegistry.register('NAME_AND_REVEAL_TOP', (state, player, effect, ctx) =>
        nameCard(state, player, { ...(effect as any), next: [{ type: 'TAKE_TOP_IF_NAMED' }] }, ctx));

    // Sorceress: put the top card into your hand; if it is the named card, `ifNamed` happens
    EffectHandlerRegistry.register('TOP_TO_HAND_CHECK_NAMED', (state, player, effect, ctx) => {
        const top = takeTop(state, player);
        if (!top) return { state, needsChoice: false };
        EffectUtils.revealCards(state, [top], 'ALL', `${player.name} dévoile`);
        player.hand.push(top);
        const ifNamed = (effect as any).ifNamed;
        if (top.id === named(state, ctx) && ifNamed) {
            const list = Array.isArray(ifNamed) ? ifNamed : [ifNamed];
            state.effectStack.push(...list.map((e: any) => ({
                type: 'EFFECT' as const, playerId: player.id, effect: e,
                context: { sourceCardInstanceId: ctx?.sourceCardInstanceId }
            })).reverse());
        }
        return { state, needsChoice: false };
    });

    // Doctor: trash the revealed cards (limbo) that are the named card
    EffectHandlerRegistry.register('TRASH_NAMED_CARDS', (state, player, _effect, ctx) => {
        const id = named(state, ctx);
        for (const card of player.limbo.filter(c => c.id === id)) {
            player.limbo.splice(player.limbo.indexOf(card), 1);
            TrashEffectHandler.trashCard(state, player, card);
        }
        return { state, needsChoice: false };
    });

    // Journeyman: reveal until `count` cards that are not the named card; those go to hand, discard the rest
    EffectHandlerRegistry.register('REVEAL_UNTIL_COUNT', (state, player, effect, ctx) => {
        const e = effect as any;
        const id = e.excludeNamed ? named(state, ctx) : undefined;
        const kept: CardInstance[] = [];
        const discarded: CardInstance[] = [];
        while (kept.length < (e.count ?? 3)) {
            const top = takeTop(state, player);
            if (!top) break;
            (top.id === id ? discarded : kept).push(top);
        }
        EffectUtils.revealCards(state, [...kept, ...discarded], 'ALL', `${player.name} dévoile`);
        kept.forEach(c => EffectUtils.addCardToZone(player, c, e.destination || 'hand', state));
        discardCards(state, player, discarded);
        return { state, needsChoice: false };
    });

    // Remaining revealed cards (limbo) back on the deck in the order of your choice
    EffectHandlerRegistry.register('REORDER_AND_RETURN', (state, _player, effect) => {
        state.effectStack.push({
            type: 'EFFECT', playerId: _player.id,
            effect: { type: 'REORDER', sourceZone: 'limbo', destination: (effect as any).destination || 'deck', position: 'TOP' } as any,
            context: {}
        });
        return { state, needsChoice: false };
    });
}
