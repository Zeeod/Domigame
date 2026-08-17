import { GameState, PlayerState } from '../GameState.js';
import { EffectDefinition } from '../../types/EffectDefinition.js';
import { EffectResult } from '../GameState.js';
import { EffectUtils } from '../EffectUtils.js';
import { DrawEffectHandler } from './DrawEffectHandler.js';
import { CardRegistry } from '../../cards/index.js';
import { TriggerEffectHandler } from './TriggerEffectHandler.js';

export class BasicEffectHandler {
    static handleDraw(state: GameState, player: PlayerState, effect: EffectDefinition): EffectResult {
        return DrawEffectHandler.handleDraw(state, player, effect);
    }

    static handleModifyResource(state: GameState, player: PlayerState, effect: EffectDefinition, suppressLog: boolean): EffectResult {
        const modEffect = effect as any;
        const amount = EffectUtils.getAmount(state, player, modEffect.amount) as number;
        const resource = modEffect.resource;
        const operation = modEffect.operation || 'add';

        let oldValue = (player as any)[resource] || 0;
        let newValue = oldValue;

        if (operation === 'add') {
            if (resource === 'actions' && (player as any).ignoreExtraActions && amount > 0) {
                // Ignore extra actions from Snowy Village
            } else {
                newValue += amount;
            }
        }
        else if (operation === 'remove') newValue -= amount;
        else if (operation === 'set') newValue = amount;

        console.log(`[BasicEffectHandler] modifying ${resource}: ${oldValue} -> ${newValue} (amount=${amount}, op=${operation})`);
        (player as any)[resource] = newValue;

        const diff = newValue - oldValue;

        // Trigger metric changes for effects like Harbor Village
        if (diff !== 0) {
            TriggerEffectHandler.handleMetricChange(state, player, resource, diff);
        }

        // Sync token records for specific resources
        if (resource === 'vpTokens') player.tokens.vp = (player.tokens.vp || 0) + diff;
        if (resource === 'debt') player.tokens.debt = (player.tokens.debt || 0) + diff;
        if (resource === 'coffers') player.tokens.coffers = (player.tokens.coffers || 0) + diff;
        if (resource === 'villagers') player.tokens.villagers = (player.tokens.villagers || 0) + diff;
        if (resource === 'favors') player.tokens.favors = (player.tokens.favors || 0) + diff;
        if (resource === 'potions') player.tokens.potion = (player.tokens.potion || 0) + diff;

        if (!suppressLog && diff !== 0) {
            const label = this.getResourceLabel(resource);
            const msg = diff > 0
                ? `${player.name} obtient +${diff} ${label}.`
                : `${player.name} perd ${Math.abs(diff)} ${label}.`;

            EffectUtils.logEvent(state, {
                actionType: 'MODIFY_TOKEN', // Generic event type
                activePlayerId: player.id,
                message: msg,
                payload: { resource, amount: diff, operation }
            });
            EffectUtils.log(state, msg, player.id);
        }

        return { state, needsChoice: false };
    }

    private static getResourceLabel(resource: string): string {
        switch (resource) {
            case 'actions': return 'Action' + (Math.random() > 0.5 ? 's' : ''); // Simplified for now
            case 'buys': return 'Achat' + (Math.random() > 0.5 ? 's' : '');
            case 'coins': return '💰';
            case 'potions': return 'Potion' + (Math.random() > 0.5 ? 's' : '');
            case 'coffers': return 'Coffre' + (Math.random() > 0.5 ? 's' : '');
            case 'villagers': return 'Villageois';
            case 'favors': return 'Faveur' + (Math.random() > 0.5 ? 's' : '');
            case 'debt': return 'Dette';
            case 'vpTokens': return 'Point' + (Math.random() > 0.5 ? 's' : '') + ' de Victoire';
            default: return resource;
        }
    }

    // --- REFACTORED WRAPPERS ---

    static handleAddActions(state: GameState, player: PlayerState, effect: EffectDefinition, suppressLog: boolean): EffectResult {
        return this.handleModifyResource(state, player, {
            type: 'MODIFY_RESOURCE',
            resource: 'actions',
            amount: (effect as any).amount,
            operation: 'add'
        }, suppressLog);
    }

    static handleAddBuys(state: GameState, player: PlayerState, effect: EffectDefinition, suppressLog: boolean): EffectResult {
        return this.handleModifyResource(state, player, {
            type: 'MODIFY_RESOURCE',
            resource: 'buys',
            amount: (effect as any).amount,
            operation: 'add'
        }, suppressLog);
    }

    static handleAddMoney(state: GameState, player: PlayerState, effect: EffectDefinition, suppressLog: boolean): EffectResult {
        return this.handleModifyResource(state, player, {
            type: 'MODIFY_RESOURCE',
            resource: 'coins',
            amount: (effect as any).amount,
            operation: 'add'
        }, suppressLog);
    }

    static handleAddPotions(state: GameState, player: PlayerState, effect: EffectDefinition, suppressLog: boolean): EffectResult {
        return this.handleModifyResource(state, player, {
            type: 'MODIFY_RESOURCE',
            resource: 'potions',
            amount: (effect as any).amount,
            operation: 'add'
        }, suppressLog);
    }

    static handleAddCoffers(state: GameState, player: PlayerState, effect: EffectDefinition): EffectResult {
        return this.handleModifyResource(state, player, {
            type: 'MODIFY_RESOURCE',
            resource: 'coffers',
            amount: (effect as any).amount,
            operation: 'add'
        }, false);
    }

    static handleAddVillagers(state: GameState, player: PlayerState, effect: EffectDefinition): EffectResult {
        return this.handleModifyResource(state, player, {
            type: 'MODIFY_RESOURCE',
            resource: 'villagers',
            amount: (effect as any).amount,
            operation: 'add'
        }, false);
    }

    static handleTakeDebt(state: GameState, player: PlayerState, effect: EffectDefinition): EffectResult {
        return this.handleModifyResource(state, player, {
            type: 'MODIFY_RESOURCE',
            resource: 'debt',
            amount: (effect as any).amount,
            operation: 'add'
        }, false);
    }

    static handlePayDebt(state: GameState, player: PlayerState, effect: EffectDefinition): EffectResult {
        const amountToPay = (effect as any).amount !== undefined ? (effect as any).amount : player.debt;
        const actualPay = Math.min(amountToPay, player.coins);
        if (actualPay > 0) {
            this.handleModifyResource(state, player, {
                type: 'MODIFY_RESOURCE',
                resource: 'coins',
                amount: actualPay,
                operation: 'remove'
            }, true);
            this.handleModifyResource(state, player, {
                type: 'MODIFY_RESOURCE',
                resource: 'debt',
                amount: actualPay,
                operation: 'remove'
            }, true);
            EffectUtils.log(state, `${player.name} rembourse ${actualPay} 💰 de dette.`, player.id);
        }
        return { state, needsChoice: false };
    }

    static handleAddVictoryTokens(state: GameState, player: PlayerState, effect: EffectDefinition, suppressLog: boolean): EffectResult {
        return this.handleModifyResource(state, player, {
            type: 'MODIFY_RESOURCE',
            resource: 'vpTokens',
            amount: (effect as any).amount,
            operation: 'add'
        }, suppressLog);
    }

    static handleModifyToken(state: GameState, player: PlayerState, effect: EffectDefinition, suppressLog: boolean): EffectResult {
        const modEffect = effect as any;
        const token = modEffect.token;
        const resourceMap: Record<string, any> = {
            'vp': 'vpTokens',
            'debt': 'debt',
            'coffers': 'coffers',
            'villagers': 'villagers',
            'favors': 'favors'
        };

        const resource = resourceMap[token];
        if (resource) {
            return this.handleModifyResource(state, player, {
                type: 'MODIFY_RESOURCE',
                resource,
                amount: modEffect.amount,
                operation: 'add'
            }, suppressLog);
        }

        // Catch-all for other tokens
        const amount = EffectUtils.getAmount(state, player, modEffect.amount);
        player.tokens[token] = (player.tokens[token] || 0) + amount;

        if (!suppressLog) {
            const label = token.toUpperCase();
            const msg = `${player.name} modifie ses jetons ${label} de ${amount > 0 ? '+' : ''}${amount}.`;
            EffectUtils.log(state, msg, player.id);
        }

        return { state, needsChoice: false };
    }

    static handleAddCostReduction(state: GameState, player: PlayerState, effect: EffectDefinition): EffectResult {
        const amount = EffectUtils.getAmount(state, player, (effect as any).amount) as number;
        player.costReduction = (player.costReduction || 0) + amount;
        EffectUtils.log(state, `${player.name} obtient -${amount} 💰 de réduction de coût pour ce tour.`, player.id);
        return { state, needsChoice: false };
    }

    static handleGainStatsByCost(state: GameState, player: PlayerState, effect: any): EffectResult {
        const card = state.lastTrashedCard;
        if (!card) return { state, needsChoice: false };

        const def = CardRegistry.get(card.id);
        if (!def) return { state, needsChoice: false };

        // Handle dynamic cost (e.g. Peddler) if possible, or static cost
        const cost = (def.cost !== undefined) ? def.cost : 0;
        // Note: For complex dynamic costs, we might need EconomyEngine.getCardCost, but that requires card ID, not instance.
        // Usually trashed card has static cost or stored cost?
        // Basic implementation uses definition cost.

        const potionCost = def.potionCost || 0;

        const moneyMult = effect.stats.moneyMultiplier || 0;
        const potionMult = effect.stats.potionMultiplier || 0;

        const totalAmount = (cost * moneyMult) + (potionCost * potionMult);

        if (totalAmount <= 0) return { state, needsChoice: false };

        if (effect.resource === 'cards') {
            return DrawEffectHandler.handleDraw(state, player, { type: 'DRAW', amount: totalAmount });
        } else {
            return this.handleModifyResource(state, player, {
                type: 'MODIFY_RESOURCE',
                resource: effect.resource,
                amount: totalAmount,
                operation: 'add'
            } as any, false);
        }
    }
}
