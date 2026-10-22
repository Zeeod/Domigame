import { CardDefinition } from '../../types/CardDefinition';

export const sailor: CardDefinition = {
    id: 'sailor',
    name: 'Marin',
    types: ['ACTION', 'DURATION'],
    cost: 4,
    description: '+1 Action. Une fois durant ce tour, lorsque vous gagnez une carte Durée, vous pouvez la jouer. Au début de votre prochain tour : +2 Pièces ; vous pouvez écarter une carte de votre main.',
    expansion: 'seaside',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            // Once this turn, when you gain a Duration card, you may play it
            type: 'REGISTER_TRIGGER', trigger: 'ON_GAIN', duration: 'TURN',
            filter: { cardTypes: ['DURATION'] },
            effects: [{ type: 'SELECT_OPTION', message: 'Marin : jouer la carte Durée reçue ?', options: [
                { label: 'Oui', effects: [{ type: 'PLAY_GAINED_CARD' }] },
                { label: 'Non', effects: [] }
            ] }]
        }
    ] as any,
    durationEffects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'TRASH', min: 0, max: 1, from: 'hand', message: 'Marin : vous pouvez écarter une carte de votre main' }
    ] as any
};
