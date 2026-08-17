import { CardInstance } from './CardInstance.js';
import { GameState } from './GameState.js';
import { EffectUtils } from './EffectUtils.js';

export enum ZoneType {
    DECK = 'deck',
    HAND = 'hand',
    DISCARD = 'discard',
    PLAY = 'play',
    ASIDE = 'aside',
    TRASH = 'trash',
    SUPPLY = 'supply',
    MAT = 'mat' // Generic Mat
}

export interface ZoneOptions {
    visibleTo: 'ALL' | 'OWNER' | 'NONE';
    ordered: boolean;
}

export class Zone {
    cards: CardInstance[];

    constructor(
        public id: string,
        public type: ZoneType,
        public ownerId: string | null, // null for global zones (Supply, Trash)
        public options: ZoneOptions
    ) {
        this.cards = [];
    }

    add(card: CardInstance, index?: number): void {
        if (index !== undefined) {
            this.cards.splice(index, 0, card);
        } else {
            this.cards.push(card);
        }
    }

    remove(cardInstanceId: string): CardInstance | undefined {
        const idx = this.cards.findIndex(c => c.instanceId === cardInstanceId);
        if (idx === -1) return undefined;
        return this.cards.splice(idx, 1)[0];
    }

    shuffle(state: GameState): void {
        this.cards = EffectUtils.shuffle(this.cards, state);
    }

    get content(): CardInstance[] {
        return [...this.cards];
    }

    get count(): number {
        return this.cards.length;
    }

    clear(): void {
        this.cards = [];
    }

    find(predicate: (card: CardInstance) => boolean): CardInstance | undefined {
        return this.cards.find(predicate);
    }

    filter(predicate: (card: CardInstance) => boolean): CardInstance[] {
        return this.cards.filter(predicate);
    }
}
