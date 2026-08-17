import { Logger } from '../Logger.js';
import { CardRegistry } from '../../cards/index.js';
import { EffectEngine } from '../EffectEngine.js';
import { createCardInstance } from '../CardInstance.js';
import { ExpansionModule } from '../ExpansionLoader.js';

export const PromoModule: ExpansionModule = {
    id: 'promo',
    name: 'Promotional Cards',
    effectHandlers: [
        {
            type: 'TRASH_FROM_SUPPLY',
            handler: (state, player, _effect) => {
                const decision = state.lastDecisionResults as any;
                const cardId = decision?.cards?.[0]?.id || decision?.cardId;
                if (!cardId) return { state, needsChoice: false };

                const pile = state.supply[cardId];
                if (pile && pile.count > 0) {
                    pile.count--;
                    const card = CardRegistry.get(cardId) ? createCardInstance(cardId) : null;
                    if (card) {
                        state.trash.push(card);
                        const def = CardRegistry.get(cardId);
                        Logger.log(state, `${player.name} écarte ${def ? def.name : cardId} de la réserve (Lurker).`, player.id);
                    }
                }
                return { state, needsChoice: false };
            }
        },
        {
            type: 'PLAY_AS_SUPPLY_ACTION',
            handler: (state, player, _effect) => {
                const decision = state.lastDecisionResults as any;
                const cardId = decision?.cards?.[0]?.id || decision?.cardId;
                if (!cardId) return { state, needsChoice: false };

                const def = CardRegistry.get(cardId);
                if (!def) return { state, needsChoice: false };

                Logger.log(state, `${player.name} joue ${def.name} depuis la réserve (Captain).`, player.id);

                const tempCard = createCardInstance(cardId);

                if (def.effects) {
                    EffectEngine.applyEffects(state, player.id, def.effects || [], false, tempCard.instanceId);
                }

                return { state, needsChoice: false };
            }
        }
    ],
    onLoad: () => {
        console.log('[Promo] Module loaded.');
    }
};
