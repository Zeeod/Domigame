# 🚀 Guide de Déploiement : Dominion sur Synology NAS

Ce guide vous explique comment déployer votre jeu sur votre NAS Synology en utilisant Docker et le Reverse Proxy intégré.

---

## 🏗️ 1. Préparation du Projet (PC Local)

Avant d'envoyer les fichiers sur le NAS, assurez-vous que tout fonctionne localement.

1. **Vérification des fichiers** :
   - [Dockerfile](file:///d:/Jeux/Developpement/Dominion/Dockerfile) : Configuration de l'image (Multi-stage).
   - [docker-compose.yml](file:///d:/Jeux/Developpement/Dominion/docker-compose.yml) : Orchestration du conteneur.
   - [.env.production](file:///d:/Jeux/Developpement/Dominion/.env.production) : Variables d'environnement pour le build.

2. **Test local (Optionnel mais recommandé)** :
   ```bash
   docker compose build
   docker compose up
   ```
   Ouvrez `http://localhost:3005`. Si le jeu s'affiche, tout est prêt !

---

## 📂 2. Transfert sur le NAS

### 📋 Liste précise des éléments à transférer
Pour que le build Docker fonctionne sur le NAS, vous avez besoin des dossiers et fichiers suivants :

| Dossier / Fichier | Description |
| :--- | :--- |
| `client/` | Tout le code source du frontend. |
| `server/` | Tout le code source du backend (Express/Socket.IO). |
| `shared/` | Code partagé (Logique du jeu, types, cartes). |
| `public/` | Assets statiques (images, sons). |
| `scripts/` | Utilitaires (notamment `clean_ports.js`). |
| `package.json` | Définition des dépendances et scripts. |
| `package-lock.json` | Verrouillage des versions des dépendances. |
| `tsconfig.json` | Configuration TypeScript. |
| `vite.config.ts` | Configuration du build Vite. |
| `Dockerfile` | Instructions de build pour Docker. |
| `docker-compose.yml` | Définition des services Docker. |
| `.env.production` | Fichier de config pour la production. |

> [!IMPORTANT]
> **NE PAS TRANSFÉRER** : `node_modules/`, `dist/`, `.git/`, ou vos fichiers de logs locaux (`*.log`, `tsc_output.txt`). Ces fichiers alourdiraient inutilement le transfert.

### 🪜 Étapes détaillées du transfert (DSM)

1. **Préparation sur votre PC** :
   - Sélectionnez tous les éléments listés ci-dessus.
   - Faites un clic droit > **Envoyer vers** > **Dossier compressé (zip)**. Nommez-le `dominion_source.zip`.
   - *Astuce : Zipper avant d'uploader est beaucoup plus rapide que d'envoyer des milliers de petits fichiers TypeScript.*

2. **Sur le Synology (DSM)** :
   - Ouvrez **File Station**.
   - Naviguez vers votre dossier Docker (souvent `/docker`).
   - Créez un dossier `dominion` s'il n'existe pas. Entrez dedans.
   - Cliquez sur **Charger** > **Charger - Écraser** et sélectionnez votre `dominion_source.zip`.

3. **Extraction** :
   - Une fois l'upload terminé, faites un clic droit sur `dominion_source.zip` dans File Station.
   - Choisissez **Extraire** > **Extraire ici**.
   - Vous pouvez ensuite supprimer le fichier `.zip` pour gagner de la place.

4. **Vérification** :
   - Vous devriez voir la structure du projet directement à la racine de `/docker/dominion/` (pas de sous-dossier inutile).


---

## 🐳 3. Lancement via Container Manager

1. Ouvrez **Container Manager** (anciennement Docker).
2. Allez dans **Projet** > **Créer**.
3. Nom du projet : `dominion`.
4. Chemin : Sélectionnez le dossier `/docker/dominion`.
5. Source : Sélectionnez **docker-compose.yaml**.
6. Cliquez sur **Suivant** puis **Effectué**. Le NAS va construire l'image et lancer le conteneur.

---

## 🌐 4. Configuration du Reverse Proxy (HTTPS)

C'est ici que vous liez `dominion.zeeod.fr` à votre conteneur.

1. Allez dans **Panneau de configuration** > **Portail de connexion** > **Proxy inversé**.
2. Cliquez sur **Créer**.
3. **Général** :
   - Nom : `Dominion Game`
   - Source (Le web) :
     - Protocole : `HTTPS`
     - Nom d'hôte : `dominion.zeeod.fr`
     - Port : `443`
     - Cochez `HSTS`
   - Destination (Le conteneur) :
     - Protocole : `HTTP`
     - Nom d'hôte : `localhost`
     - Port : `3005`
4. **⚠️ TRÈS IMPORTANT : WebSocket Support** :
   - Allez dans l'onglet **Paramètres personnalisés**.
   - Cliquez sur **Créer** > **WebSocket**.
   - Cela va ajouter les en-têtes `Upgrade` et `Connection`. Sans cela, Socket.IO échouera.
5. Cliquez sur **Sauvegarder**.

---

## 🔑 5. Certificat SSL (HTTPS)

1. Allez dans **Panneau de configuration** > **Sécurité** > **Certificat**.
2. Cliquez sur **Ajouter** > **Ajouter un nouveau certificat** > **Obtenir un certificat auprès de Let's Encrypt**.
3. Suivez les étapes pour `dominion.zeeod.fr`.
4. Une fois créé, cliquez sur **Paramètres**.
5. Cherchez la ligne correspondant à votre Proxy Inversé (`dominion.zeeod.fr`) et sélectionnez le certificat Let's Encrypt correspondant.

---

## 🛰️ 6. Configuration DNS

Chez votre fournisseur de domaine (ex: OVH, LWS, etc.) :

1. Ajoutez un enregistrement :
   - **Type** : `A`
   - **Hôte** : `dominion`
   - **Cible** : Votre adresse IP Publique (celle de votre box internet).
2. **Ou** (si vous avez une IP dynamique) :
   - **Type** : `CNAME`
   - **Hôte** : `dominion`
   - **Cible** : Votre adresse DDNS Synology (ex: `votre-id.synology.me`).

---

## 🔄 7. Workflow de Développement

**Pour développer localement :**
- `npm run dev` (Front: 3000)
- `npm start` (Back: 3005)
- Accès via `http://localhost:3000`

**Pour mettre à jour le NAS :**
1. Modifiez votre code sur PC.
2. Uploadez les fichiers modifiés sur le NAS via File Station.
3. Dans **Container Manager**, sélectionnez le projet `dominion` et cliquez sur **Action** > **Construire à nouveau**.

---

## ✅ Checklist de Validation

- [ ] L'URL `https://dominion.zeeod.fr/health` affiche "OK".
- [ ] Le jeu charge (fichiers statiques OK).
- [ ] La console (F12) ne montre pas d'erreurs "Mixed Content".
- [ ] Le chat ou les actions de jeu fonctionnent (Socket.IO OK).
- [ ] Un ami testant via `https://dominion.zeeod.fr` peut rejoindre une salle.

---

## 🆘 Problèmes fréquents

- **"Socket Error / 400 Bad Request"** : Vérifiez que l'en-tête WebSocket est bien activé dans le Reverse Proxy Synology.
- **"Connection Refused"** : Vérifiez que le pare-feu du NAS autorise le port 3005 ou que le conteneur est bien en cours d'exécution.
- **"Page Blanche"** : Vérifiez les logs du conteneur pour voir si une erreur survient au lancement (ex: fichier manquant).
