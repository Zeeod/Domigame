/**
 * Accès à localStorage qui ne plante jamais (navigation privée, stockage
 * bloqué, environnement de test). Retourne null / ignore l'écriture si indisponible.
 */
export const safeStorage = {
    get(key: string): string | null {
        try {
            return globalThis.localStorage?.getItem(key) ?? null;
        } catch {
            return null;
        }
    },
    set(key: string, value: string): void {
        try {
            globalThis.localStorage?.setItem(key, value);
        } catch {
            // stockage indisponible : on ignore
        }
    },
};
