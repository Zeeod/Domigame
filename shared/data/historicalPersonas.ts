export interface HistoricalPersona {
    name: string;
    description: string;
    era: string;
    years: string;
}

export const HISTORICAL_PERSONAS: HistoricalPersona[] = [
    // Haut Moyen Âge
    {
        name: "Clovis Ier",
        description: "Chef de guerre impitoyable, il unifie les tribus franques par les armes et la ruse. Sa conversion au catholicisme lors de la bataille de Tolbiac lui assure le soutien de l'Église.",
        era: "Haut Moyen Âge",
        years: "466 - 511"
    },
    {
        name: "Sainte Geneviève",
        description: "Figure spirituelle et politique majeure, elle galvanise le courage des Parisiens face à l'invasion des Huns d'Attila. Elle est la sainte patronne de Paris.",
        era: "Haut Moyen Âge",
        years: "420 - 500"
    },
    {
        name: "Sainte Clotilde",
        description: "Princesse burgonde catholique, elle joue un rôle diplomatique crucial en épousant Clovis et en œuvrant sans relâche pour sa conversion.",
        era: "Haut Moyen Âge",
        years: "474 - 545"
    },
    {
        name: "Dagobert Ier",
        description: "Roi puissant qui unifie le royaume et établit sa capitale à Paris. Connu pour sa justice itinérante et son mécénat artistique (Abbaye de Saint-Denis).",
        era: "Haut Moyen Âge",
        years: "602 - 639"
    },
    {
        name: "Saint Éloi",
        description: "Orfèvre de génie, trésorier et conseiller de Dagobert. Homme de foi, il rachète de nombreux esclaves et fonde des monastères.",
        era: "Haut Moyen Âge",
        years: "588 - 660"
    },
    {
        name: "Charles Martel",
        description: "Maire du Palais et grand-père de Charlemagne. Sa victoire à Poitiers en 732 arrête l'expansion omeyyade en Europe de l'Ouest.",
        era: "Haut Moyen Âge",
        years: "688 - 741"
    },
    {
        name: "Pépin le Bref",
        description: "Fils de Charles Martel, il met fin à la dynastie mérovingienne et devient le premier roi sacré par une onction religieuse.",
        era: "Haut Moyen Âge",
        years: "714 - 768"
    },
    {
        name: "Charlemagne",
        description: "Conquérant infatigable, il double la taille du royaume et se fait couronner Empereur d'Occident en l'an 800. Il lance la Renaissance carolingienne.",
        era: "Haut Moyen Âge",
        years: "742 - 814"
    },
    {
        name: "Roland",
        description: "Héros de la Chanson de Roland, mort à Roncevaux. Archétype du chevalier loyal qui refuse de sonner du cor par fierté.",
        era: "Haut Moyen Âge",
        years: "? - 778"
    },
    {
        name: "Charles le Chauve",
        description: "Petit-fils de Charlemagne, son règne aboutit à la création de la Francie occidentale (France) après le Traité de Verdun.",
        era: "Haut Moyen Âge",
        years: "823 - 877"
    },

    // Moyen Âge Central
    {
        name: "Hugues Capet",
        description: "Élu roi en 987, il installe le principe d'hérédité qui permettra à la dynastie capétienne de régner pendant 800 ans.",
        era: "Moyen Âge Central",
        years: "940 - 996"
    },
    {
        name: "Guillaume le Conquérant",
        description: "Duc de Normandie, il conquiert l'Angleterre en 1066 (bataille d'Hastings), devenant roi tout en restant vassal du roi de France.",
        era: "Moyen Âge Central",
        years: "1027 - 1087"
    },
    {
        name: "Urbain II",
        description: "Pape français qui déclenche la Première Croisade en 1095 avec son appel 'Dieu le veut !'.",
        era: "Moyen Âge Central",
        years: "1042 - 1099"
    },
    {
        name: "Pierre l'Ermite",
        description: "Prédicateur exalté qui entraîne la 'Croisade populaire' des pauvres gens avant même le départ des chevaliers.",
        era: "Moyen Âge Central",
        years: "1050 - 1115"
    },
    {
        name: "Godefroy de Bouillon",
        description: "Chef militaire de la Première Croisade. Il refuse le titre de roi à Jérusalem, préférant 'Avoué du Saint-Sépulcre'.",
        era: "Moyen Âge Central",
        years: "1058 - 1100"
    },
    {
        name: "Héloïse",
        description: "Femme d'une érudition exceptionnelle, célèbre pour sa passion tragique et sa correspondance philosophique avec Abélard.",
        era: "Moyen Âge Central",
        years: "1101 - 1164"
    },
    {
        name: "Pierre Abélard",
        description: "Logicien brillant et professeur charismatique, amant d'Héloïse. Il révolutionne la théologie médiévale.",
        era: "Moyen Âge Central",
        years: "1079 - 1142"
    },
    {
        name: "Hugues de Payns",
        description: "Chevalier champenois fondateur de l'Ordre du Temple (Templiers) pour protéger les pèlerins en Terre Sainte.",
        era: "Moyen Âge Central",
        years: "1070 - 1136"
    },
    {
        name: "Aliénor d'Aquitaine",
        description: "Reine de France puis d'Angleterre. Femme de caractère, mère de Richard Cœur de Lion et Jean sans Terre.",
        era: "Moyen Âge Central",
        years: "1122 - 1204"
    },
    {
        name: "Louis VII le Jeune",
        description: "Roi pieux participant à la Deuxième Croisade. Son divorce avec Aliénor d'Aquitaine a des conséquences désastreuses pour le royaume.",
        era: "Moyen Âge Central",
        years: "1120 - 1180"
    },
    {
        name: "Abbé Suger",
        description: "Conseiller de Louis VI et VII, régent du royaume. Père de l'art gothique (Basilique Saint-Denis).",
        era: "Moyen Âge Central",
        years: "1080 - 1151"
    },
    {
        name: "Saint Bernard de Clairvaux",
        description: "Moine cistercien à l'influence politique immense. Il rédige la règle des Templiers et prêche la Deuxième Croisade.",
        era: "Moyen Âge Central",
        years: "1090 - 1153"
    },
    {
        name: "Chrétien de Troyes",
        description: "Auteur majeur des légendes arthuriennes (Lancelot, Perceval). Il introduit le mystère du Graal.",
        era: "Moyen Âge Central",
        years: "1130 - 1191"
    },
    {
        name: "Philippe II Auguste",
        description: "Grand stratège, vainqueur à Bouvines (1214). Il transforme la monarchie féodale en puissance nationale et modernise Paris (Louvre).",
        era: "Moyen Âge Central",
        years: "1165 - 1223"
    },
    {
        name: "Blanche de Castille",
        description: "Régente énergique et mère de Saint Louis, elle défend le trône contre les barons révoltés.",
        era: "Moyen Âge Central",
        years: "1188 - 1252"
    },
    {
        name: "Saint Louis (Louis IX)",
        description: "Roi modèle de justice (rendue sous un chêne) et de piété. Il meurt lors de sa seconde croisade à Tunis.",
        era: "Moyen Âge Central",
        years: "1214 - 1270"
    },
    {
        name: "Robert de Sorbon",
        description: "Confesseur de Saint Louis et fondateur du collège théologique qui deviendra la Sorbonne.",
        era: "Moyen Âge Central",
        years: "1201 - 1274"
    },
    {
        name: "Jean de Joinville",
        description: "Biographe et ami intime de Saint Louis, son œuvre témoigne de la vie et des vertus du roi saint.",
        era: "Moyen Âge Central",
        years: "1224 - 1317"
    },

    // Bas Moyen Âge
    {
        name: "Philippe IV le Bel",
        description: "Roi froid et calculateur qui renforce l'État. Il orchestre la destruction de l'Ordre du Temple en 1307.",
        era: "Bas Moyen Âge",
        years: "1268 - 1314"
    },
    {
        name: "Guillaume de Nogaret",
        description: "Juriste et bras droit de Philippe le Bel. Il instruit le procès des Templiers et s'attaque au Pape Boniface VIII.",
        era: "Bas Moyen Âge",
        years: "1260 - 1313"
    },
    {
        name: "Jacques de Molay",
        description: "Dernier Grand Maître des Templiers, brûlé vif sur l'île de la Cité. La légende lui attribue la malédiction des rois maudits.",
        era: "Bas Moyen Âge",
        years: "1244 - 1314"
    },
    {
        name: "Jean II le Bon",
        description: "Roi chevaleresque capturé à Poitiers. Sa rançon oblige à la création du 'Franc'.",
        era: "Bas Moyen Âge",
        years: "1319 - 1364"
    },
    {
        name: "Étienne Marcel",
        description: "Prévôt des marchands de Paris, il tente une révolution bourgeoise mais finit assassiné.",
        era: "Bas Moyen Âge",
        years: "1302 - 1358"
    },
    {
        name: "Charles V le Sage",
        description: "Roi intellectuel qui reconquiert le territoire par la diplomatie. Fondateur de la librairie royale (future BNF).",
        era: "Bas Moyen Âge",
        years: "1338 - 1380"
    },
    {
        name: "Bertrand du Guesclin",
        description: "Connétable de France, expert en guérilla. L'un des rares non-royaux enterrés à Saint-Denis.",
        era: "Bas Moyen Âge",
        years: "1320 - 1380"
    },
    {
        name: "Gaston Fébus",
        description: "Comte de Foix, prince éclairé et grand chasseur. Auteur du 'Livre de la chasse'.",
        era: "Bas Moyen Âge",
        years: "1331 - 1391"
    },
    {
        name: "Jean Froissart",
        description: "Chroniqueur majeur de la Guerre de Cent Ans et de l'idéal chevaleresque.",
        era: "Bas Moyen Âge",
        years: "1337 - 1405"
    },
    {
        name: "Nicolas Flamel",
        description: "Bourgeois parisien et mécène, la rumeur en a fait un alchimiste ayant découvert la Pierre Philosophale.",
        era: "Bas Moyen Âge",
        years: "1330 - 1418"
    },
    {
        name: "Christine de Pizan",
        description: "Première femme de lettres professionnelle. Auteure féministe avant l'heure ('La Cité des Dames').",
        era: "Bas Moyen Âge",
        years: "1364 - 1430"
    },
    {
        name: "Jean sans Peur",
        description: "Duc de Bourgogne ambitieux, assassiné sur le pont de Montereau en pleine guerre civile.",
        era: "Bas Moyen Âge",
        years: "1371 - 1419"
    },
    {
        name: "Charles VII",
        description: "Le 'Victorieux'. Métamorphosé par Jeanne d'Arc, il termine la Guerre de Cent Ans et crée l'armée permanente.",
        era: "Bas Moyen Âge",
        years: "1403 - 1461"
    },
    {
        name: "Yolande d'Aragon",
        description: "Belle-mère de Charles VII et politicienne avisée, elle soutient Jeanne d'Arc et forge les alliances décisives.",
        era: "Bas Moyen Âge",
        years: "1381 - 1442"
    },
    {
        name: "Jeanne d'Arc",
        description: "La Pucelle d'Orléans. Libère Orléans et fait sacrer le roi. Brûlée à Rouen, symbole de résistance nationale.",
        era: "Bas Moyen Âge",
        years: "1412 - 1431"
    },
    {
        name: "Gilles de Rais",
        description: "Compagnon de Jeanne d'Arc devenu tueur en série d'enfants. Inspire la légende de Barbe Bleue.",
        era: "Bas Moyen Âge",
        years: "1405 - 1440"
    },
    {
        name: "La Hire (Étienne de Vignolles)",
        description: "Capitaine gascon fidèle à Jeanne d'Arc. Il est le 'Valet de Cœur' des jeux de cartes.",
        era: "Bas Moyen Âge",
        years: "1390 - 1443"
    },
    {
        name: "Jean de Dunois",
        description: "Le Bâtard d'Orléans. Brillant tacticien qui dirige les armées royales lors de la reconquête finale.",
        era: "Bas Moyen Âge",
        years: "1402 - 1468"
    },
    {
        name: "Jacques Cœur",
        description: "Marchand génial et Grand Argentier, il finance la guerre mais finit disgracié par jalousie.",
        era: "Bas Moyen Âge",
        years: "1395 - 1456"
    },
    {
        name: "Agnès Sorel",
        description: "Première favorite officielle influente. Elle lance la mode et meurt probablement empoisonnée.",
        era: "Bas Moyen Âge",
        years: "1422 - 1450"
    },
    {
        name: "François Villon",
        description: "Poète maudit et génial de la fin du Moyen Âge, auteur de la 'Ballade des pendus'.",
        era: "Bas Moyen Âge",
        years: "1431 - 1463"
    },
    {
        name: "Louis XI",
        description: "L'Universelle Aragne. Roi diplomate et rusé qui brise les féodaux et agrandit la France.",
        era: "Bas Moyen Âge",
        years: "1423 - 1483"
    }
];
