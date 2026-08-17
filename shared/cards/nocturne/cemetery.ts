import { CardDefinition } from '../../types/CardDefinition';

export const cemetery: CardDefinition = {
    id: 'cemetery',
    name: 'Cimetière',
    types: ['VICTORY'],
    cost: 4,
    victoryPoints: 2,
    expansion: 'nocturne',
    set: 'nocturne',
    description: "2 PV. Quand vous gagnez cette carte, écartez jusqu'à 4 cartes de votre main.",
    heirloom: 'haunted_mirror',
    onGain: [
        {
            type: 'TRASH',
            min: 0,
            max: 4,
            source: 'hand',
            message: "Choisissez jusqu'à 4 cartes à écarter de votre main."
        }
    ]
};
