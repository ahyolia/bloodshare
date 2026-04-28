# BloodShare 🩸

Application mobile de fidélisation des donneurs de sang en Nouvelle-Calédonie.

## Stack
- **Mobile** : React Native (Expo)
- **Backend** : Node.js + Express
- **Base de données** : PostgreSQL
- **Environnement** : Docker

## Lancer le projet

### Prérequis
- Docker
- Node.js 20+

### Installation
```bash
git clone https://github.com/ahyolia/bloodshare.git
cd bloodshare
cp bloodshare-api/.env.example bloodshare-api/.env
docker compose up --build
```

L'API est accessible sur http://localhost:3000

### Mobile
```bash
cd bloodshare-mobile
npx expo start
```
