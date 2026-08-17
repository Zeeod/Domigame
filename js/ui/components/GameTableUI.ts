import { GameView } from '../../GameView';
import { Player } from '../../../shared/Player';
import { CardRenderer } from './CardRenderer';
import { Card } from '../../../shared/Card';

export class GameTableUI {
    private elements: any;
    private intentCallback: (type: string, payload?: any) => void = () => { };

    constructor(elements: any) {
        this.elements = elements;
    }

    setIntentCallback(callback: (type: string, payload?: any) => void) {
        this.intentCallback = callback;
    }

    renderSupply(view: GameView): void {
        console.log('[GameTableUI] renderSupply() called');

        const victorySupply = this.elements.VictorySupply;
        const treasureSupply = this.elements.TreasureSupply;
        const kingdomGrid = this.elements.KingdomSupply;

        console.log('[GameTableUI] victorySupply:', victorySupply ? 'found' : 'NULL');
        console.log('[GameTableUI] treasureSupply:', treasureSupply ? 'found' : 'NULL');
        console.log('[GameTableUI] kingdomSupply:', kingdomGrid ? 'found' : 'NULL');

        if (!kingdomGrid) {
            console.error('[GameTableUI] Kingdom supply element not found!');
            return;
        }

        if (victorySupply) victorySupply.innerHTML = '';
        if (treasureSupply) treasureSupply.innerHTML = '';
        kingdomGrid.innerHTML = '';

        const victoryOrder = ['province', 'duchy', 'estate', 'curse'];
        const treasureOrder = ['gold', 'silver', 'copper'];
        const supply = view.supply;
        const keys = Object.keys(supply);

        const kingdomKeys = keys.filter(k => !victoryOrder.includes(k) && !treasureOrder.includes(k));
        kingdomKeys.sort((a, b) => {
            const costA = supply[a].cards[0]?.cost || 0;
            const costB = supply[b].cards[0]?.cost || 0;
            return costA - costB;
        });

        const isMyTurn = view.isMyTurn;
        const isBuyPhase = view.phase === 'Buy';
        const myCoins = view.myCoins;

        const createSupplyCard = (key: string, targetEl: HTMLElement | null, size: 'small' | 'mini' | 'standard' = 'mini') => {
            const pile = supply[key];
            if (!pile || !targetEl) return;

            const pileCount = pile.count ?? pile.cards?.length ?? 0;
            const card = pile.cards[0] || { name: key, cost: 0, id: key, types: [] } as any;
            const canAfford = isBuyPhase && isMyTurn && myCoins >= card.cost && pileCount > 0;

            const cardEl = CardRenderer.createCardElement(card, () => {
                this.intentCallback('BUY_CARD', { cardId: key, cardName: key });
            }, size, pileCount, canAfford);

            const wrapper = document.createElement('div');
            wrapper.className = `pile-wrapper ${size}-pile`;
            wrapper.setAttribute('data-card-name', card.name);
            wrapper.appendChild(cardEl);
            targetEl.appendChild(wrapper);
        };

        // Render victory cards
        victoryOrder.forEach(key => {
            createSupplyCard(key, victorySupply, 'mini');
        });

        // Render treasure cards
        treasureOrder.forEach(key => {
            createSupplyCard(key, treasureSupply, 'mini');
        });

        // Render kingdom cards
        kingdomKeys.forEach(key => {
            createSupplyCard(key, kingdomGrid, 'mini');
        });
    }

    updateControls(view: GameView): void {
        const isMyTurn = view.isMyTurn;
        const phase = view.phase;

        // Strict PreGame check: Hide all game controls
        if (phase === 'PreGame' || phase === 'PREGAME') {
            if (this.elements.endTurnBtn) this.elements.endTurnBtn.style.display = 'none';
            if (this.elements.enterBuyPhaseBtn) this.elements.enterBuyPhaseBtn.style.display = 'none';
            if (this.elements.playTreasuresBtn) this.elements.playTreasuresBtn.style.display = 'none';
            // Keep phase text logic if needed, or hide it too? usually "Waiting for players" is shown elsewhere.
            return;
        }

        if (this.elements.endTurnBtn) {
            // End Turn button always visible if it's my turn
            this.elements.endTurnBtn.style.display = isMyTurn ? 'inline-block' : 'none';
            // Optional: Disable if waiting for something? Usually always valid to end turn.
            (this.elements.endTurnBtn as HTMLButtonElement).disabled = !isMyTurn;
        }

        // "Fin Phase Action" button (mapped to enterBuyPhaseBtn / endActionBtn)
        if (this.elements.enterBuyPhaseBtn) {
            // Show only if Action Phase AND I have actions/cards? 
            // Or just always in Action Phase as requested?
            // "tu vas mettre un bouton fin phase action"
            const showEndAction = isMyTurn && phase === 'Action';
            this.elements.enterBuyPhaseBtn.style.display = showEndAction ? 'inline-block' : 'none';
        }

        if (this.elements.playTreasuresBtn) {
            // Show only in Buy Phase
            // "et ensuite tu me mettras le bouton fin de tour" - implied treasures button might be less prominent or handled elsewhere
            // But usually Dominion needs "Play Treasures". 
            // Let's keep it visible in Buy Phase as before.
            const showPlayTreasures = isMyTurn && phase === 'Buy' && view.myHand.some((c: any) => c.types.includes('Treasure'));
            this.elements.playTreasuresBtn.style.display = showPlayTreasures ? 'inline-block' : 'none';
        }

        // Update Phase Text
        if (this.elements.phase) {
            // "Phase Action", "Phase Achat"
            const phaseMap: { [key: string]: string } = {
                'Action': 'Phase Action',
                'Buy': 'Phase Achat',
                'Cleanup': 'Phase Nettoyage'
            };
            this.elements.phase.innerText = phaseMap[phase] || phase.toUpperCase();
        }
    }

    updatePiles(view: GameView): void {
        // Deck Pile
        if (this.elements.deckPile) {
            this.elements.deckPile.innerHTML = '';
            // Remove default pile styling so the inner card takes over
            this.elements.deckPile.classList.remove('card-pile', 'deck');
            this.elements.deckPile.style.background = 'transparent';
            this.elements.deckPile.style.border = 'none';
            this.elements.deckPile.style.boxShadow = 'none';

            // Hide the separate count if it exists, as the badge will show it
            if (this.elements.deckCount) this.elements.deckCount.style.display = 'none';

            const deckCount = view.myDeckCount;
            // Always render a card back for the deck if there are cards
            if (deckCount > 0) {
                const deckCard = new Card({ name: 'Pioche', id: 'deck', types: [], cost: 0, text: '' } as any);
                // isHidden = true for card back
                const deckEl = CardRenderer.createCardElement(deckCard, null, 'small', deckCount, false, true);
                this.elements.deckPile.appendChild(deckEl);
            } else {
                this.elements.deckPile.innerHTML = '<div class="empty-pile-marker">Vide</div>';
            }
        }

        // Discard Pile
        if (this.elements.discardPile) {
            this.elements.discardPile.innerHTML = '';
            this.elements.discardPile.classList.remove('card-pile', 'discard');
            this.elements.discardPile.style.background = 'transparent';
            this.elements.discardPile.style.border = 'none';
            this.elements.discardPile.style.boxShadow = 'none';

            // Hide the separate count if it exists
            if (this.elements.discardCount) this.elements.discardCount.style.display = 'none';

            const discardCount = view.myDiscardCount;
            if (discardCount > 0) {
                const discardCard = new Card({ name: 'Défosse', id: 'discard', types: [], cost: 0, text: '' } as any);
                const discardEl = CardRenderer.createCardElement(discardCard, null, 'small', discardCount, false, false);
                this.elements.discardPile.appendChild(discardEl);
            } else {
                this.elements.discardPile.innerHTML = '<div class="empty-pile-marker">Vide</div>';
            }
        }
    }

    updatePlayerScore(view: GameView): void {
        if (this.elements.playerScoreBox) {
            this.elements.playerScoreBox.innerHTML = `
                <strong style="color: ${view.myColor}">${view.myName}</strong>
                <span>${view.myScore} VP</span>
            `;
        }
    }

    updateTrash(view: GameView): void {
        if (!this.elements.trashPile) return;
        this.elements.trashPile.innerHTML = '';
        const cards = view.trash;
        if (cards.length > 0) {
            const card = cards[cards.length - 1];
            this.elements.trashPile.appendChild(CardRenderer.createCardElement(card, null, 'small'));
        } else {
            this.elements.trashPile.innerHTML = '<div class="empty-pile-marker">Vide</div>';
        }
    }

    renderPlayed(view: GameView): void {
        if (!this.elements.played) return;
        this.elements.played.innerHTML = '';

        const playArea = view.myPlayArea;
        if (playArea.length === 0) return;

        // Group consecutive cards by ID
        interface CardStack {
            card: any;
            count: number;
        }

        const stacks: CardStack[] = [];
        let currentStack: CardStack | null = null;

        playArea.forEach((card: any) => {
            if (currentStack && currentStack.card.id === card.id) {
                // Same card ID as previous - increment stack
                currentStack.count++;
            } else {
                // Different card - start new stack
                currentStack = { card, count: 1 };
                stacks.push(currentStack);
            }
        });

        // Calculate overlap based on number of stacks
        // More stacks = more overlap to fit everything
        const containerWidth = this.elements.played.offsetWidth || 300;
        const cardWidth = 80; // Approximate card width in 'small' size
        const minGap = 20; // Minimum visible portion of each card
        const maxGap = cardWidth; // Full card width when few cards

        // Calculate ideal gap to fit all stacks
        const totalStacks = stacks.length;
        let gap = Math.min(maxGap, Math.max(minGap, (containerWidth - cardWidth) / Math.max(1, totalStacks)));

        // Render each stack
        stacks.forEach((stack, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'played-card-stack';

            // Apply overlap via negative margin (except first)
            if (index > 0) {
                const overlap = cardWidth - gap;
                wrapper.style.marginLeft = `-${overlap}px`;
            }

            // Create card element
            const cardEl = CardRenderer.createCardElement(stack.card, null, 'small');
            wrapper.appendChild(cardEl);

            // Add count badge if stacked
            if (stack.count > 1) {
                const badge = document.createElement('div');
                badge.className = 'stack-count-badge';
                badge.innerText = `x${stack.count}`;
                wrapper.appendChild(badge);
            }

            this.elements.played.appendChild(wrapper);
        });
    }

    renderStatus(view: GameView): void {
        if (this.elements.actions) this.elements.actions.innerText = view.myActions.toString();
        if (this.elements.buys) this.elements.buys.innerText = view.myBuys.toString();
        if (this.elements.coins) this.elements.coins.innerText = view.myCoins.toString();
        if (this.elements.phase) {
            const phaseMap: { [key: string]: string } = {
                'Action': 'PHASE ACTION',
                'Buy': 'PHASE ACHAT',
                'Cleanup': 'PHASE NETTOYAGE'
            };
            this.elements.phase.innerText = phaseMap[view.phase] || view.phase.toUpperCase();
        }
        if (this.elements.scoreCount) this.elements.scoreCount.innerText = view.myScore.toString();
    }

    renderOpponents(view: GameView): void {
        // New layout: use dedicated elements for opponent info
        const infoContent = document.getElementById('bot-scores-container');
        const oppHand = document.getElementById('opponent-hand');
        const oppDiscardPile = document.getElementById('opponent-discard-pile');
        const oppDeckPile = document.getElementById('opponent-deck-pile');

        const opponents = view.opponents;
        const activePlayerIndex = view.activePlayerIndex;

        // Show the current active opponent, or first opponent if it's my turn
        let targetOpponent = opponents.find((p: any) =>
            view.players.indexOf(p) === activePlayerIndex
        );

        if (!targetOpponent && opponents.length > 0) {
            targetOpponent = opponents[0];
        }

        // Render opponent info (Zone 1) - using bot-scores-container
        if (infoContent) {
            infoContent.innerHTML = '';
            view.opponents.forEach((p: any) => {
                const box = document.createElement('div');
                box.className = 'score-box';
                box.innerHTML = `
                    <strong style="color: ${p.color || '#fff'}">${p.name}</strong>
                    <span>${p.score || 0} VP</span>
                `;
                infoContent.appendChild(box);
            });

            if (view.opponents.length === 0) {
                infoContent.innerHTML = '<div style="color:#666; font-size:0.8em; text-align:center;">Aucun adversaire</div>';
            }
        }

        // Render opponent hand (Zone 4 - card backs)
        if (oppHand) {
            oppHand.innerHTML = '';
            if (targetOpponent) {
                const handCount = targetOpponent.handCount || 0;
                for (let i = 0; i < handCount; i++) {
                    const back = document.createElement('div');
                    back.className = 'card-back';
                    oppHand.appendChild(back);
                }
            }
        }

        // Update opponent deck pile (Zone 3)
        if (oppDeckPile) {
            oppDeckPile.innerHTML = '';
            if (targetOpponent && (targetOpponent.deckCount || 0) > 0) {
                // Show deck indicator
            } else {
                oppDeckPile.innerHTML = '<div class="empty-pile-marker">0</div>';
            }
        }

        // Update opponent discard pile (Zone 2)
        if (oppDiscardPile) {
            oppDiscardPile.innerHTML = '';
            const discardCount = targetOpponent?.discardCount || 0;
            if (discardCount > 0) {
                oppDiscardPile.innerHTML = `<div class="empty-pile-marker">${discardCount}</div>`;
            } else {
                oppDiscardPile.innerHTML = '<div class="empty-pile-marker">0</div>';
            }
        }
    }


    renderOpponentScores(view: GameView): void {
        if (!this.elements.botScores) return;
        this.elements.botScores.innerHTML = '';
        view.opponents.forEach((p: any) => {
            const box = document.createElement('div');
            box.className = 'score-box';
            const nameSpan = document.createElement('strong');
            nameSpan.innerText = p.name;
            nameSpan.style.color = p.color || '#fff';
            const scoreSpan = document.createElement('span');
            scoreSpan.innerText = `${p.score || 0} VP`;
            box.appendChild(nameSpan);
            box.appendChild(scoreSpan);
            this.elements.botScores.appendChild(box);
        });
    }

    findPileElement(cardName: string): HTMLElement | null {
        return document.querySelector(`[data-card-name="${cardName}"]`) as HTMLElement;
    }

    getZoneElement(_player: any, _zoneName: any): HTMLElement | null {
        return null;
    }

    getDiscardPileElement(player: any): HTMLElement | null {
        return this.getZoneElement(player, 'Discard');
    }

    findOpponentHandElement(player: any): HTMLElement | null {
        const list = document.querySelector(`[data-player-index="${player.id}"]`);
        if (list) {
            const parent = list.closest('.opponent-box');
            if (parent) return parent.querySelector('.opponent-hand') as HTMLElement;
        }
        return null;
    }

    // Overlays
    async showRevealOverlay(player: Player, revealed: Card[]): Promise<void> {
        const overlay = document.getElementById('reveal-overlay');
        const cardsContainer = document.getElementById('reveal-cards');
        const titleEl = overlay?.querySelector('.reveal-title');

        if (!overlay || !cardsContainer) {
            console.warn('[GameTableUI] Reveal overlay elements not found');
            return;
        }

        // Set title
        if (titleEl) {
            titleEl.textContent = `${player.name} révèle :`;
        }

        // Clear and add cards
        cardsContainer.innerHTML = '';
        revealed.forEach(c => {
            const cardEl = CardRenderer.createCardElement(c, null, 'standard');
            cardsContainer.appendChild(cardEl);
        });

        // Show overlay
        overlay.style.display = 'flex';

        // Wait 2 seconds, then hide
        return new Promise(resolve => {
            setTimeout(() => {
                overlay.style.display = 'none';
                resolve();
            }, 2000);
        });
    }

    hideRevealOverlay(): void {
        const overlay = document.getElementById('reveal-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    showSelectionOverlay(_player: Player, cards: Card[], options: any): void {
        let overlay = document.getElementById('selection-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'selection-overlay';
            overlay.className = 'overlay-container';
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
        overlay.innerHTML = `<h3>${options.title || 'Sélectionnez des cartes'}</h3><div class="cards-list"></div><div class="actions"></div>`;
        const list = overlay.querySelector('.cards-list')!;
        cards.forEach(c => {
            const el = CardRenderer.createCardElement(c, () => {
                if (options.onSelect) options.onSelect(c);
            }, 'standard');
            list.appendChild(el);
        });
        if (options.showConfirm) {
            const confirm = document.createElement('button');
            confirm.innerText = 'Confirmer';
            confirm.className = 'main-btn';
            confirm.onclick = () => {
                overlay!.style.display = 'none';
                if (options.onConfirm) options.onConfirm();
            };
            overlay.querySelector('.actions')!.appendChild(confirm);
        }
    }

    hideSelectionOverlay(): void {
        const overlay = document.getElementById('selection-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    showGameOver(winner: any, summary: any[]): void {
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        let html = `<h1>FIN DE LA PARTIE</h1><h2>Victoire de ${winner.name} !</h2>`;
        html += `<div class="p_table"><table><tr><th>Joueur</th><th>Score</th></tr>`;
        summary.forEach(s => html += `<tr><td>${s.name}</td><td>${s.score} VP</td></tr>`);
        html += `</table></div><button class="main-btn" onclick="window.location.reload()">Retour au Menu</button>`;
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
    }
}
