# Gantty

Application de gestion de projet pour développeur solo. Découpage fonctionnel, backlog agile, diagramme de Gantt interactif avec dépendances, planning par sprint et par module.

![Stack](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tests](https://img.shields.io/badge/tests-49%20passing-brightgreen)

---

## Fonctionnalités

- **Découpage fonctionnel** — modules, features avec spec inline, drag & drop entre modules
- **Backlog agile** — vue tableau et kanban, organisation en sprints
- **Gantt interactif** — barres déplaçables, dépendances avec flèches, filtres module/sprint
- **Horaires par projet** — jours travaillés, plages horaires, exceptions
- **Persistance** — SQLite via libsql, sync automatique en arrière-plan

---

## Démarrage rapide

```bash
git clone https://github.com/kevstfnl/Gantty && cd Gantty
npm install
npm run dev
# → http://localhost:3000
```

---

## Déploiement Raspberry Pi

### Docker Compose (recommandé)

```bash
docker compose up -d --build
```

L'app est accessible sur `http://<ip-du-pi>:3000`.  
Les données SQLite sont persistées dans le volume `gantty-data`.

**Mise à jour :**
```bash
git pull && docker compose up -d --build
```

**Sauvegarde :**
```bash
docker cp gantty:/app/data/gantty.db ./backup-$(date +%Y%m%d).db
```

### Sans Docker (systemd)

```bash
npm run build && npm start
```

Service systemd `/etc/systemd/system/gantty.service` :

```ini
[Unit]
Description=Gantty
After=network.target

[Service]
User=pi
WorkingDirectory=/home/pi/gantty
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DB_PATH=/home/pi/data/gantty.db

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable gantty && sudo systemctl start gantty
```

### Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `PORT` | `3000` | Port d'écoute |
| `DB_PATH` | `./gantty.db` | Chemin SQLite |

---

## Tests

```bash
npm test              # Tous les tests
npm run test:watch    # Mode watch
npm run test:coverage # Avec couverture
```

49 tests couvrant : calcul Gantt (jours travaillés, géométrie des barres), logique du store (CRUD, dépendances, bornes projet), validation des IDs d'API.

---

## Architecture

```
src/
├── app/api/projects/      # Routes REST (features, modules, sprints, schedule)
├── components/
│   ├── backlog/           # Kanban, sprints, drag & drop
│   ├── breakdown/         # Modules, features, spec inline
│   ├── dashboard/         # Cards projets
│   ├── gantt/             # Barres, flèches, en-têtes, labels
│   ├── schedule/          # Jours, horaires, exceptions
│   ├── shared/            # AnimatedCollapse, ConfirmDialog, EmptyState
│   └── views/             # Orchestrateurs (< 80 lignes)
├── lib/
│   ├── db/                # client.ts + queries.ts (libsql/SQLite)
│   ├── api-validation.ts  # Guards taille + format IDs
│   ├── store.ts           # Zustand + sync SQLite optimistic
│   └── utils.ts
└── test/                  # Vitest
```

**Flux de données :**
```
UI → Zustand (optimistic) → API Route → SQLite
          ↑
    localStorage (persist, fallback offline)
```

---

## Contribution

### Conventions

**Branches :** `feat/nom`, `fix/nom`, `refactor/nom`

**Commits :**
```
feat: filtrage par priorité dans le backlog
fix: calcul Y des flèches de dépendance
test: computeBarGeometry avec jours fériés
```

**Règles :**
- Composants < 80 lignes — extraire si nécessaire
- Logique métier dans `store.ts` ou `lib/`, pas dans les composants
- Toute fonction dans `ganttUtils.ts`/`store.ts` → test unitaire associé
- Pas de `any` sauf dans les routes API (données externes non typées)

### Ajouter une fonctionnalité

1. Types → `src/lib/store.ts`
2. DB schema → `src/lib/db/client.ts` + requête dans `queries.ts`
3. Route API → `src/app/api/`
4. Actions store → `store.ts`
5. Composants → sous-dossier approprié
6. Tests → `src/test/`

---

## Licence

MIT
