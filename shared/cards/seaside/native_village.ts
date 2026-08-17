import { CardDefinition } from '../../types/CardDefinition';

export const nativeVillage: CardDefinition = {
    id: 'native_village',
    name: 'Village indigène',
    types: ['ACTION'],
    cost: 2,
    description: '+2 Actions\nChoisissez : Mettez la carte du dessus de votre deck sur le plateau Village Indigène ; ou prenez les cartes du plateau en main.',
    set: 'seaside',
    effects: [
        { type: 'ADD_ACTIONS', amount: 2 },
        {
            type: 'CHOOSE_OPTION',
            message: 'Choisissez une option :',
            options: [
                {
                    label: 'Mettre une carte de la main sur le village',
                    effects: [
                        {
                            type: 'MOVE_CARDS',
                            source: 'deck',
                            destination: 'nativeVillageMat' as any,
                            count: 1
                        }
                    ]
                },
                {
                    label: 'Prendre les cartes du village',
                    effects: [
                        { type: 'TAKE_FROM_MAT', mat: 'nativeVillageMat' }
                    ]
                }
            ]
        }
    ]
    // Note: We need to ensure 'native_village' mat exists on PlayerState or is handled by generic 'mats'.
    // EffectEngine matches 'nativeVillageMat'.
};
