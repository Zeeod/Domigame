import { CardDefinition } from '../../types/CardDefinition.js';

export const summon: CardDefinition = {
    id: 'summon',
    name: 'Appel',
    cost: 5,
    types: ['EVENT'],
    description: "Recevez une carte Action coûtant jusqu'à 4 💰. Mettez-la de côté. Si vous l'avez fait, jouez-la au début de votre prochain tour.",
    effects: [{ type: 'SUMMON' }] as any,
    expansion: 'promos'
};
