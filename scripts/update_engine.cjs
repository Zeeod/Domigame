
const fs = require('fs');
const path = 'shared/engine/EffectEngine.ts';
const tempPath = 'shared/engine/EffectEngine.ts.tmp';

try {
    let content = fs.readFileSync(path, 'utf8');
    const lastBrace = content.lastIndexOf('}');
    if (lastBrace === -1) throw new Error('No closing brace found');

    content = content.substring(0, lastBrace);

    content += `
    private static handleAddToken(state: GameState, player: PlayerState, effect: any, _suppressLog: boolean, _sourceCardInstanceId?: string): EffectResult {
        if (effect.tokenType === 'coin') {
            player.coinTokens = (player.coinTokens || 0) + 1;
            this.log(state, \`\${player.name} ajoute un jeton Pièce sur son plateau.\`, player.id);
        } else if (effect.tokenType === 'embargo') {
             this.log(state, \`Jeton Embargo ajouté (logique complète à implémenter avec la carte).\`, player.id);
        }
        return { state, needsChoice: false };
    }

    private static handleScheduleExtraTurn(state: GameState, player: PlayerState): EffectResult {
        if (!state.extraTurns) state.extraTurns = [];
        state.extraTurns.push(player.id);
        this.log(state, \`\${player.name} planifie un tour supplémentaire !\`, player.id);
        return { state, needsChoice: false };
    }

    private static handlePeekBottom(state: GameState, player: PlayerState): EffectResult {
        if (player.deck.length === 0 && player.discardPile.length > 0) {
            player.deck = this.shuffle(player.discardPile, state);
            player.discardPile = [];
            this.log(state, \`\${player.name} mélange sa défausse.\`, player.id);
        }

        if (player.deck.length === 0) {
            this.log(state, \`\${player.name} regarde le fond de sa pioche (vide).\`, player.id);
            return { state, needsChoice: false };
        }

        const bottomCard = player.deck[player.deck.length - 1];
        const bottomCardDef = CardRegistry.get(bottomCard.id);
        
        this.log(state, \`\${player.name} regarde la carte du fond de sa pioche.\`, player.id);
        
        state.pendingDecision = {
            id: Math.random().toString(36).substring(7),
            playerId: player.id,
            type: PromptType.YES_NO,
            message: \`Carte du fond : \${bottomCardDef?.name}. La mettre sur le dessus ?\`,
            context: { 
                action: 'PEEK_BOTTOM_RESPONSE',
                cardInstanceId: bottomCard.instanceId 
            }
        };
        
        return { state, needsChoice: true };
    }

    private static handleRevealHand(state: GameState, player: PlayerState, _effect: any): EffectResult {
        state.revealedCards = {
            cards: [...player.hand],
            visibleTo: 'ALL',
            cause: 'REVEAL_HAND'
        };
        const names = player.hand.map(c => CardRegistry.get(c.id)?.name).join(', ');
        this.log(state, \`\${player.name} révèle sa main : \${names}.\`, player.id);
        return { state, needsChoice: false };
    }

    private static handleReturnToSupply(state: GameState, player: PlayerState, _effect: any): EffectResult {
        const revealed = state.revealedCards?.cards[0];
        if (!revealed) return { state, needsChoice: false };
        
        const cardName = CardRegistry.get(revealed.id)?.name || 'Carte inconnue';

        state.pendingDecision = {
            id: Math.random().toString(36).substring(7),
            playerId: player.id,
            type: PromptType.CHOOSE_CARDS,
            message: \`Renvoyez jusqu'à 2 copies de \${cardName} dans la réserve.\`,
            constraints: {
                min: 0,
                max: 2,
                sourceZone: 'HAND',
                filter: { cardIds: [revealed.id] }
            },
            context: {
                action: 'RETURN_TO_SUPPLY_RESPONSE',
                cardId: revealed.id
            }
        };
        
        return { state, needsChoice: true };
    }
}
`;
    // Write to temp file first
    fs.writeFileSync(tempPath, content, 'utf8');

    // Rename/Move to overwrite target
    // If target exists and is locked, this might still fail, but worth a shot.
    // Sometimes copy + delete is better but rename is atomic on POSIX.
    // On Windows, rename might fail if locked. 
    // We try to unlink first if possible, but that might fail too.

    try {
        if (fs.existsSync(path)) fs.unlinkSync(path);
        fs.renameSync(tempPath, path);
    } catch (e) {
        // Fallback: Copy content
        fs.copyFileSync(tempPath, path);
        fs.unlinkSync(tempPath);
    }

    console.log('Successfully updated EffectEngine.ts via temp file');
} catch (e) {
    console.error('Error:', e);
    process.exit(1);
}
