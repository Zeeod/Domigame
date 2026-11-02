# Jouer entre amis avec Docker

Un seul conteneur fait tout : il héberge les parties et sert le site du jeu.
Vos amis n'ont rien à installer, il leur suffit d'un navigateur.

## 1. Lancer le jeu

Sur la machine qui hébergera le jeu (PC, NAS, serveur), avec Docker installé :

```bash
git clone https://github.com/Zeeod/Domigame.git   # dépôt privé : connectez-vous à GitHub
cd Domigame
docker compose up -d --build
```

La première construction prend quelques minutes. Ensuite, ouvrez **http://localhost:3005**
(ou `http://<adresse-de-la-machine>:3005` depuis un autre ordinateur de la maison).

Pour jouer : chacun ouvre la page, entre son nom et **le même code de salle**.
Le premier arrivé est l'hôte : il choisit le royaume et lance la partie.

## 2. Mettre à jour

```bash
git pull
docker compose up -d --build
```

Les parties sauvegardées sont dans le dossier `data/` à côté du `docker-compose.yml` :
elles sont conservées lors des mises à jour et des redémarrages.
Après un redémarrage, l'hôte retrouve sa partie dans le salon, rubrique **Parties sauvegardées → Reprendre** ;
les autres joueurs reviennent avec le même code de salle.

## 3. Jouer avec des amis hors de chez vous

Le jeu écoute sur le port **3005**. Pour que des amis s'y connectent par Internet, au choix :

- **Le plus simple** : rediriger le port 3005 de votre box vers la machine qui héberge le jeu,
  puis donner à vos amis `http://<votre-adresse-IP-publique>:3005`.
- **Avec un nom de domaine** (recommandé, en HTTPS) : un reverse proxy (celui de Synology DSM,
  Nginx Proxy Manager, Caddy…) qui envoie `https://dominion.mondomaine.fr` vers `http://<machine>:3005`.
  Il doit laisser passer les **WebSockets** (sur Synology : Reverse Proxy → En-tête personnalisé → *Créer → WebSocket*).

Pour changer de port, modifiez seulement le nombre de gauche dans `docker-compose.yml` (`"8080:3005"` par exemple).

## 4. Sur un NAS Synology

1. Installez **Container Manager** depuis le Centre de paquets.
2. Copiez le projet dans un dossier du NAS, par exemple `/docker/dominion`
   (avec `git clone`, ou en envoyant le dossier sans `node_modules`, `dist`, `data`, `.git`).
3. Container Manager → **Projet** → **Créer** → choisissez ce dossier : le `docker-compose.yml` est détecté.
   Lancez la construction.
4. Pour un accès par nom de domaine : Panneau de configuration → Portail de connexion → Avancé →
   **Reverse Proxy**, source `https://dominion.mondomaine.fr`, destination `http://localhost:3005`,
   et ajoutez l'en-tête **WebSocket**.

## Bon à savoir

- Chaque joueur doit jouer depuis **son propre navigateur** : deux onglets du même navigateur
  sont vus comme le même joueur.
- Santé du serveur : `http://<machine>:3005/health` répond `OK`.
- Journal du serveur : `docker compose logs -f`.
- Arrêter : `docker compose down` (les sauvegardes restent dans `data/`).
