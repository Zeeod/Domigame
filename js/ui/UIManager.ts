import { GameView } from '../GameView';
import { Player } from '../../shared/Player';
import { Card } from '../../shared/Card';
import { ZoneName, NetworkPlayer } from '../../shared/types';
import { IGameUI } from '../../shared/IGameUI';

import { LobbyUI, StartMenuCallbacks } from './components/LobbyUI';
import { HandUI } from './components/HandUI';
import { GameTableUI } from './components/GameTableUI';
import { CardRenderer } from './components/CardRenderer';

interface UIElements {
    log: HTMLElement | null;
    VictorySupply: HTMLElement | null;
    TreasureSupply: HTMLElement | null;
    KingdomSupply: HTMLElement | null;
    hand: HTMLElement | null;
    played: HTMLElement | null;
    actions: HTMLElement | null;
    buys: HTMLElement | null;
    coins: HTMLElement | null;
    phase: HTMLElement | null;
    deckCount: HTMLElement | null;
    discardCount: HTMLElement | null;
    scoreCount: HTMLElement | null;
    deckPile: HTMLElement | null;
    discardPile: HTMLElement | null;
    endTurnBtn: HTMLButtonElement | null;
    enterBuyPhaseBtn: HTMLButtonElement | null;
    startMenu: HTMLElement | null;
    startBtn: HTMLButtonElement | null;
    botCountSelect: HTMLSelectElement | null;
    opponents: HTMLElement | null;
    trashPile: HTMLElement | null;
    gameContainer: HTMLElement | null;
    botScores: HTMLElement | null;
    playerNameInput: HTMLInputElement | null;
    playerScoreBox: HTMLElement | null;
    playTreasuresBtn: HTMLButtonElement | null;
    confirmBtn: HTMLButtonElement | null;
    choiceArea: HTMLElement | null;
    endActionBtn: HTMLButtonElement | null; // This will map to "Fin Phase Action"
    createRoomBtn: HTMLButtonElement | null;
    joinRoomBtn: HTMLButtonElement | null;
    roomCodeInput: HTMLInputElement | null;
    lobbyView: HTMLElement | null;
    menuOptions: HTMLElement | null;
    roomNameDisplay: HTMLElement | null;
    roomCodeBox: HTMLElement | null;
    startMultiplayerBtn: HTMLButtonElement | null;
    leaveLobbyBtn: HTMLButtonElement | null;
    toggleReadyBtn: HTMLButtonElement | null;
    lobbyLogs: HTMLElement | null;
    playerListReady: HTMLElement | null;
    playerListWaiting: HTMLElement | null;
    addBotBtn: HTMLButtonElement | null;
    pregameOverlay: HTMLElement | null;
    readyBtn: HTMLButtonElement | null;
    readyStatus: HTMLElement | null;
    mainTitle: HTMLElement | null;
    surrenderBtn: HTMLButtonElement | null;
    surrenderModal: HTMLElement | null;
    surrenderYesBtn: HTMLButtonElement | null;
    surrenderNoBtn: HTMLButtonElement | null;
    playerCounter: HTMLElement | null;
    menuNotification: HTMLElement | null;
}

export class UIManager implements IGameUI {
    public elements: UIElements;
    private gameView: GameView | null = null;
    private lobby: LobbyUI;
    private hand: HandUI;
    private table: GameTableUI;
    private currentTurnColor: string | null = null;
    private intentCallback: (type: string, payload?: any) => void = () => { };

    constructor() {
        this.elements = {
            log: document.getElementById('game-log'),
            VictorySupply: document.getElementById('VictorySupply'),
            TreasureSupply: document.getElementById('TreasureSupply'),
            KingdomSupply: document.getElementById('KingdomSupply'),
            hand: document.getElementById('hand-area'),
            played: document.getElementById('played-cards'),
            actions: document.getElementById('actions-count'),
            buys: document.getElementById('buys-count'),
            coins: document.getElementById('coins-count'),
            phase: document.getElementById('phase-indicator'),
            deckCount: document.getElementById('deck-count'),
            discardCount: document.getElementById('discard-count'),
            scoreCount: document.getElementById('score-count'),
            deckPile: document.getElementById('deck-pile'),
            discardPile: document.getElementById('discard-pile'),
            endTurnBtn: document.getElementById('end-turn-btn') as HTMLButtonElement,
            enterBuyPhaseBtn: document.getElementById('end-action-btn') as HTMLButtonElement,
            startMenu: document.getElementById('start-menu'),
            startBtn: document.getElementById('start-game-btn') as HTMLButtonElement,
            botCountSelect: document.getElementById('bot-count') as HTMLSelectElement,
            opponents: document.getElementById('opponents-area'),
            trashPile: document.getElementById('trash-pile'),
            gameContainer: document.getElementById('game-container'),
            botScores: document.getElementById('bot-scores-container'),
            playerNameInput: document.getElementById('player-name-input') as HTMLInputElement,
            playerScoreBox: document.getElementById('player-score-box'),
            playTreasuresBtn: document.getElementById('play-treasures-btn') as HTMLButtonElement,
            confirmBtn: document.getElementById('confirm-input-btn') as HTMLButtonElement,
            choiceArea: document.getElementById('choice-buttons-area'),
            endActionBtn: document.getElementById('end-action-btn') as HTMLButtonElement,
            createRoomBtn: document.getElementById('create-room-btn') as HTMLButtonElement,
            joinRoomBtn: document.getElementById('join-room-btn') as HTMLButtonElement,
            roomCodeInput: document.getElementById('room-code-input') as HTMLInputElement,
            lobbyView: document.getElementById('lobby-view'),
            menuOptions: document.querySelector('.menu-options') as HTMLElement,
            roomNameDisplay: document.getElementById('room-name-display'),
            roomCodeBox: document.getElementById('room-code-box'),
            startMultiplayerBtn: document.getElementById('start-multiplayer-btn') as HTMLButtonElement,
            leaveLobbyBtn: document.getElementById('leave-lobby-btn') as HTMLButtonElement,
            toggleReadyBtn: document.getElementById('toggle-ready-btn') as HTMLButtonElement,
            lobbyLogs: document.getElementById('lobby-logs'),
            playerListReady: document.getElementById('player-list-ready'),
            playerListWaiting: document.getElementById('player-list-waiting'),
            addBotBtn: document.getElementById('add-bot-btn') as HTMLButtonElement,
            pregameOverlay: document.getElementById('pregame-overlay'),
            readyBtn: document.getElementById('ready-btn') as HTMLButtonElement,
            readyStatus: document.getElementById('ready-status'),
            mainTitle: document.getElementById('main-title'),
            surrenderBtn: document.getElementById('surrender-btn') as HTMLButtonElement,
            surrenderModal: document.getElementById('surrender-modal'),
            surrenderYesBtn: document.getElementById('surrender-yes-btn') as HTMLButtonElement,
            surrenderNoBtn: document.getElementById('surrender-no-btn') as HTMLButtonElement,
            playerCounter: document.getElementById('player-counter'),
            menuNotification: document.getElementById('menu-notification')
        };

        // DEBUG: Log which elements were found
        console.log('[UIManager] DOM Elements Check:', {
            log: !!this.elements.log,
            VictorySupply: !!this.elements.VictorySupply,
            TreasureSupply: !!this.elements.TreasureSupply,
            KingdomSupply: !!this.elements.KingdomSupply,
            hand: !!this.elements.hand,
            played: !!this.elements.played,
            opponents: !!this.elements.opponents,
            trashPile: !!this.elements.trashPile,
            gameContainer: !!this.elements.gameContainer
        });

        if (!this.elements.VictorySupply) console.error('[UIManager] #VictorySupply NOT FOUND');
        if (!this.elements.TreasureSupply) console.error('[UIManager] #TreasureSupply NOT FOUND');
        if (!this.elements.KingdomSupply) console.error('[UIManager] #KingdomSupply NOT FOUND');
        if (!this.elements.hand) console.error('[UIManager] #hand-area NOT FOUND');
        if (!this.elements.log) console.error('[UIManager] #game-log NOT FOUND');


        this.lobby = new LobbyUI(this.elements);
        this.hand = new HandUI(this.elements);
        this.table = new GameTableUI(this.elements);

        // Setup button handlers
        if (this.elements.endTurnBtn) {
            this.elements.endTurnBtn.onclick = () => this.intentCallback('END_TURN');
        }
        if (this.elements.playTreasuresBtn) {
            this.elements.playTreasuresBtn.onclick = () => this.intentCallback('PLAY_ALL_TREASURES');
        }
        if (this.elements.enterBuyPhaseBtn) {
            this.elements.enterBuyPhaseBtn.onclick = () => this.intentCallback('END_ACTION_PHASE');
        }
        if (this.elements.confirmBtn) {
            this.elements.confirmBtn.onclick = () => this.intentCallback('CONFIRM_INPUT');
        }
        if (this.elements.readyBtn) {
            this.elements.readyBtn.onclick = () => {
                console.log('[UIManager] Ready button clicked');
                this.intentCallback('TOGGLE_READY');
                if (this.elements.readyBtn) this.elements.readyBtn.style.display = 'none';
                if (this.elements.readyStatus) this.elements.readyStatus.innerText = "En attente des autres joueurs...";
            };
        }

        // Surrender Modal logic
        if (this.elements.surrenderBtn) {
            this.elements.surrenderBtn.onclick = () => {
                if (this.elements.surrenderModal) {
                    this.elements.surrenderModal.style.display = 'flex';
                }
            };
        }

        if (this.elements.surrenderNoBtn) {
            this.elements.surrenderNoBtn.onclick = () => {
                if (this.elements.surrenderModal) {
                    this.elements.surrenderModal.style.display = 'none';
                }
            };
        }

        if (this.elements.surrenderYesBtn) {
            this.elements.surrenderYesBtn.onclick = () => {
                this.intentCallback('ABANDON_GAME');
                if (this.elements.surrenderModal) {
                    this.elements.surrenderModal.style.display = 'none';
                }
            };
        }
    }

    setIntentCallback(callback: (type: string, payload?: any) => void) {
        this.intentCallback = callback;
        this.hand.setIntentCallback(callback);
        this.table.setIntentCallback(callback);
    }

    private lastLogCount: number = 0;
    syncLogs(view: GameView): void {
        const logs = view.logs;
        if (logs.length === this.lastLogCount) return;

        console.log('[UIManager] Syncing logs, count:', logs.length);
        const logContent = document.getElementById('game-log-content');
        if (!logContent) return;

        logContent.innerHTML = '';
        logs.forEach(l => {
            const player = view.players.find(p => p.id === l.playerId);
            this.log(l.text, player);
        });

        this.lastLogCount = logs.length;
    }

    /**
     * Main render method - renders the entire UI based on GameView
     */
    render(view: GameView): void {
        console.log('[UIManager] render() called, phase:', view.phase, 'isLobby:', view.isLobby);
        this.gameView = view;

        // Sync logs first to ensure journal is up to date
        this.syncLogs(view);

        // Show resignation button only for host
        if (this.elements.surrenderBtn) {
            this.elements.surrenderBtn.style.display = view.isHost ? 'flex' : 'none';
        }

        if (view.isLobby) {
            console.log('[UIManager] Early return - lobby phase');
            return;
        }

        // AGGRESSIVE OVERLAY CLEANUP - Prevent "Black Veil"
        // Force hide start menu and other modals when in game
        const overlaysToHide = ['start-menu', 'surrender-modal', 'loading-overlay'];
        overlaysToHide.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.style.display !== 'none') {
                console.log(`[UIManager] Force hiding overlay: ${id}`);
                el.style.setProperty('display', 'none', 'important');
            }
        });

        // Handle PREGAME phase - ready button ONLY during PREGAME, NEVER after game starts
        const isPreGame = view.phase === 'PreGame' || view.phase === 'PREGAME';
        console.log(`[UIManager] Phase Check: '${view.phase}', isPreGame=${isPreGame}, ReadyBtn=${!!this.elements.readyBtn}`);

        // Always hide ready button and status unless we're in PREGAME
        if (this.elements.readyBtn) this.elements.readyBtn.style.display = 'none';
        if (this.elements.readyStatus) this.elements.readyStatus.style.display = 'none';

        if (isPreGame) {
            if (this.elements.pregameOverlay) this.elements.pregameOverlay.style.display = 'flex';

            const amIReady = view.myPublicInfo?.isReady || false;

            if (this.elements.readyBtn) this.elements.readyBtn.style.display = amIReady ? 'none' : 'inline-block';
            if (this.elements.readyStatus) {
                this.elements.readyStatus.style.display = 'block';
                this.elements.readyStatus.innerText = amIReady ? "En attente des autres joueurs..." : "";
            }

            if (this.elements.endTurnBtn) this.elements.endTurnBtn.style.display = 'none';
            if (this.elements.playTreasuresBtn) this.elements.playTreasuresBtn.style.display = 'none';
            if (this.elements.enterBuyPhaseBtn) this.elements.enterBuyPhaseBtn.style.display = 'none';
        } else {
            // Not PreGame - FORCE HIDE EVERYTHING RELATED TO PREGAME
            if (this.elements.pregameOverlay) this.elements.pregameOverlay.style.setProperty('display', 'none', 'important');
            if (this.elements.readyBtn) this.elements.readyBtn.style.setProperty('display', 'none', 'important');
            if (this.elements.readyStatus) this.elements.readyStatus.style.setProperty('display', 'none', 'important');
        }



        console.log('[UIManager] Rendering hand, cards:', view.myHand.length);
        this.hand.render(view);

        console.log('[UIManager] Rendering supply, keys:', Object.keys(view.supply).length);
        this.table.renderSupply(view);

        console.log('[UIManager] Rendering played cards:', view.myPlayArea.length);
        this.table.renderPlayed(view);

        console.log('[UIManager] Updating controls');
        this.table.updateControls(view);

        console.log('[UIManager] Rendering status');
        this.table.renderStatus(view);

        console.log('[UIManager] Updating piles');
        this.table.updatePiles(view);

        console.log('[UIManager] Updating trash:', view.trash.length);
        this.table.updateTrash(view);

        console.log('[UIManager] Updating player score');
        this.table.updatePlayerScore(view);

        console.log('[UIManager] Rendering opponents:', view.opponents.length);
        this.table.renderOpponents(view);

        // Hide surrender button if not host
        if (this.elements.surrenderBtn) {
            this.elements.surrenderBtn.style.display = view.isHost ? 'flex' : 'none';
        }

        console.log('[UIManager] render() complete');
    }

    /**
     * @deprecated Use render(view) instead
     */
    update(): void {
        if (this.gameView) {
            this.render(this.gameView);
        }
    }

    /**
     * @deprecated No longer needed - UIManager now stateless regarding game
     */
    init(_game: any): void {
        // No-op for backwards compatibility
    }

    setPrompt(message: string): void {
        const promptEl = document.getElementById('action-prompt');
        if (promptEl) promptEl.textContent = message;
    }

    log(message: string, player: Player | null = null, replaceLast: boolean = false, logId?: string): void {
        const logEl = this.elements.log;
        if (!logEl) return;

        console.log(`[UIManager] logMsg: "${message}", replaceLast: ${replaceLast}, logId: ${logId}`);

        if (replaceLast) {
            // Priority 1: ID-based replacement (Deterministic)
            if (logId) {
                const existingEntry = logEl.querySelector(`[data-log-id="${logId}"]`);
                if (existingEntry) {
                    console.log(`[UIManager] Replacing log by ID ${logId}`);
                    existingEntry.remove();
                } else {
                    console.warn(`[UIManager] replaceLast=true with ID ${logId} but element not found`);
                }
            } else {
                // Priority 2: Fallback to last .log-entry (Legacy/Local logic)
                const entries = logEl.querySelectorAll('.log-entry');
                if (entries.length > 0) {
                    const lastEntry = entries[entries.length - 1];
                    console.log(`[UIManager] Removing last log entry (legacy)`);
                    lastEntry.remove();
                }
            }
        }

        // Track color for the current turn
        if (message.startsWith('Tour ') && player && player.color) {
            this.currentTurnColor = player.color as string;
        }

        const line = document.createElement('div');
        line.className = 'log-entry';
        if (logId) {
            line.setAttribute('data-log-id', logId);
        }

        // Apply turn color to the entire line
        if (this.currentTurnColor) {
            line.style.color = this.currentTurnColor;
        }

        // Helper to find valid player name in message
        // If player argument is provided, use it.
        // Otherwise, we might want to check if the message starts with a known player name.
        // For now, rely on player argument.

        if (player && player.name && player.color) {
            // If message starts with player name, colorize it
            if (message.startsWith(player.name)) {
                const color = player.color as string;
                const rest = message.substring(player.name.length);

                const nameSpan = document.createElement('span');
                nameSpan.style.color = color;
                nameSpan.style.fontWeight = 'bold';
                nameSpan.textContent = player.name;

                line.appendChild(nameSpan);
                line.appendChild(document.createTextNode(rest));
            } else {
                // Player involved but name not at start?
                // Current logic: Just prepend name if not present? 
                // User wants: "Saint-Louis joue..." -> Saint-Louis in green.
                // If the message is just "Phase Achat", we might want "Saint-Louis: Phase Achat"?
                // No, standard logs are "Tour X - [Player]".

                // If the name is inside the message somewhere? 
                // Let's check if the name is present.
                const idx = message.indexOf(player.name);
                if (idx !== -1) {
                    const part1 = message.substring(0, idx);
                    const part2 = message.substring(idx + player.name.length);

                    if (part1) line.appendChild(document.createTextNode(part1));

                    const nameSpan = document.createElement('span');
                    nameSpan.style.color = player.color as string;
                    nameSpan.style.fontWeight = 'bold';
                    nameSpan.textContent = player.name;
                    line.appendChild(nameSpan);

                    if (part2) line.appendChild(document.createTextNode(part2));
                } else {
                    // Name not found in message, fallback to colored prefix if meaningful?
                    // Usually "Phase Action" implies active player. 
                    // Let's just print message as is if name not found, 
                    // unless it's a generic message where we really want attribution.
                    // But for now, let's stick to coloring the name IF present.
                    line.appendChild(document.createTextNode(message));
                }
            }
        } else {
            line.appendChild(document.createTextNode(message));
        }

        logEl.appendChild(line);
        logEl.scrollTop = logEl.scrollHeight;
    }

    showGameOver(winner: { name: string, score: number }, summary: { name: string, score: number }[]): void {
        this.table.showGameOver(winner, summary);
    }

    async showRevealOverlay(player: Player, cards: Card[]): Promise<void> {
        return this.table.showRevealOverlay(player, cards);
    }

    hideRevealOverlay(): void {
        this.table.hideRevealOverlay();
    }

    /**
     * Handle reveal event from server (e.g., Bureaucrat reveal)
     * Creates temporary card objects from IDs and shows the overlay
     */
    handleRevealFromServer(playerName: string, cardIds: string[]): void {
        const overlay = document.getElementById('reveal-overlay');
        const cardsContainer = document.getElementById('reveal-cards');
        const titleEl = overlay?.querySelector('.reveal-title');

        if (!overlay || !cardsContainer) {
            console.warn('[UIManager] Reveal overlay elements not found');
            return;
        }

        // Set title
        if (titleEl) {
            titleEl.textContent = `${playerName} révèle :`;
        }

        // Import ALL_CARDS to create card elements
        import('../../shared/data/cardData.js').then(({ ALL_CARDS }) => {
            cardsContainer.innerHTML = '';

            cardIds.forEach(id => {
                const cardData = ALL_CARDS.find((c: any) => c.id === id);
                if (cardData) {
                    // Create a minimal card object for rendering
                    const tempCard = {
                        id: cardData.id,
                        name: cardData.name,
                        cost: cardData.cost,
                        types: cardData.types,
                        text: cardData.text || ''
                    };
                    const cardEl = CardRenderer.createCardElement(tempCard as any, null, 'standard');
                    cardsContainer.appendChild(cardEl);
                }
            });

            // Show overlay
            overlay.style.display = 'flex';

            // Hide after 2 seconds
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 2000);
        });
    }

    showSelectionOverlay(player: Player, cards: Card[], options: any): void {
        this.table.showSelectionOverlay(player, cards, options);
    }

    hideSelectionOverlay(): void {
        this.table.hideSelectionOverlay();
    }

    async animateCardMove(card: Card, sourceEl: HTMLElement, targetEl: HTMLElement, type: 'standard' | 'mini' = 'standard'): Promise<void> {
        return CardRenderer.animateCardMove(card, sourceEl, targetEl, type);
    }

    findPileElement(cardName: string): any { return this.table.findPileElement(cardName); }
    getZoneElement(player: Player, zoneName: ZoneName | string): any { return this.table.getZoneElement(player, zoneName as any); }
    getDiscardPileElement(player: Player): any { return this.table.getDiscardPileElement(player); }
    findCardElementInHand(cardName: string): any { return this.hand.findCardElementInHand(cardName); }
    findOpponentHandElement(player: Player): any { return this.table.findOpponentHandElement(player); }

    getPlayedAreaElement(): any { return this.elements.played; }

    showGameContainer(isHost: boolean): void {
        if (this.elements.startMenu) this.elements.startMenu.style.display = 'none';
        if (this.elements.gameContainer) this.elements.gameContainer.style.display = 'grid';
        if (this.elements.lobbyView) this.elements.lobbyView.style.display = 'none';

        // Initial check for surrender button
        if (this.elements.surrenderBtn) {
            this.elements.surrenderBtn.style.display = isHost ? 'flex' : 'none';
        }
    }

    showLoadingOverlay(message: string): void {
        const overlay = document.getElementById('loading-overlay');
        const text = document.getElementById('loading-text');
        if (overlay) overlay.style.display = 'flex';
        if (text) text.textContent = message;
    }

    hideLoadingOverlay(): void {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    showLobby(name: string, code: string): void {
        this.lobby.show(name, code);
        // Clear previous game logs
        if (this.elements.log) {
            this.elements.log.innerHTML = '';
        }
    }

    resetToMainMenu(message?: string): void {
        if (this.elements.startMenu) this.elements.startMenu.style.display = 'flex';
        if (this.elements.gameContainer) this.elements.gameContainer.style.display = 'none';
        if (this.elements.lobbyView) this.elements.lobbyView.style.display = 'none';
        if (this.elements.menuOptions) this.elements.menuOptions.style.display = 'flex';
        if (this.elements.mainTitle) this.elements.mainTitle.style.display = 'block';

        if (message) {
            this.showMenuNotification(message);
        } else {
            if (this.elements.menuNotification) this.elements.menuNotification.style.display = 'none';
        }
    }

    private notificationTimeout: ReturnType<typeof setTimeout> | null = null;
    showMenuNotification(msg: string, duration: number = 8000): void {
        if (!this.elements.menuNotification) return;

        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }

        this.elements.menuNotification.innerText = msg;
        this.elements.menuNotification.style.display = 'block';

        this.notificationTimeout = setTimeout(() => {
            if (this.elements.menuNotification) {
                this.elements.menuNotification.style.display = 'none';
            }
            this.notificationTimeout = null;
        }, duration);
    }

    showError(msg: string) {
        alert(msg);
    }

    setupStartMenu(callbacks: StartMenuCallbacks): void {
        this.lobby.setup(callbacks);
    }

    updateLobbyPlayers(players: NetworkPlayer[], isHost: boolean, myId: string): void {
        this.lobby.updatePlayers(players, isHost, myId);
    }

    async animateGameStart(): Promise<void> {
        console.log('[UIManager] Playing game start animation');

        // 1. Move Hand to Discard
        const handCards = Array.from(this.elements.hand?.querySelectorAll('.card') || []) as HTMLElement[];
        const discardEl = this.elements.discardPile;
        const deckEl = this.elements.deckPile;

        if (discardEl) {
            const animations = handCards.map(cardEl => {
                // Use a dummy card object for animation since we don't have the real object easily accessible/needed here
                // We just need the visual element to move
                // Actually CardRenderer.animateCardMove creates a new element based on a Card object.
                // We can just move the existing element? No, CardRenderer makes a copy.
                // Let's make a dummy card with the name from the element
                const name = cardEl.getAttribute('data-card-name') || 'Back';
                const dummyCard = new Card({ id: name.toLowerCase(), name: name, types: [], cost: 0, text: '' } as any);

                return this.animateCardMove(dummyCard, cardEl, discardEl, 'mini');
            });

            await Promise.all(animations);
        }

        // Clear hand immediately after animation starts/finishes
        if (this.elements.hand) this.elements.hand.innerHTML = '';

        // 2. Shuffle / Mix Discard (Shake animation)
        if (discardEl) {
            discardEl.classList.add('shake-animation');
            await new Promise(r => setTimeout(r, 800)); // Wait for shake
            discardEl.classList.remove('shake-animation');
        }

        // 3. Move Discard to Deck
        if (discardEl && deckEl) {
            const dummyCard = new Card({ id: 'back', name: 'Back', types: [], cost: 0 } as any);
            // Animate a few cards moving from discard to deck to simulate the pile moving
            await this.animateCardMove(dummyCard, discardEl, deckEl, 'mini');
            await new Promise(r => setTimeout(r, 100));
            await this.animateCardMove(dummyCard, discardEl, deckEl, 'mini');
            await new Promise(r => setTimeout(r, 100));
            await this.animateCardMove(dummyCard, discardEl, deckEl, 'mini'); // Final one
        }

        // Clear discard count visual temporarily until state update comes
        if (this.elements.discardCount) this.elements.discardCount.innerText = '0';
        if (this.elements.deckCount) this.elements.deckCount.innerText = '10'; // Assume 10 for now
    }
}
