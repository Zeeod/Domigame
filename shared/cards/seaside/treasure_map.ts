import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Treasure Map (Carte aux trésors) — Seaside
 * Trash this and a Treasure Map from your hand. If you trashed two Treasure Maps,
 * gain 4 Golds onto your deck. (Effect: expansions/Seaside.ts → TREASURE_MAP)
 */
export const treasureMap: CardDefinition = {
    id: 'treasure_map',
    name: 'Carte aux trésors',
    cost: 4,
    types: ['ACTION'],
    effects: [
        { type: 'TREASURE_MAP' } as any
    ],
    description: 'Écartez cette carte et une Carte aux trésors de votre main. Si vous avez écarté deux Cartes aux trésors, recevez 4 Ors que vous placez sur votre pioche.',
    image: '/card-images/treasure-map.jpg',
    expansion: 'seaside'
};
