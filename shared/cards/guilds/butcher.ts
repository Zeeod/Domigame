import { CardDefinition } from '../../types/CardDefinition.js';

export const butcher: CardDefinition = {
    id: 'butcher',
    name: 'Boucher',
    types: ['ACTION'],
    cost: 5,
    expansion: 'guilds',
    description: '+2 Coffres. Vous pouvez écarter une carte de votre main. Si vous le faites, dépensez autant de Coffres que vous voulez et recevez une carte coûtant jusqu\'au coût de la carte écartée plus 1 💰 par Coffre dépensé.',
    effects: [
        { type: 'ADD_COFFERS', amount: 2 },
        { type: 'TRASH', min: 0, max: 1, from: 'hand', message: 'Boucher : vous pouvez écarter une carte', onSuccess: [{ type: 'BUTCHER' }] }
    ] as any
};
