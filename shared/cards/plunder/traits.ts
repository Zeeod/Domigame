import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Plunder — the 15 Traits (official texts). Each is put on a Kingdom Action or Treasure pile;
 * "X cards" are the cards of that pile. Rules: engine/expansions/PlunderRules.ts.
 */
const trait = (id: string, name: string, description: string): CardDefinition => ({
    id, name, cost: 0, types: ['TRAIT'], description, effects: [], expansion: 'plunder'
} as any);

export const cheap = trait('cheap', 'Bon marché', 'Les cartes Bon marché coûtent 1 💰 de moins.');
export const cursed = trait('cursed', 'Maudit', 'Quand vous recevez une carte Maudite, recevez un Butin et une Malédiction.');
export const fated = trait('fated', 'Destiné', 'Quand vous mélangez, vous pouvez parcourir les cartes et dévoiler les cartes Destinées pour les placer sur le dessus ou sous la pioche.');
export const fawning = trait('fawning', 'Flatteur', 'Quand vous recevez une Province, recevez une carte Flatteuse.');
export const friendly = trait('friendly', 'Amical', 'Au début de votre phase Ajustement, vous pouvez défausser une carte Amicale pour recevoir une carte Amicale.');
export const hasty = trait('hasty', 'Pressé', 'Quand vous recevez une carte Pressée, mettez-la de côté et jouez-la au début de votre prochain tour.');
export const inherited = trait('inherited', 'Hérité', 'Mise en place : vous commencez la partie avec une carte Héritée à la place d\'une carte de départ de votre choix.');
export const inspiring = trait('inspiring', 'Inspirant', 'Après avoir joué une carte Inspirante pendant votre tour, vous pouvez jouer une carte Action de votre main dont vous n\'avez pas d\'exemplaire en jeu.');
export const nearby = trait('nearby', 'Proche', 'Quand vous recevez une carte Proche, +1 Achat.');
export const patient = trait('patient', 'Patient', 'Au début de votre phase Ajustement, vous pouvez mettre de côté des cartes Patientes de votre main pour les jouer au début de votre prochain tour.');
export const pious = trait('pious', 'Pieux', 'Quand vous recevez une carte Pieuse, vous pouvez écarter une carte de votre main.');
export const reckless = trait('reckless', 'Téméraire', 'Suivez deux fois les instructions des cartes Téméraires jouées. Quand vous en défaussez une du jeu, remettez-la sur sa pile.');
export const rich = trait('rich', 'Riche', 'Quand vous recevez une carte Riche, recevez un Argent.');
export const shy = trait('shy', 'Timide', 'Au début de votre tour, vous pouvez défausser une carte Timide pour +2 Cartes.');
export const tireless = trait('tireless', 'Infatigable', 'Quand vous défaussez une carte Infatigable du jeu, mettez-la de côté et placez-la sur votre pioche à la fin du tour.');
