import { CardDefinition } from '../../types/CardDefinition';

export const island: CardDefinition = {
    id: 'island',
    name: 'Île',
    types: ['ACTION', 'VICTORY'], // It's Action-Victory!
    cost: 4,
    set: 'seaside',
    victoryPoints: 2,
    description: '2 PV\nPlacez cette carte et une carte de votre main sur votre plateau Île.',
    effects: [
        {
            type: 'MOVE_TO_MAT',
            mat: 'island',
            targets: 'BOTH', // Self (Island) and Selected Card
        }
    ],
    // Island has no duration effect per se, cards just stay there until end of game?
    // Actually Island says: "At end of game, return these to your deck."
    // This logic needs to be in Score Calculation, or we just count cards on Mat.
    // EffectEngine handles placing them. Score Calculator handles counting them.
};
