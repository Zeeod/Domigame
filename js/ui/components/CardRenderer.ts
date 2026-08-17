import { Card } from '../../../shared/Card';

export class CardRenderer {
    static getTypeColor(types: string[]): string {
        if (types.includes('Treasure')) return '#f1c40f';
        if (types.includes('Victory')) return '#2ecc71';
        if (types.includes('Curse')) return '#9b59b6';
        if (types.includes('Reaction')) return '#3498db';
        if (types.includes('Attack')) return '#e74c3c';
        return '#fff';
    }

    static getPrimaryType(types: string[]): string {
        if (types.includes('Attack')) return 'Attack';
        if (types.includes('Reaction')) return 'Reaction';
        if (types.includes('Curse')) return 'Curse';
        if (types.includes('Victory')) return 'Victory';
        if (types.includes('Treasure')) return 'Treasure';
        return types[0] || 'Action';
    }

    static translateTypes(types: string[]): string {
        const mapping: { [key: string]: string } = {
            'Action': 'Action',
            'Treasure': 'Trésor',
            'Victory': 'Victoire',
            'Curse': 'Malédiction',
            'Reaction': 'Réaction',
            'Attack': 'Attaque',
            'Duration': 'Durée'
        };
        return types.map(t => mapping[t] || t).join(' / ');
    }

    static createCardElement(card: Card, onClick: (() => void) | null, size: string = 'standard', quantity: number | null = null, canAfford: boolean = false, isHidden: boolean = false, handQuantity: number | null = null): HTMLElement {
        const el = document.createElement('div');
        const types = card.types || [];
        const typeColor = isHidden ? '#d4a017' : this.getTypeColor(types);
        const primaryType = isHidden ? 'Back' : this.getPrimaryType(types);

        el.className = `card card-${size}`;
        if (!isHidden) el.classList.add(`type-${primaryType}`);
        else el.classList.add('card-back-style');

        el.style.position = 'relative';
        el.style.borderColor = typeColor;

        const showBuyBtn = canAfford && quantity !== null && quantity > 0 && (size === 'small' || size === 'mini');
        const btnSize = size === 'mini' ? 16 : 22;
        const btnFontSize = size === 'mini' ? 12 : 16;
        const buyBtnHtml = showBuyBtn ? `<button title="Acheter" class="buy-indicator-btn" style="position: absolute; bottom: 2px; right: 2px; width: ${btnSize}px; height: ${btnSize}px; font-size: ${btnFontSize}px; line-height: ${btnFontSize}px; padding: 0; border-radius: 3px; background: #3498db; color: white; border: 1px solid #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-family: sans-serif; z-index: 10;">+</button>` : '';

        if (isHidden) {
            el.classList.add('card-back');
            // Allow badges on hidden cards (e.g. Deck)
            if (quantity !== null) {
                el.innerHTML = `<div class="pile-count-badge">${quantity}</div>`;
            }
        } else {
            const translatedTypes = this.translateTypes(types);
            const isMini = size === 'mini';
            const isVictorySupply = types.includes('Victory') && quantity !== null;

            // Shared structure: Header Banner | Body (Image/Text) | Type Banner
            el.innerHTML = `
                <div class="card-name-banner">
                    ${card.name}
                </div>
                
                <div class="card-body ${isVictorySupply ? 'victory-supply-layout' : ''}">
                    <div class="card-image-area">
                        <div class="card-image-placeholder"></div>
                    </div>
                    ${(!isMini && !isVictorySupply) ? `
                    <div class="card-text-area">
                        ${card.text || ''}
                    </div>
                    ` : ''}
                </div>

                <div class="card-type-banner">
                    ${translatedTypes}
                </div>

                <div class="card-cost-badge">${card.cost}</div>
                ${quantity !== null ? `<div class="pile-count-badge">${quantity}</div>` : ''}
                ${buyBtnHtml ? `<div class="buy-btn-container">${buyBtnHtml}</div>` : ''}
            `;
        }

        if (canAfford && !showBuyBtn) {
            const indicator = document.createElement('div');
            indicator.className = 'affordability-indicator';
            el.appendChild(indicator);
        }

        if (handQuantity !== null && handQuantity > 1) {
            const badge = document.createElement('div');
            badge.className = 'hand-stack-badge';
            badge.innerText = handQuantity.toString();
            el.appendChild(badge);
        }

        el.setAttribute('data-card-name', card.name);
        if (quantity !== null) el.setAttribute('data-is-pile', 'true');

        if (onClick) {
            el.addEventListener('click', onClick);
            el.style.cursor = 'pointer';
        }

        // Right click to zoom
        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (!isHidden) {
                this.showZoom(card);
            }
        });

        return el;
    }

    static showZoom(card: Card): void {
        let overlay = document.getElementById('card-zoom-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'card-zoom-overlay';
            // Styles handled by CSS #card-zoom-overlay

            overlay.onclick = () => {
                overlay!.style.display = 'none';
            };
            overlay.oncontextmenu = (e) => {
                e.preventDefault();
                overlay!.style.display = 'none';
            };
            document.body.appendChild(overlay);

            // Global listener to close zoom if clicking anywhere (because overlay will pass through events)
            document.addEventListener('click', (e) => {
                if (overlay && overlay.style.display === 'flex') {
                    // If the click target is NOT inside the zoom container, close it
                    const target = e.target as HTMLElement;
                    if (!target.closest('.zoom-card-container')) {
                        overlay.style.display = 'none';
                    }
                }
            }, true); // Capture phase to ensure we catch it before other handlers if needed, 
            // or bubble phase? Capture helps us intercept. 
            // Actually, if we want to allow the *other* card to be clicked, we shouldn't stop propagation.
            // We just want to close the OLD zoom.

            // Wait: if I click another card, 'contextmenu' fires on that card.
            // If I click (left click) on background, I want to close.
            // If I right click another card, I want to switch zoom.
        }
        overlay.innerHTML = '';
        overlay.innerHTML = '';


        // Use standard card creation with 'zoom' size for consistency
        const container = this.createCardElement(card, null, 'zoom');
        // container.classList.add('zoom-card-container'); // REMOVED: Conflicting class causing layout issues

        container.onclick = (e) => e.stopPropagation();

        overlay.appendChild(container);
        overlay.style.display = 'flex';
    }

    static async animateCardMove(card: Card, sourceEl: HTMLElement | null, targetEl: HTMLElement | null, targetSize: string = 'standard'): Promise<void> {
        if (!sourceEl || !targetEl) return;

        const sourceRect = sourceEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        const animEl = this.createCardElement(card, null, 'standard');
        animEl.classList.add('animating-card');

        animEl.style.position = 'fixed';
        animEl.style.zIndex = '9999';
        animEl.style.pointerEvents = 'none';
        animEl.style.left = `${sourceRect.left + sourceRect.width / 2}px`;
        animEl.style.top = `${sourceRect.top + sourceRect.height / 2}px`;

        animEl.style.transform = 'translate(-50%, -50%) scale(1)';
        animEl.style.opacity = '1';

        document.body.appendChild(animEl);

        animEl.offsetHeight;

        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;

        return new Promise(resolve => {
            animEl.style.left = `${targetX}px`;
            animEl.style.top = `${targetY}px`;

            let finalScale = 1;
            if (targetSize === 'small') finalScale = 0.52;
            else if (targetSize === 'mini') finalScale = 0.28;
            else if (targetSize === 'standard') finalScale = 1;

            animEl.style.transform = `translate(-50%, -50%) scale(${finalScale})`;

            animEl.addEventListener('transitionend', () => {
                animEl.style.opacity = '0';
                setTimeout(() => {
                    animEl.remove();
                    resolve();
                }, 50);
            }, { once: true });

            setTimeout(() => {
                if (animEl.parentNode) animEl.remove();
                resolve();
            }, 600);
        });
    }
}
