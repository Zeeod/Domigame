import { CardData } from '../../shared/Card';

export const ALL_CARDS: CardData[] = [
    {
        "id": "copper",
        "name": "Cuivre",
        "cost": 0,
        "types": ["Treasure"],
        "text": "1 pièce.",
        "effects": {
            "coins": 1
        },
        "expansion": "Base"
    },
    {
        "id": "silver",
        "name": "Argent",
        "cost": 3,
        "types": ["Treasure"],
        "text": "2 pièces.",
        "effects": {
            "coins": 2
        },
        "expansion": "Base"
    },
    {
        "id": "gold",
        "name": "Or",
        "cost": 6,
        "types": ["Treasure"],
        "text": "3 pièces.",
        "effects": {
            "coins": 3
        },
        "expansion": "Base"
    },
    {
        "id": "estate",
        "name": "Domaine",
        "cost": 2,
        "types": ["Victory"],
        "text": "1 Point de Victoire.",
        "effects": {
            "victoryPoints": 1
        } as any,
        "expansion": "Base"
    },
    {
        "id": "duchy",
        "name": "Duché",
        "cost": 5,
        "types": ["Victory"],
        "text": "3 Points de Victoire.",
        "effects": {
            "victoryPoints": 3
        } as any,
        "expansion": "Base"
    },
    {
        "id": "province",
        "name": "Province",
        "cost": 8,
        "types": ["Victory"],
        "text": "6 Points de Victoire.",
        "effects": {
            "victoryPoints": 6
        } as any,
        "expansion": "Base"
    },
    {
        "id": "curse",
        "name": "Malédiction",
        "cost": 0,
        "types": ["Curse"],
        "text": "-1 Point de Victoire.",
        "effects": {
            "victoryPoints": -1
        } as any,
        "expansion": "Base"
    },
    {
        "id": "cellar",
        "name": "Cave",
        "cost": 2,
        "types": ["Action"],
        "text": "+1 Action. Défaussez autant de cartes que vous voulez -> +1 Carte par carte défaussée.",
        "effects": {
            "actions": 1
        },
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "chapel",
        "name": "Chapelle",
        "cost": 2,
        "types": ["Action"],
        "text": "Écartez jusqu'à 4 cartes de votre main.",
        "effects": {},
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "moat",
        "name": "Douves",
        "cost": 2,
        "types": ["Action", "Reaction"],
        "text": "+2 Cartes. Lorsqu'un autre joueur joue une carte Attaque, vous pouvez révéler cette carte de votre main -> l'Attaque ne vous atteint pas.",
        "effects": {
            "cards": 2
        },
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "harbinger",
        "name": "Présage",
        "cost": 3,
        "types": ["Action"],
        "text": "+1 Carte, +1 Action. Regardez dans votre défausse, vous pouvez prendre une carte et la mettre sur votre deck.",
        "effects": {
            "cards": 1,
            "actions": 1
        },
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "merchant",
        "name": "Marchand",
        "cost": 3,
        "types": ["Action"],
        "text": "+1 Carte, +1 Action. La première fois que vous jouez un Argent ce tour-ci -> +1 pièce.",
        "effects": {
            "cards": 1,
            "actions": 1
        },
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "vassal",
        "name": "Vassal",
        "cost": 3,
        "types": ["Action"],
        "text": "+2 Pièces. Défaussez la carte du dessus de votre deck. Si c'est une carte Action, vous pouvez la jouer.",
        "effects": {
            "coins": 2
        },
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "village",
        "name": "Village",
        "cost": 3,
        "types": ["Action"],
        "text": "+1 Carte, +2 Actions.",
        "effects": {
            "cards": 1,
            "actions": 2
        },
        "expansion": "Base"
    },
    {
        "id": "workshop",
        "name": "Atelier",
        "cost": 3,
        "types": ["Action"],
        "text": "Recevez une carte coûtant jusqu'à 4 pièces.",
        "effects": {},
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "bureaucrat",
        "name": "Bureaucrate",
        "cost": 4,
        "types": ["Action", "Attack"],
        "text": "Recevez un argent sur votre deck. Chaque autre joueur révèle une carte Victoire de sa main et la met sur son deck (ou révèle une main sans Victoire).",
        "effects": {},
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "gardens",
        "name": "Jardins",
        "cost": 4,
        "types": ["Victory"],
        "text": "Vaut 1 Point de Victoire pour chaque 10 cartes dans votre deck (arrondi à l'inférieur).",
        "effects": {},
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "militia",
        "name": "Milice",
        "cost": 4,
        "types": ["Action", "Attack"],
        "text": "+2 Pièces. Chaque autre joueur défausse jusqu'à avoir 3 cartes en main.",
        "effects": {
            "coins": 2
        },
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "moneylender",
        "name": "Prêteur sur gages",
        "cost": 4,
        "types": ["Action"],
        "text": "Vous pouvez écarter un Cuivre de votre main -> +3 Pièces.",
        "effects": {},
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "poacher",
        "name": "Braconnier",
        "cost": 4,
        "types": ["Action"],
        "text": "+1 Carte, +1 Action, +1 Pièce. Défaussez une carte par pile de provision vide.",
        "effects": {
            "cards": 1,
            "actions": 1,
            "coins": 1
        },
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "remodel",
        "name": "Rénovation",
        "cost": 4,
        "types": ["Action"],
        "text": "Écartez une carte de votre main. Recevez une carte coûtant jusqu'à 2 pièces de plus que la carte écartée.",
        "effects": {},
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "smithy",
        "name": "Forgeron",
        "cost": 4,
        "types": ["Action"],
        "text": "+3 Cartes.",
        "effects": {
            "cards": 3
        },
        "expansion": "Base"
    },
    {
        "id": "throne_room",
        "name": "Salle du Trône",
        "cost": 4,
        "types": ["Action"],
        "text": "Vous pouvez jouer une carte Action de votre main 2 fois.",
        "effects": {},
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "bandit",
        "name": "Brigand",
        "cost": 5,
        "types": ["Action", "Attack"],
        "text": "Recevez un Or. Chaque autre joueur révèle les 2 cartes du dessus de son deck, écarte un argent ou or révélé (au choix) et défausse le reste.",
        "effects": {},
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "council_room",
        "name": "Chambre du Conseil",
        "cost": 5,
        "types": ["Action"],
        "text": "+4 Cartes, +1 Achat. Chaque autre joueur pioche une carte.",
        "effects": {
            "cards": 4,
            "buys": 1
        },
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "festival",
        "name": "Festival",
        "cost": 5,
        "types": ["Action"],
        "text": "+2 Actions, +1 Achat, +2 Pièces.",
        "effects": {
            "actions": 2,
            "buys": 1,
            "coins": 2
        },
        "expansion": "Base"
    },
    {
        "id": "laboratory",
        "name": "Laboratoire",
        "cost": 5,
        "types": ["Action"],
        "text": "+2 Cartes, +1 Action.",
        "effects": {
            "cards": 2,
            "actions": 1
        },
        "expansion": "Base"
    },
    {
        "id": "library",
        "name": "Bibliothèque",
        "cost": 5,
        "types": ["Action"],
        "text": "Piochez jusqu'à avoir 7 cartes en main, en mettant de côté les cartes Action piochées si vous voulez. Défaussez les cartes mises de côté à la fin.",
        "effects": {},
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "market",
        "name": "Marché",
        "cost": 5,
        "types": ["Action"],
        "text": "+1 Carte, +1 Action, +1 Achat, +1 Pièce.",
        "effects": {
            "cards": 1,
            "actions": 1,
            "buys": 1,
            "coins": 1
        },
        "expansion": "Base"
    },
    {
        "id": "mine",
        "name": "Mine",
        "cost": 5,
        "types": ["Action"],
        "text": "Vous pouvez écarter une carte Trésor de votre main. Recevez une carte Trésor coûtant jusqu'à 3 pièces de plus dans votre main.",
        "effects": {},
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "sentry",
        "name": "Sentinelle",
        "cost": 5,
        "types": ["Action"],
        "text": "+1 Carte, +1 Action. Regardez les 2 cartes du dessus de votre deck. Écartez et/ou défaussez n'importe lesquelles. Remettez le reste sur le dessus dans l'ordre de votre choix.",
        "effects": {
            "cards": 1,
            "actions": 1
        },
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "witch",
        "name": "Sorcière",
        "cost": 5,
        "types": ["Action", "Attack"],
        "text": "+2 Cartes. Chaque autre joueur reçoit une carte Malédiction.",
        "effects": {
            "cards": 2
        },
        "special": true,
        "expansion": "Base"
    },
    {
        "id": "artisan",
        "name": "Artisan",
        "cost": 6,
        "types": ["Action"],
        "text": "Recevez une carte coûtant jusqu'à 5 pièces dans votre main. Mettez une carte de votre main sur votre deck.",
        "effects": {},
        "special": true,
        "expansion": "Base"
    }
];
