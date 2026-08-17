import { CardDefinition } from '../../types/CardDefinition.js';

export const Vineyard: CardDefinition = {
    id: 'vineyard',
    name: 'Vignoble',
    types: ['VICTORY'],
    cost: 0,
    potionCost: 1,
    expansion: 'alchemy',
    set: 'Alchemy',
    victoryPoints: 0, // Dynamic
    dynamicVP: true,
    vpCalculator: (allCards, getCardDef) => {
        const actionCount = allCards.filter(c => {
            const d = getCardDef(c.id);
            return d?.types?.includes('ACTION');
        }).length;
        return Math.floor(actionCount / 3);
    },
    description: "Vaut 1 VP pour chaque 3 cartes Action dans votre deck (arrondi à l'inférieur)."
};
