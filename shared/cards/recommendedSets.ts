
export interface RecommendedSet {
    name: string;
    description: string;
    expansions: string[];
    cards: string[];
    landscapes?: string[];
    prosperity?: 'always' | 'never' | 'random';
    shelters?: 'always' | 'never' | 'random';
}

export const RECOMMENDED_SETS: RecommendedSet[] = [
    {
        name: "Premier Jeu",
        description: "Le set classique pour apprendre les bases de Dominion.",
        expansions: ["base"],
        cards: ["cellar", "market", "merchant", "militia", "mine", "moat", "remodel", "smithy", "village", "workshop"]
    },
    {
        name: "Grande Richesse",
        description: "Un set axé sur les trésors et la génération d'argent.",
        expansions: ["base", "prosperity"],
        cards: ["chapel", "gardens", "village", "smithy", "market", "mine", "colony", "platinum", "gold", "silver"],
        prosperity: 'always'
    },
    {
        name: "Pillages & Butins",
        description: "Découvrez les richesses de l'extension Plunder.",
        expansions: ["plunder"],
        cards: ["abundance", "crucible", "pendant", "silver_mine", "wealthy_village", "cabin_boy", "crew", "first_mate", "flagship", "search"],
        landscapes: ["random:any"]
    },
    {
        name: "Soleil Levant",
        description: "L'art de la guerre et de la diplomatie à l'orientale.",
        expansions: ["rising_sun"],
        cards: ["daimyo", "ninja", "samurai", "poet", "rice_broker", "change", "artist", "aristocrat", "mountain_shrine", "river_shrine"],
        landscapes: ["random:any"]
    },
    {
        name: "Alliances Inattendues",
        description: "Utilisez vos faveurs et vos alliés pour triompher.",
        expansions: ["allies"],
        cards: ["sycophant", "hunter", "sentinel", "swap", "carpenter", "courier", "specialist", "elder", "student", "lich"],
        landscapes: ["random:any"]
    }
];
