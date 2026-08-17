import { CardDefinition } from '../../types/CardDefinition.js';

export const charm: CardDefinition = {
    id: 'charm',
    name: 'Charme',
    types: ['TREASURE'],
    cost: 5,
    description: "Choisissez : +1 Achat et +2$ ; ou la prochaine fois que vous gagnez une carte ce tour-ci, gagnez une autre carte de nom différent coûtant autant.",
    expansion: 'empires',
    effects: [
        {
            type: 'CHOOSE_OPTION',
            options: [
                {
                    text: "+1 Achat, +2$",
                    effects: [
                        { type: 'ADD_BUYS', amount: 1 },
                        { type: 'ADD_MONEY', amount: 2 }
                    ]
                },
                {
                    text: "Gagnez une autre carte de même coût",
                    effects: [
                        { type: 'ADD_TURN_TRIGGER', trigger: 'ON_GAIN', effect: 'GAIN_OTHER_SAME_COST' } as any
                    ]
                }
            ]
        } as any
    ]
};
