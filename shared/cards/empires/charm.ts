import { CardDefinition } from '../../types/CardDefinition.js';

export const charm: CardDefinition = {
    id: 'charm',
    name: 'Charme',
    types: ['TREASURE'],
    cost: 5,
    description: 'Quand vous jouez cette carte, choisissez : +1 Achat et +2 💰 ; ou la prochaine fois que vous achetez une carte ce tour-ci, vous pouvez aussi recevoir une carte de nom différent de même coût.',
    expansion: 'empires',
    effects: [{ type: 'SELECT_OPTION', message: 'Charme : choisissez', options: [
        { label: '+1 Achat et +2 💰', effects: [{ type: 'ADD_BUYS', amount: 1 }, { type: 'ADD_MONEY', amount: 2 }] },
        { label: 'Au prochain achat, une autre carte de même coût', effects: [{ type: 'CHARM_SET' }] }
    ] }] as any
};
