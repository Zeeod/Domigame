/**
 * Stress test: complete games between bots, random kingdoms and landscapes from every expansion,
 * real server setup (GameRoomV2). After every action: card count conserved, no refused bot action
 * left unanswered, no endless game.
 *
 *   npx tsx scripts/audit/stress.ts [games=50] [seed=1] [greedy|random]
 *
 * Report: logs/stress_report.json (one line per failing game, with its kingdom and last log lines).
 */
import fs from 'fs';
import { GameRoomV2 } from '../../server/GameRoomV2.js';
import { GameState } from '../../shared/engine/GameState.js';
import { createBot } from '../../shared/bot/index.js';
import '../../shared/bot/GreedyBot.js';
import '../../shared/bot/RandomBot.js';
import type { BotType } from '../../shared/bot/BotInterface.js';
import { actingPlayerFor } from '../../shared/engine/Possession.js';
import { SupplyGenerator } from '../../shared/engine/SupplyGenerator.js';
import { act, autoPayload, totalCards } from '../../tests/helpers/autoPlay.js';

export interface GameResult {
    game: number;
    players: number;
    kingdom: string[];
    landscapes: string[];
    finished: boolean;
    turns: number;
    error?: string;
    fallbacks: number;
    refusals?: string[];
    lastLogs?: string[];
}

const noop = () => undefined;
const mockIo: any = { to: () => ({ emit: noop }), emit: noop, sockets: { sockets: new Map() } };
const MAX_TURNS = 120;
const MAX_STEPS = 20000;

export function playGame(game: number, players: number, seed: number, botType: BotType = 'greedy'): GameResult {
    const id = `stress_${seed}_${game}`;
    const kingdom = SupplyGenerator.generate({ count: 10, seed: id } as any);
    const room = new GameRoomV2(mockIo, id, { kingdomCards: kingdom, sheltersMode: 'random', landscapeInstructions: ['any', 'any'] } as any);
    for (let i = 1; i <= players; i++) room.addPlayer({ id: 's' + i, join: noop, emit: noop } as any, 'Bot' + i, '#fff', 't' + i);
    room.players.forEach(p => (p.isReady = true));
    const log = console.log, warn = console.warn, error = console.error;
    console.log = console.warn = console.error = noop;
    const result: GameResult = { game, players, kingdom, landscapes: [], finished: false, turns: 0, fallbacks: 0 };
    let state = undefined as unknown as GameState;
    try {
        room.startGame(kingdom);
        const t = (room as any).turnTimer; if (t) clearTimeout(t);
        state = room.gameState;
        result.kingdom = [...(state.kingdomCards || kingdom)];
        result.landscapes = [...(state.landscapes || [])];
        const bots = new Map(state.players.map(p => [p.id, createBot(botType)]));
        let expected = totalCards(state);
        let removed = 0;

        for (let step = 0; step < MAX_STEPS; step++) {
            if (state.isGameOver) { result.finished = true; break; }
            if (state.turnNumber > MAX_TURNS) { result.error = `pas finie au tour ${MAX_TURNS}`; break; }

            const d = state.pendingDecision;
            const seat = d ? d.playerId : state.players[state.currentPlayerIndex].id;
            const actor = actingPlayerFor(state, seat);
            const bot = bots.get(actor)!;
            let action: any;
            try {
                action = d ? (bot.resolveChoice ? bot.resolveChoice(state, seat) : bot.chooseAction(state, seat)) : bot.chooseAction(state, seat);
            } catch (e: any) {
                action = undefined;
            }
            let r = action ? act(state, actor, action) : { ok: false, error: 'pas d\'action', state };
            if (!r.ok) {
                // The bot failed: answer like a careful player would, then carry on
                result.fallbacks++;
                const why = `${action?.type ?? '-'}${d ? '/' + ((d as any).context?.specialAction ?? d.type) : ''} : ${r.error}`;
                (result.refusals = result.refusals || []).push(why.slice(0, 160));
                const fallback = d ? { type: 'CHOOSE', choiceId: d.id, payload: autoPayload(state, 'first') } : { type: 'END_PHASE' };
                const r2 = act(state, actor, fallback);
                if (!r2.ok) { result.error = `bloqué : ${r.error} / secours : ${r2.error}`; break; }
                r = r2;
            }
            state = r.state;

            // Divine Wind removes piles from the game
            const nowRemoved = ((state as any).removedKingdom || []).length;
            if (nowRemoved !== removed) { removed = nowRemoved; expected = totalCards(state); }
            const n = totalCards(state);
            if (n !== expected) {
                result.error = `cartes : ${expected} → ${n} après ${action?.type ?? '?'} (tour ${state.turnNumber})`;
                break;
            }
            if (step === MAX_STEPS - 1) result.error = 'trop d\'actions (boucle ?)';
        }
    } catch (e: any) {
        result.error = `exception : ${e.message}`;
    } finally {
        console.log = log; console.warn = warn; console.error = error;
        const t = (room as any).turnTimer; if (t) clearTimeout(t);
    }
    result.turns = state?.turnNumber ?? 0;
    if (result.error && state) result.lastLogs = (state.history || []).slice(-8).map((l: any) => l.message || String(l));
    return result;
}

export function runStress(games: number, seed: number, botType: BotType = 'greedy'): GameResult[] {
    const out: GameResult[] = [];
    for (let g = 0; g < games; g++) out.push(playGame(g, 2 + (g % 3), seed, botType));
    return out;
}

const isMain = process.argv[1] && /stress\.ts$/.test(process.argv[1]);
if (isMain) {
    const games = Number(process.argv[2] || 50);
    const seed = Number(process.argv[3] || 1);
    const botType = (process.argv[4] || 'greedy') as BotType;
    const results = runStress(games, seed, botType);
    const failed = results.filter(r => r.error);
    fs.mkdirSync('logs', { recursive: true });
    fs.writeFileSync('logs/stress_report.json', JSON.stringify(failed, null, 2));
    const fin = results.filter(r => r.finished);
    console.log(`${fin.length}/${games} parties terminées, ${failed.length} en échec. Tours moyens : ${Math.round(fin.reduce((a, r) => a + r.turns, 0) / (fin.length || 1))}. Secours des bots : ${results.reduce((a, r) => a + r.fallbacks, 0)}.`);
    for (const f of failed) console.log(`#${f.game} (${f.players}j) ${f.error}`);
    const counts: Record<string, number> = {};
    for (const r of results) for (const x of r.refusals || []) counts[x] = (counts[x] || 0) + 1;
    for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`REFUS ${v}× ${k}`);
    process.exit(0);
}
