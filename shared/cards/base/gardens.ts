/**
 * Gardens - Base Victory Card
 * Worth 1 VP per 10 cards in your deck (rounded down).
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const gardens: CardDefinition = {
    id: 'gardens',
    name: 'Jardins',
    cost: 4,
    types: ['VICTORY'],
    effects: [],
    // Dynamic VP calculation happens in TurnMachine.calculateScores
    // We use a special marker here
    victoryPoints: 0, // Calculated dynamically
    dynamicVP: true,
    vpCalculator: (allCards: { id: string }[]) => Math.floor(allCards.length / 10),
    description: 'Vaut 1 Point de Victoire pour chaque tranche de 10 cartes dans votre deck (arrondi ï¿½ l\'infï¿½rieur).',
    image: '/card-images/gardens.jpg',

    expansion: 'Base'
};


