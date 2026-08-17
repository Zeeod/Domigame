import { CardDefinition } from '../../types/CardDefinition.js';

export const miser: CardDefinition = {
    id: 'miser',
    name: 'Avare',
    types: ['ACTION'],
    cost: 4,
    expansion: 'adventures',
    set: 'adventures',
    description: 'Choisissez: Mettez un Cuivre de votre main sur votre tapis de Taverne; ou +1 💰 par Cuivre sur votre tapis de Taverne.',
    effects: [
        {
            type: 'CHOOSE_OPTION',
            message: 'Choisissez:',
            options: [
                { label: 'Mettre un Cuivre sur Taverne', effects: [{ type: 'PUT_COPPER_ON_TAVERN' }] },
                { label: '+1 💰 par Cuivre sur Taverne', effects: [{ type: 'ADD_MONEY_PER_COPPER_ON_TAVERN' }] }
            ]
        }
    ] as any
};
