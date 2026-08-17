import { NetworkPlayer } from '../../../shared/types';

export interface StartMenuCallbacks {
    onCreateRoom: (playerName: string) => void;
    onJoinRoom: (code: string, playerName: string) => void;
    onStartGame: () => void;
    onLeaveLobby: () => void;
    onToggleReady: () => void;
    onKickPlayer: (playerId: string) => void;
    onAddBot: () => void;
    onForceEndGame?: () => void;
    onGameEnded?: () => void;
}

export class LobbyUI {
    private elements: any;
    private _onKickPlayer: ((pid: string) => void) | null = null;

    constructor(elements: any) {
        this.elements = elements;
    }

    setup(callbacks: StartMenuCallbacks): void {
        this._onKickPlayer = callbacks.onKickPlayer;

        // Restore saved name
        const savedName = localStorage.getItem('dominion_username');
        if (savedName && this.elements.playerNameInput) {
            this.elements.playerNameInput.value = savedName;
        }

        // Save name on input
        this.elements.playerNameInput?.addEventListener('input', (e: Event) => {
            const input = e.target as HTMLInputElement;
            localStorage.setItem('dominion_username', input.value.trim());
        });

        this.elements.createRoomBtn?.addEventListener('click', () => {
            const playerName = this.elements.playerNameInput.value.trim() || 'Joueur';
            callbacks.onCreateRoom(playerName);
        });

        this.elements.joinRoomBtn?.addEventListener('click', () => {
            const playerName = this.elements.playerNameInput.value.trim() || 'Joueur';
            const code = this.elements.roomCodeInput.value.trim();
            if (code.length < 4) {
                alert('Code invalide');
                return;
            }
            callbacks.onJoinRoom(code, playerName);
        });

        this.elements.startMultiplayerBtn?.addEventListener('click', () => {
            if (this.elements.startMultiplayerBtn) {
                this.elements.startMultiplayerBtn.innerText = "LANCEMENT...";
                this.elements.startMultiplayerBtn.disabled = true;
            }
            callbacks.onStartGame();
        });

        this.elements.leaveLobbyBtn?.addEventListener('click', () => {
            this.hide();
            callbacks.onLeaveLobby();
        });

        this.elements.toggleReadyBtn?.addEventListener('click', () => {
            callbacks.onToggleReady();
        });

        this.elements.addBotBtn?.addEventListener('click', () => {
            callbacks.onAddBot();
        });
    }

    show(name: string, code: string): void {
        if (this.elements.menuOptions) this.elements.menuOptions.style.display = 'none';
        if (this.elements.lobbyView) this.elements.lobbyView.style.display = 'flex';
        if (this.elements.mainTitle) this.elements.mainTitle.style.display = 'none';

        if (this.elements.roomNameDisplay) this.elements.roomNameDisplay.innerText = name;
        if (this.elements.roomCodeBox) {
            this.elements.roomCodeBox.innerText = code;
            this.elements.roomCodeBox.onclick = () => {
                if (code === 'Connexion...') return;
                navigator.clipboard.writeText(code).then(() => {
                    this.elements.roomCodeBox.classList.add('copied');
                    setTimeout(() => this.elements.roomCodeBox.classList.remove('copied'), 1500);
                });
            };
        }
    }

    hide(): void {
        if (this.elements.menuOptions) this.elements.menuOptions.style.display = 'flex';
        if (this.elements.lobbyView) this.elements.lobbyView.style.display = 'none';
    }

    updatePlayers(players: NetworkPlayer[], isHost: boolean, myId?: string): void {
        console.log('[LOBBY] updatePlayers:', players.length, 'players, isHost:', isHost);
        if (!this.elements.playerListReady || !this.elements.playerListWaiting) return;

        this.elements.playerListReady.innerHTML = '';
        this.elements.playerListWaiting.innerHTML = '';


        players.forEach(p => {
            const el = document.createElement('div');
            el.className = 'lobby-player-item';
            if (p.id === myId) el.classList.add('is-me');
            if (p.isHost) el.classList.add('is-host');

            const botBadge = p.isBot ? '<span class="lobby-player-badge is-bot">BOT</span>' : '';
            const hostBadge = p.isHost ? '<span class="lobby-player-badge host-badge">HÔTE</span>' : '';
            const kickBtn = isHost && !p.isHost ? `<button class="kick-btn" data-player-id="${p.id}">✕</button>` : '';

            el.innerHTML = `
                <span class="lobby-player-name">${p.name}</span>
                <div class="lobby-player-status">
                    ${hostBadge}
                    ${kickBtn}
                    ${botBadge}
                    <span class="lobby-player-ready-badge ${p.isReady ? 'ready-yes' : 'ready-no'}">${p.isReady ? 'PRÊT' : 'ATTENTE'}</span>
                </div>
            `;

            if (p.isReady) this.elements.playerListReady.appendChild(el);
            else this.elements.playerListWaiting.appendChild(el);
        });

        // Update player counter (Ready players / 5)
        if (this.elements.playerCounter) {
            const readyCount = players.filter(p => p.isReady).length;
            this.elements.playerCounter.innerText = `${readyCount}/5 JOUEURS`;
        }

        // Set up kick buttons
        document.querySelectorAll('.kick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pid = (e.currentTarget as HTMLElement).getAttribute('data-player-id');
                if (pid && this._onKickPlayer) this._onKickPlayer(pid);
            });
        });

        const readyPlayersCount = players.filter(p => p.isReady).length;

        // 1. Ajouter un bot (Only for host)
        if (this.elements.addBotBtn) {
            // Hide if not host OR if ready list is full
            const shouldBeVisible = isHost && readyPlayersCount < 5;
            this.elements.addBotBtn.style.display = shouldBeVisible ? 'block' : 'none';
            this.elements.addBotBtn.disabled = readyPlayersCount >= 5;
        }

        // 2. Ready button for ALL players + Start button for host
        if (this.elements.startMultiplayerBtn && this.elements.toggleReadyBtn) {
            const me = players.find(p => p.id === myId);
            const humans = players.filter(p => !p.isBot);
            const allHumansReady = humans.every(p => p.isReady);
            const minPlayers = players.length >= 2;
            const canStart = allHumansReady && minPlayers;

            // Show ready button for non-hosts (host is always ready)
            this.elements.toggleReadyBtn.style.display = isHost ? 'none' : 'flex';

            if (me?.isReady) {
                this.elements.toggleReadyBtn.innerText = "JE NE SUIS PLUS PRÊT";
                this.elements.toggleReadyBtn.classList.remove('btn-ready-initial');
                this.elements.toggleReadyBtn.classList.add('ready-active');
                this.elements.toggleReadyBtn.disabled = false;
            } else if (readyPlayersCount >= 5) {
                this.elements.toggleReadyBtn.innerText = "SALLE PLEINE";
                this.elements.toggleReadyBtn.classList.remove('ready-active', 'btn-ready-initial');
                this.elements.toggleReadyBtn.disabled = true;
            } else {
                this.elements.toggleReadyBtn.innerText = "JE SUIS PRÊT";
                this.elements.toggleReadyBtn.classList.add('btn-ready-initial');
                this.elements.toggleReadyBtn.classList.remove('ready-active');
                this.elements.toggleReadyBtn.disabled = false;
            }

            // Host also sees the Start button
            if (isHost) {
                this.elements.startMultiplayerBtn.style.display = 'flex';
                this.elements.startMultiplayerBtn.disabled = !canStart;
                if (!minPlayers) {
                    this.elements.startMultiplayerBtn.innerText = "ATTENTE JOUEURS";
                } else if (!allHumansReady) {
                    this.elements.startMultiplayerBtn.innerText = "ATTENTE PRÊTS";
                } else {
                    this.elements.startMultiplayerBtn.innerText = "LANCER LA PARTIE";
                }
            } else {
                this.elements.startMultiplayerBtn.style.display = 'none';
            }
        }

        // 3. Quitter (Always visible/enabled)
    }

    updateLogs(logs: any[]): void {
        if (!this.elements.lobbyLogs) return;
        this.elements.lobbyLogs.innerHTML = logs.map(l => `<div>${typeof l === 'string' ? l : l.text}</div>`).join('');
        this.elements.lobbyLogs.scrollTop = this.elements.lobbyLogs.scrollHeight;
    }
}
