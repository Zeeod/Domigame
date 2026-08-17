import { CardDefinition } from '../../types/CardDefinition.js';

export const Treasurer: CardDefinition = {
    id: 'treasurer',
    name: 'Trésorier',
    types: ['ACTION'],
    cost: 5,
    effects: [
        {
            type: 'ADD_MONEY',
            amount: 3,
        },
        {
            type: 'CHOOSE_OPTION',
            options: [
                {
                    label: 'Écarter un Trésor de votre main',
                    effects: [
                        {
                            type: 'TRASH',
                            filter: { cardTypes: ['TREASURE'] },
                            min: 1,
                            max: 1,
                            source: 'hand'
                        },
                    ],
                },
                {
                    label: 'Recevoir un Trésor de la poubelle en main',
                    effects: [
                        {
                            type: 'CHOOSE_FROM_ZONE',
                            sourceZone: 'trash',
                            destination: 'hand',
                            filter: { cardTypes: ['TREASURE'] },
                            min: 1,
                            max: 1,
                            optional: false
                        },
                    ],
                },
                {
                    label: 'Prendre la Clé',
                    effects: [
                        {
                            type: 'TAKE_ARTIFACT',
                            artifact: 'key',
                        },
                    ],
                },
            ],
        },
    ],
    description: "+3 Pièces. Choisissez-en un : écartez une carte Trésor de votre main ; ou gagnez une carte Trésor de la poubelle dans votre main ; ou prenez la Clé.",
    expansion: 'Renaissance',
    set: 'renaissance'
};
