import { GameView } from '../../GameView';
import { CardRenderer } from './CardRenderer';

export class HandUI {
    private elements: any;
    private intentCallback: (type: string, payload?: any) => void = () => { };

    constructor(elements: any) {
        this.elements = elements;
    }

    setIntentCallback(callback: (type: string, payload?: any) => void) {
        this.intentCallback = callback;
    }

    render(view: GameView): void {
        const handEl = this.elements.hand;
        console.log('[HandUI] render() called, handEl:', handEl ? 'found' : 'NULL');
        if (!handEl) {
            console.error('[HandUI] Hand element not found!');
            return;
        }

        handEl.innerHTML = '';

        const isMyTurn = view.isMyTurn;
        const phase = view.phase;
        const isPreGame = (phase === 'PREGAME' || phase === 'PreGame');

        // Get cards from GameView's private state
        const cardsToRender = view.myHand;
        console.log('[HandUI] Rendering', cardsToRender.length, 'cards, phase:', phase, 'isMyTurn:', isMyTurn);

        // Group cards by name for stacking
        const groups: { [key: string]: { card: any, count: number } } = {};
        cardsToRender.forEach((card: any) => {
            if (!groups[card.name]) groups[card.name] = { card: card, count: 0 };
            groups[card.name].count++;
        });

        Object.values(groups).forEach(group => {
            const container = document.createElement('div');
            container.className = 'hand-card-group';

            const onClick = (isMyTurn && !isPreGame) ? () => this.intentCallback('PLAY_CARD', { cardName: group.card.name, cardId: group.card.id }) : null;
            const cardEl = CardRenderer.createCardElement(group.card, onClick, 'standard', null, false, false, group.count);

            if (!isMyTurn) {
                cardEl.style.opacity = '0.7';
                cardEl.style.cursor = 'default';
            } else {
                const isActionPhase = phase === 'ACTION';
                const isBuyPhase = phase === 'BUY';
                const hasActions = view.myActions > 0;

                if ((isActionPhase && group.card.isAction && hasActions) || (isBuyPhase && group.card.isTreasure)) {
                    cardEl.classList.add('playable-aura');
                }
            }

            container.appendChild(cardEl);
            handEl.appendChild(container);
        });
    }

    findCardElementInHand(cardName: string): HTMLElement | null {
        return this.elements.hand?.querySelector(`[data-card-name="${cardName}"]`) as HTMLElement;
    }
}
