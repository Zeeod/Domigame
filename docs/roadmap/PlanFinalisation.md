# Plan de finalisation — Dominion JS

*État mesuré le 20/10/2026 (tests lancés, registre de cartes inspecté). Remplace la phase 4 de [ProEngineRoadmap.md](ProEngineRoadmap.md).*

## Où en est le projet

| Indicateur | Valeur |
| --- | --- |
| Erreurs TypeScript | **0** |
| Tests | **458**, dont **401 OK** et **57 en échec** |
| Cartes enregistrées | **780** |
| Cartes « coquilles » (texte présent, aucun effet codé) | **~110** |
| Cartes officielles absentes du registre | **~35** (détail en phase 2) |
| Cartes avec artwork | **91 / 780** (689 manquants) |
| Parties de bots qui se terminent (test de stabilité) | **0 / 5** avant le tour 30 |

Commande pour régénérer l'inventaire (cartes par extension + artworks manquants) :
```bash
npx tsx scripts/audit/card_inventory.ts   # liste complète dans logs/card_inventory.json
```

**Ordre recommandé** : Phase 0 → 1 → 2 (extension par extension) → 3 → 4/5 en parallèle → 6 → 7.
On ne commence pas une extension tant que les tests de la précédente ne sont pas tous au vert.

---

## Phase 0 — Corrections rapides (taille S)

**✅ Terminée le 20/10/2026.**

- [x] **Étiquettes d'extension** : toutes les cartes ont maintenant `expansion` avec un id canonique (`seaside`, `dark_ages`…). Le doublon `set` est supprimé. Source de vérité : `shared/cards/expansions.ts` (`getCardExpansion()`, `EXPANSION_LABELS`).
  - *Bug corrigé au passage* : le lobby envoyait `dark_ages` alors que les cartes portaient « Dark Ages », donc **les cartes Dark Ages n'étaient jamais tirées** quand on filtrait par extension.
- [x] **Tests client** : environnement jsdom, contexte `CardInspectProvider` dans le test, accès à `localStorage` sécurisé (`client/utils/safeStorage.ts`).
- [x] **Cartes non finies exclues** du tirage du royaume, du tirage des paysages et du sélecteur du lobby : liste `shared/cards/unfinished.ts`, gardée à jour par `tests/cards/UnfinishedCards.test.ts`.
- [x] **Intégration continue** : `.github/workflows/ci.yml` (types, build, tests). *Elle restera rouge tant que la phase 1 n'est pas finie.*

---

## Phase 1 — Remettre les 57 tests au vert (taille L)

Les échecs sont regroupés par cause probable. Corriger famille par famille : une correction du moteur règle souvent plusieurs tests d'un coup.
**Règle d'arbitrage** : quand le test et le code ne sont pas d'accord, c'est le PDF de règles (`docs/rules/`) qui tranche. Certains tests sont peut-être simplement obsolètes par rapport à l'API actuelle (ex. `expected 'ZONE_CHOICE' to be 'TRASH'`).

### 1.1 Réactions et attaques (5 tests) — priorité haute, ça touche le jeu de base
- [ ] Sorcière bloquée par Douves (`BaseGame`)
- [ ] Caravan Guard : réagir à une attaque et jouer la durée hors de son tour (`ComplexCards`, `DebugCaravan`)
- [ ] Chaîne de réactions Diplomat puis Douves (`repro_reaction_loop`)
- [ ] Chevaliers : l'attaquant est écarté si la victime écarte un Chevalier (`Knights`)

### 1.2 Plateaux (mats) et durées Seaside (7 tests)
- [ ] Native Village, Island (mise de côté sur le plateau)
- [ ] Outpost : tour supplémentaire (le moteur renvoie `VOYAGE` au lieu de `OUTPOST`)
- [ ] Treasure Map (×2), Sea Chart (×2)

### 1.3 Types de décisions et choix (≈12 tests)
- [ ] Rats, Clerk, Duchess, Graverobber, Salvager
- [ ] Secret Passage (×2, insertion dans la pioche)
- [ ] Promos : Captain, Black Market, Envoy, Prince
- [ ] Tiara (×2)

### 1.4 Déclencheurs à la réception, à l'écart et à l'achat (≈9 tests)
- [ ] Fortress, Hunting Grounds (à l'écart)
- [ ] Cemetery, Hoard, Exile (à la réception)
- [ ] Hovel (à l'achat d'une Victoire), Anvil, Bishop
- [ ] Ordre des déclencheurs simultanés à l'achat (`SimultaneousResolution`)

### 1.5 Mise en place (2 tests)
- [ ] Abris (Shelters) quand le royaume contient des cartes Dark Ages
- [ ] Pile mixte des Ruines quand des Looters sont présents

### 1.6 Effets génériques du moteur (≈18 tests)
- [ ] `MechanicsAuditV2` (6) : ADD/SPEND_FAVORS, CHANGE_PHASE, ROTATE_PILE, ADD_MONEY_PER_CARD_IN_HAND, PLAY_THIS_CARD, GAIN_THIS_CARD
- [ ] `MechanicsB` (2) : Adventurer, Sentry
- [ ] `GenericEffectRefactor` (2) : Vassal, Patrol
- [ ] `Cleanup` (2) : nettoyage des déclencheurs de tour, `costReduction`
- [ ] `EconomyRepro`, Crossroads (×2), Rabble, Enlightenment (Prophétie)
- [ ] `PLAY_ALL_TREASURES` en phase Action avec passage automatique en phase Achat (`repro_bug_buy`)

### 1.7 IA (1 test)
- [ ] SmartBot achète Or au lieu de Province quand il est riche

**Critère de fin** : `npm test` 100 % vert, et cette règle notée dans CONTEXT.md : aucun commit sur `main` avec un test rouge.

---

## Phase 2 — Compléter toutes les extensions (taille XL)

Pour chaque extension, dans l'ordre :
1. Coder les cartes manquantes et les coquilles.
2. Écrire au moins **un test par carte** dans `tests/cards/<extension>/`.
3. Vérifier le texte français et les règles contre le PDF de `docs/rules/`.
4. Jouer une partie avec un royaume 100 % de cette extension, contre les bots.

### 2.1 Éditions — DÉCIDÉ : dernière édition partout
Les PDF du dossier `docs/rules/` sont ceux des dernières éditions. **Décision (20/10/2026) : on vise la dernière édition de chaque extension.** Les cartes retirées dans la dernière édition sont sorties du registre (le code peut rester dans git, mais il n'est plus proposé en partie).
- **Hinterlands** : le registre contient la liste de la 1re édition. Les 9 cartes de la 2e édition **ont un fichier mais ne sont pas enregistrées** : berserker, cauldron, guard_dog, nomads, souk, trail, weaver, wheelwright, witchs_hut. Il manque aussi **Fool's Gold**, présente dans les deux éditions.
- **Cornucopia & Guilds** (PDF 2023) : le registre contient la 1re édition. Les cartes de la 2e édition manquent : Carnival, Farmhands, Ferryman, Joust (+ les 6 Récompenses), Shop.

### 2.2 Cartes absentes du registre
| Extension | Manquantes |
| --- | --- |
| Hinterlands | Fool's Gold + les 9 cartes 2e édition ci-dessus |
| Nocturne | **Tracker** (carte royaume), Wish, Bat, Zombies, les 7 **États** (Deluded, Envious, Miserable, Twice Miserable, Lost in the Woods…) |
| Promos | Governor, Stash, Walled Village |
| Cornucopia & Guilds | Cartes 2e édition (voir 2.1) |

*Les IDs ont été cherchés sous leur nom anglais en `snake_case`. Si une carte existe sous un autre nom, corriger l'ID.*

### 2.3 Coquilles vides à coder (~110 cartes)
Ces cartes ont un nom et un texte, mais **aucun effet**, et le moteur ne les référence nulle part :

| Extension | Cartes | Nb |
| --- | --- | --- |
| **Empires** | Les 21 Landmarks (aqueduct, arena, bandit_fort, basilica, baths, battlefield, colonnade, defiled_shrine, fountain, keep, labyrinth, mountain_pass, museum, obelisk, orchard, palace, tomb, tower, triumphal_arch, wall, wolf_den) + kings_castle | 22 |
| **Allies** | Les 23 cartes Allié (architects_guild, band_of_nomads, cave_dwellers, circle_of_witches, city_state, coastal_haven, crafters_guild, desert_guides, family_of_inventors, fellowship_of_scribes, forest_dwellers, gang_of_pickpockets, island_folk, league_of_bankers, league_of_shopkeepers, market_towns, mountain_folk, order_of_astrologers, order_of_masons, peaceful_cult, plateau_shepherds, trappers_lodge, woodcarvers_guild) | 23 |
| **Plunder** | Événements (avoid, bury, deliver, foray, invasion, journey, launch, maelstrom, mirror, peril, prepare, prosper, rush, scrounge) + Traits (cheap, fated, inherited, patient, shy, tireless) + looting | 21 |
| **Renaissance** | Projets (academy, barracks, canal, capitalism, citadel, crop_rotation, exploration, fair, fleet, guildhall, innovation, pageant, piazza, road_network, sewers, silos, sinister_plot, star_chart) + sculptor, scepter | 20 |
| **Rising Sun** | Événements (amass, asceticism, continue, credit, foresight, gather, kintsugi, practice, receive_tribute, sea_trade) | 10 |
| **Menagerie** | Événements (banish, commerce, enhance, invest, march, populate, pursue, stampede, transport) + way_of_the_mouse | 10 |
| **Nocturne** | crypt, devils_workshop, fool, necromancer, pooka, vampire + Hex **Bad Omens** (effets vides) | 7 |

*Les piles « conteneurs » (ruins, knights, castles_pile, augurs_pile, …) n'ont pas d'effet, c'est normal.*

**À chaque carte codée : retirer son id de `shared/cards/unfinished.ts`** (le test `UnfinishedCards` le rappelle).

**Manque découvert** : rien dans le moteur ne choisit une carte Allié quand une carte Liaison (Allies) est dans le royaume. À ajouter en même temps que les Alliés.

### 2.4 Ordre conseillé des extensions
Du plus fiable au plus complexe, pour que le jeu soit jouable tôt :
1. **Base, Intrigue** (complètes : finir les tests)
2. **Seaside, Prosperity, Alchemy** (complètes : finir les tests)
3. **Hinterlands 2e éd., Cornucopia & Guilds 2e éd., Promos**
4. **Dark Ages, Adventures**
5. **Nocturne** (États, Tracker, Bad Omens, 6 coquilles)
6. **Renaissance** (Projets), **Menagerie** (Événements)
7. **Empires** (Landmarks)
8. **Allies** (Alliés), **Plunder** (Événements et Traits), **Rising Sun** (Événements)

### 2.5 TODO du code liés aux règles
- [ ] `shared/engine/DurationManager.ts:121` : logique des durées `CONDITIONAL` non implémentée (elles restent en jeu indéfiniment).
- [ ] `shared/engine/effects/ConditionEffectHandler.ts:140` : certaines conditions ne sont pas implémentées (simple avertissement dans la console).
- [ ] `shared/engine/EffectUtils.ts:371` : intégration avec `TriggerEffectHandler`.
- [ ] `shared/cards/landscapes/MenagerieLandscapes.ts:32` et `registerLandscapes.ts:19` : enregistrement des paysages pas terminé.

---

## Phase 3 — Stabilité des parties complètes (taille M)

- [ ] **Les bots ne terminent pas leurs parties** : dans le test de stabilité, 0 partie sur 5 est finie au tour 30. Trouver si c'est la stratégie des bots (ils n'achètent pas de Provinces) ou un blocage du moteur.
- [ ] Test de stress étendu : 200 parties avec des royaumes aléatoires **sur toutes les extensions**, et vérification des invariants à chaque action :
  - le nombre total de cartes est conservé ;
  - aucune décision n'attend un joueur absent ;
  - aucune boucle infinie.
- [ ] Parties à 3 et 4 joueurs (les tests sont surtout à 2).
- [ ] Déconnexion et reconnexion en pleine décision (attaque, réaction).

---

## Phase 4 — Interface par mécanique (taille L, à vérifier en jouant)

Chaque mécanique doit être **visible et utilisable** dans l'interface, pas seulement dans le moteur. Liste à valider en jouant une partie par extension :
- [ ] Plateaux : Taverne, Exil, Village Indigène, Île, cartes mises de côté
- [ ] Jetons : Coffres, Villageois, Faveurs, Dette, PV, jetons d'Aventures (+1 Carte, −2 💰, etc.)
- [ ] Bienfaits, Maléfices et États (Nocturne), Héritages
- [ ] Paysages : Événements, Projets, Landmarks, Voies, Alliés, Traits, Prophéties (affichage + achat + jetons posés dessus)
- [ ] Phase Nuit, Dette à rembourser, Potion dans les coûts
- [ ] Piles mixtes et piles divisées (carte du dessus visible)
- [ ] `client/components/BoardLayout.tsx:536` : TODO sur le support de `cardIds` pour les choix de type SUPPLY

---

## Phase 5 — Fonctionnalités restantes (taille M)

- [ ] **Sauvegarde des parties en base** pour pouvoir reprendre une partie (l'état est déjà sérialisable grâce à Immer).
- [ ] **Mode spectateur avancé** : la base existe (`isSpectator`, `spectatorFollowId` dans `GameRoomV2`), il reste l'interface pour choisir le joueur suivi.
- [ ] Statistiques : `server/Database.ts:273`, calculer `favoriteCard`.
- [ ] Bot SmartBot : `shared/bot/SmartBot.ts:95`, évaluer les choix d'écart, de défausse et de réception (aujourd'hui seuls les achats sont évalués).

---

## Phase 6 — Artworks (fait par toi)

- 689 cartes n'ont pas d'image. La liste exacte par extension est dans `logs/card_inventory.json` (lancer `npx tsx scripts/audit/card_inventory.ts`).
- **Convention** : `client/public/card-images/<id_carte>.jpg` (ou `.png`), où `<id_carte>` est l'`id` de la définition (ex. `fishing_village.jpg`).
- Si l'image manque, l'interface affiche déjà un placeholder : le jeu reste jouable sans artwork.
- Après ajout, relancer le script d'inventaire pour vérifier le compte.
- À nettoyer au passage : `client/components/CardFrame.tsx` contient une table `CARD_DATA` codée en dur (nom, coût, texte, image) qui double le registre de cartes. À terme, lire ces infos depuis `shared/cards`.

---

## Phase 7 — Mise en production (taille S)

- [ ] Découper le bundle client (avertissement Vite : morceau > 500 kB) avec des `import()` dynamiques.
- [ ] Tester le build Docker sur le NAS (`docs/deployment/SYNOLOGY_DEPLOYMENT.md`).
- [ ] Versionner les sorties (tags git `v1.0.0`…), avec un court CHANGELOG.

---

## Récapitulatif

| Phase | Contenu | Taille |
| --- | --- | --- |
| 0 | Corrections rapides, CI | S |
| 1 | 57 tests au vert | L |
| 2 | ~35 cartes manquantes + ~110 coquilles + tests par carte | XL |
| 3 | Stabilité (bots qui finissent, stress multi-extensions) | M |
| 4 | Interface pour chaque mécanique | L |
| 5 | Sauvegarde, spectateur, stats, IA | M |
| 6 | Artworks (toi) | — |
| 7 | Production | S |
