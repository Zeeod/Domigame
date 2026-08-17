import { CardRegistry } from '../cards/index.js';
import { CardDefinition } from '../types/CardDefinition.js';
import { createGameState, GameState } from './GameState.js';
import { EffectUtils } from './EffectUtils.js';

export interface SupplyGeneratorOptions {
    count: number;
    forceCards?: string[];
    excludeCards?: string[];
    enabledExpansions?: string[]; // New: Filter by expansion
    prosperityMode?: 'always' | 'never' | 'random';
    sheltersMode?: 'always' | 'never' | 'random';
    seed?: string;
    landscapeInstructions?: string[]; // New: ['event', 'project', 'random:event'] or specific IDs
    kingdomCardIds?: string[]; // New: To check for Omens/Prophecy triggers
}

export class SupplyGenerator {
    /**
     * Generates a balanced kingdom supply
     */
    static generate(options: Partial<SupplyGeneratorOptions> = {}): string[] {
        const count = options.count ?? 10;
        const forceCards = options.forceCards ?? [];
        const excludeCards = new Set(options.excludeCards ?? []);
        const seed = options.seed ?? Math.random().toString();

        // Create a temporary state for RNG context
        const rngState = createGameState(seed);

        // Get all kingdom candidates
        const candidates = CardRegistry.getKingdomCandidates()
            .map(id => CardRegistry.get(id))
            .filter((c): c is CardDefinition => {
                if (!c || excludeCards.has(c.id)) return false;

                // New: Filter by enabled expansions
                if (options.enabledExpansions) {
                    const cardExp = (c.expansion || c.set || 'base').toLowerCase();
                    // Fallback to 'base' if list is empty to avoid returning no cards
                    let filter = options.enabledExpansions.length > 0 ? options.enabledExpansions : ['base'];

                    // Expand combined expansions (cornucopia_guilds -> cornucopia, guilds)
                    const expandedFilter: string[] = [];
                    for (const exp of filter) {
                        if (exp === 'cornucopia_guilds') {
                            expandedFilter.push('cornucopia', 'guilds');
                        } else if (exp === 'promos') {
                            // Promos usually don't have a 'promos' set key but might be standalone
                            expandedFilter.push('promos', 'promo');
                        } else {
                            expandedFilter.push(exp);
                        }
                    }

                    return expandedFilter.includes(cardExp);
                }

                return true;
            });

        // Group by cost brackets
        const b1 = candidates.filter(c => c.cost <= 3);
        const b2 = candidates.filter(c => c.cost === 4);
        const b3 = candidates.filter(c => c.cost >= 5);

        const selection: Set<string> = new Set();
        const placeholderDirectives: string[] = [];

        // Pre-process forceCards: separate real IDs from placeholders
        for (const item of forceCards) {
            if (item.startsWith('random:')) {
                placeholderDirectives.push(item);
            } else {
                selection.add(item);
            }
        }

        // Helper to pick random from pool (Seeded & Unbiased)
        const pickRandom = (pool: CardDefinition[], amount: number) => {
            const picked: string[] = [];
            const shuffled = EffectUtils.shuffle(pool, rngState);
            for (let i = 0; i < amount && i < shuffled.length; i++) {
                picked.push(shuffled[i].id);
            }
            return picked;
        };

        // Helper to match expansion/set
        const matchesExpansion = (card: CardDefinition, expansion: string) => {
            const expLower = expansion.toLowerCase();
            const cardExp = (card.expansion || card.set || '').toLowerCase();

            if (expLower === 'base' && !cardExp) return true;
            return cardExp === expLower;
        };

        // Process placeholders (e.g. "random:seaside")
        for (const directive of placeholderDirectives) {
            const expansion = directive.split(':')[1];
            // Filter candidates by expansion AND not already selected
            const pool = candidates.filter(c =>
                matchesExpansion(c, expansion) &&
                !selection.has(c.id)
            );

            if (pool.length > 0) {
                const picked = pickRandom(pool, 1)[0];
                if (picked) selection.add(picked);
            }
        }

        // Ensure minimums if we have space
        const fill = (pool: CardDefinition[], min: number) => {
            const currentFromPool = candidates.filter(c => selection.has(c.id) && pool.some(p => p.id === c.id)).length;
            const needed = Math.max(0, min - currentFromPool);
            const picked = pickRandom(pool.filter(c => !selection.has(c.id)), needed);
            picked.forEach(id => selection.add(id));
        };

        // Pick minimums
        const remainingSlots = Math.max(0, count - selection.size);
        if (remainingSlots > 0) {
            fill(b1, 2);
            fill(b2, 3);
            fill(b3, 2);
        }

        // Fill remaining slots
        const remainingCandidates = candidates.filter(c => !selection.has(c.id));
        const finalPool = EffectUtils.shuffle(remainingCandidates, rngState);

        while (selection.size < count && finalPool.length > 0) {
            selection.add(finalPool.pop()!.id);
        }

        // Failsafe: If somehow we are still under count (e.g. strict filtering exhausted pool), 
        // fallback to ANY base card not yet selected
        if (selection.size < count) {
            console.warn(`[SupplyGenerator] Warning: Could only find ${selection.size}/${count} cards with current filters. Using fallback.`);
            const allBase = CardRegistry.getKingdomCandidates()
                .map(id => CardRegistry.get(id))
                .filter(c => c && !selection.has(c.id));

            const shuffledFallback = EffectUtils.shuffle(allBase, rngState);
            while (selection.size < count && shuffledFallback.length > 0) {
                selection.add(shuffledFallback.pop()!.id);
            }
        }

        const result = Array.from(selection);
        console.log(`[SupplyGenerator] Generated ${result.length} cards:`, result);

        // Final sanity check
        if (result.length < count) {
            console.error(`[SupplyGenerator] CRITICAL: Failed to generate ${count} cards! Only got ${result.length}.`);
        }

        // Young Witch: If present, we need to pick a Bane card (NOT included in the 10 kingdom cards but as an extra supply pile)
        // We'll return it as part of the list, but GameRoom should handle it specially if it wants.
        // Or better: provide a separate helper.

        return result;
    }

    /**
     * Picks a Bane card for Young Witch (cost 2 or 3)
     */
    static pickBaneCard(kingdomCardIds: string[], options: Partial<SupplyGeneratorOptions> = {}): string | null {
        const seed = (options.seed ?? 'bane') + '_bane';
        const rngState = createGameState(seed);

        const exclude = new Set(kingdomCardIds);
        const candidates = CardRegistry.getKingdomCandidates()
            .map(id => CardRegistry.get(id))
            .filter((c): c is CardDefinition =>
                !!c &&
                !exclude.has(c.id) &&
                (c.cost === 2 || c.cost === 3) &&
                !c.types.includes('LANDSCAPE' as any) // Safety
            );

        if (candidates.length === 0) return null;

        const shuffled = EffectUtils.shuffle(candidates, rngState);
        return shuffled[0].id;
    }

    /**
     * Determines if Colony/Platinum should be added based on official rules
     */
    static shouldAddProsperity(kingdomCardIds: string[], mode: 'always' | 'never' | 'random' = 'random', seed?: string): boolean {
        if (mode === 'always') return true;
        if (mode === 'never') return false;

        const prosperityCount = kingdomCardIds.filter(id => {
            const def = CardRegistry.get(id);
            if (!def) return false;
            const exp = def.expansion?.toLowerCase();
            const set = def.set?.toLowerCase();
            return exp === 'prosperity' || set === 'prosperity';
        }).length;

        const rngState = createGameState(seed ?? 'prosperity_check' + Date.now());
        const roll = EffectUtils.random(rngState);
        const probability = prosperityCount / 10;

        return roll < probability;
    }

    /**
     * Determines which extra piles (non-supply) are needed based on the Kingdom cards.
     */
    static getRequiredExtraPiles(kingdomCardIds: string[]): string[] {
        const extraPiles = new Set<string>();
        const kingdomCards = kingdomCardIds.map(id => CardRegistry.get(id)).filter((c): c is CardDefinition => !!c);

        for (const card of kingdomCards) {
            // Ruins: Required if any card is a Looter
            if (card.types.includes('LOOTER')) {
                extraPiles.add('ruins');
            }

            // Spoils: Bandit Camp, Marauder, Pillage
            if (['bandit_camp', 'marauder', 'pillage'].includes(card.id)) {
                extraPiles.add('spoils');
            }

            // Madman: Hermit
            if (card.id === 'hermit') {
                extraPiles.add('madman');
            }

            // Mercenary: Urchin
            if (card.id === 'urchin') {
                extraPiles.add('mercenary');
            }

            // Loot: Any card that has GAIN_LOOT in its effects
            const hasLoot = card.effects?.some((e: any) => e.type === 'GAIN_LOOT' || (e.options?.some((o: any) => o.effects?.some((ee: any) => ee.type === 'GAIN_LOOT'))));
            if (hasLoot) {
                extraPiles.add('loot_pile');
            }
        }

        return Array.from(extraPiles);
    }

    /**
     * Determines if Shelters should replace starting Estates.
     * Rule: If sheltersMode is 'always', return true.
     *       If sheltersMode is 'never', return false.
     *       If sheltersMode is 'random' (default behavior), return true if any Dark Ages card is in the Supply.
     */
    static shouldUseShelters(kingdomCardIds: string[], mode: 'always' | 'never' | 'random' = 'random'): boolean {
        if (mode === 'always') return true;
        if (mode === 'never') return false;

        const kingdomCards = kingdomCardIds.map(id => CardRegistry.get(id));
        return kingdomCards.some(c => {
            const exp = (c?.expansion || c?.set || '').toLowerCase().replace(/_/g, ' ');
            return exp === 'dark ages';
        });
    }

    /**
     * Generates a list of Landscape cards (Events, Landmarks, etc.) 
     * based on enabled expansions and randomness.
     */
    static getLandscapes(options: Partial<SupplyGeneratorOptions> = {}): string[] {
        const seed = options.seed ?? Math.random().toString();
        const rngState = createGameState(seed + '_landscapes');

        // 0. Process Instructions (if any)
        const instructions = options.landscapeInstructions || [];
        const selected: string[] = [];
        const randomDirectives: string[] = [];

        // Separate specific IDs from requests like "event", "random:way"
        for (const inst of instructions) {
            if (inst.startsWith('random:')) {
                // e.g. "random:event" -> add "event" to directives
                randomDirectives.push(inst.split(':')[1]);
            } else if (['event', 'landmark', 'project', 'way', 'trait', 'ally'].includes(inst)) {
                randomDirectives.push(inst);
            } else {
                // Specific ID
                if (CardRegistry.get(inst)) {
                    selected.push(inst);
                }
            }
        }

        // If no instructions, replicate old default behavior (random count up to 2)
        // BUT if instructions exist, we follow them strictly.
        // 1. Identify candidates
        // NOTE: If no expansions specified, allow ALL landscapes (unlike kingdom cards)
        // This is because 'base' has no landscapes, and restricting to 'base' would filter out everything
        const expansions = options.enabledExpansions && options.enabledExpansions.length > 0
            ? options.enabledExpansions
            : null; // null means "allow all"

        const candidates = Object.values(CardRegistry.getAll())
            .filter((c): c is CardDefinition => {
                if (!c) return false;
                const isLandscape = c.types.includes('EVENT') || c.types.includes('LANDMARK')
                    || c.types.includes('PROJECT') || c.types.includes('WAY')
                    || c.types.includes('TRAIT') || c.types.includes('ALLY')
                    || c.types.includes('PROPHECY');
                return isLandscape;
            });

        // Helper to check expansion
        const isAllowedExp = (c: CardDefinition) => {
            // If no expansion filter, allow all
            if (!expansions) return true;

            const cardExp = (c.expansion || c.set || 'base').toLowerCase();
            const expMap: Record<string, string> = { 'promos': 'promo' };
            for (const exp of expansions) {
                const normalizedExp = expMap[exp] || exp;
                if (cardExp === normalizedExp || cardExp === exp) return true;
                if (exp === 'cornucopia_guilds' && (cardExp === 'cornucopia' || cardExp === 'guilds')) return true;
            }
            return false;
        };

        const validCandidates = candidates.filter(isAllowedExp);
        console.log(`[SupplyGenerator] Identified ${candidates.length} total landscapes, ${validCandidates.length} valid for expansions.`);

        // 2. Fulfill Random Directives
        const shuffled = EffectUtils.shuffle(validCandidates, rngState);

        for (const directive of randomDirectives) {
            let typeFilter: string | null = null;
            if (directive !== 'any') {
                typeFilter = directive.toUpperCase();
            }

            // Find first candidate that matches type AND not already selected
            const pickIndex = shuffled.findIndex(c => {
                if (selected.includes(c.id)) return false;
                if (!typeFilter) return true;
                return c.types.includes(typeFilter as any);
            });

            if (pickIndex !== -1) {
                const pick = shuffled[pickIndex];
                selected.push(pick.id);
                // Remove from pool to avoid double picking if we have duplicates in pool (unlikely but safe)
                shuffled.splice(pickIndex, 1);
            }
        }

        // Rising Sun Prophecy: Pick exactly 1 if Omens are in the kingdom
        // Rule: A Prophecy is only used if there is one or more Omen cards in the kingdom.
        const hasOmens = (options.kingdomCardIds || []).some(id => {
            const def = CardRegistry.get(id);
            return def?.types.includes('OMEN' as any);
        });

        if (hasOmens && !selected.some(id => CardRegistry.get(id)?.types.includes('PROPHECY' as any))) {
            const prophecy = validCandidates.find(c => c.types.includes('PROPHECY') && !selected.includes(c.id));
            if (prophecy) selected.push(prophecy.id);
        }

        return selected;
    }

    /**
     * Determines if any Kingdom card requires a Potion for its cost.
     */
    static needsPotion(kingdomCardIds: string[]): boolean {
        return kingdomCardIds.some(id => {
            const def = CardRegistry.get(id);
            return (def?.potionCost || 0) > 0;
        });
    }

    /**
     * Determines which Heirlooms are needed based on the Kingdom cards.
     */
    static getRequiredHeirlooms(kingdomCardIds: string[]): string[] {
        const heirlooms = new Set<string>();
        const kingdomCards = kingdomCardIds.map(id => CardRegistry.get(id)).filter((c): c is CardDefinition => !!c);

        for (const card of kingdomCards) {
            if (card.heirloom) {
                heirlooms.add(card.heirloom);
            }
        }

        return Array.from(heirlooms);
    }

    /**
     * Assigns Traits to Kingdom piles.
     * In Plunder, if a Trait is selected, it must be assigned to a Kingdom pile.
     */
    static assignTraits(state: GameState, options: Partial<SupplyGeneratorOptions> = {}): void {
        const traits = state.landscapes.filter(id => CardRegistry.get(id)?.types.includes('TRAIT' as any));
        if (traits.length === 0) return;

        const seed = (options.seed ?? 'traits') + '_assignment';
        const rngState = createGameState(seed);

        // Usually only 1 trait is used per game in official rules, but we support multiple if selected
        for (const traitId of traits) {
            const traitDef = CardRegistry.get(traitId);
            if (!traitDef) continue;

            // Pick a random kingdom card ID that doesn't already have this trait
            // Rules: One Trait per pile. Pile must be a Kingdom pile.
            const kingdomIds = state.kingdomCards.filter(id => {
                const pile = state.supply[id];
                return pile && (!pile.traits || pile.traits.length === 0);
            });

            if (kingdomIds.length > 0) {
                const shuffled = EffectUtils.shuffle(kingdomIds.map(id => ({ id })), rngState);
                const targetId = shuffled[0].id;
                const pile = state.supply[targetId];
                if (pile) {
                    pile.traits = [...(pile.traits || []), traitId];
                    console.log(`[SupplyGenerator] Assigned Trait ${traitId} to pile ${targetId}`);
                }
            }
        }
    }
}
