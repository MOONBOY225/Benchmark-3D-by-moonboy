# 📱 Benchmark 3D Lite

Une suite de benchmark mobile type **AnTuTu Lite** : plusieurs scènes 3D s'enchaînent pour produire
un score global, avec React, Three.js et WebGL.

## 🚀 Fonctionnalités

- **Suite complète type AnTuTu** : les scènes s'enchaînent automatiquement et produisent un score global détaillé scène par scène
- **5 scènes GPU distinctes** : Essaim (instanciation), Particules (additives), Ombres (draw calls + shadow map), Géométrie (haute subdivision), Vagues (shader de displacement GPU)
- **Métriques avancées** : FPS moyen/min/max, percentiles (1% low), stabilité et détection du ralentissement thermique
- **Graphique FPS en direct** : Visualisation de chaque échantillon pendant le test
- **Charge adaptative** : Le nombre d'objets augmente automatiquement tant que les FPS dépassent 50 (avec plafonds par intensité)
- **Vrai test CPU multi-cœur** : Charge réelle répartie sur tous les cœurs logiques via Web Workers
- **Wake Lock** : L'écran reste allumé pendant un test
- **Historique local** : Conserve les 50 derniers résultats, met en avant le record et permet de les comparer
- **Partage** : Web Share API, avec copie presse-papiers en fallback (détail par scène inclus)
- **Infos appareil détaillées** : Nom du GPU (WebGL), RAM, cœurs logiques, résolution et densité de pixels
- **Classement Supabase optionnel** : Envoi et lecture des scores si les variables d'environnement sont configurées
- **Responsive** : Fonctionne sur mobile, tablette et desktop
- **Déploiement automatique** : Compilé et déployé sur GitHub Pages via GitHub Actions

## 🎬 Les scènes

| Scène | Ce qui est testé |
| --- | --- |
| 🐝 Essaim | Instanciation massive (boîtes, icosaèdres, nœuds de tore en orbite) |
| ✨ Particules | Mise à jour CPU de milliers de particules + blending additif |
| 🌑 Ombres | Nombreux draw calls individuels + shadow map dynamique 2048px |
| 🧿 Géométrie | Nœuds de tore très subdivisés (charge triangles élevée) |
| 🌊 Vagues | Terrain procédural déplacé entièrement sur le GPU (vertex shader + bruit simplex) |

## 🛠️ Tech Stack

- **React 19** - Interface utilisateur
- **Vite** - Build tool ultra-rapide
- **Three.js** - Rendu 3D WebGL
- **React Three Fiber** - Intégration React pour Three.js
- **GitHub Actions** - CI/CD automatique
- **GitHub Pages** - Hosting gratuit
- **Capacitor Android** - Application Android installable

## 📦 Installation

```bash
# Cloner le repo
git clone https://github.com/votre-username/3d-benchmark-app.git
cd 3d-benchmark-app

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build pour production
npm run build

# Préview build local
npm run preview

# Préparer/synchroniser le projet Android
npx cap sync android

# Ouvrir dans Android Studio
npx cap open android

# Construire l'APK debug (depuis la racine du projet)
cd android
.\gradlew.bat assembleDebug
# Sur macOS/Linux : ./gradlew assembleDebug
```

L'APK est généré dans `android/app/build/outputs/apk/debug/app-debug.apk`.
Un APK debug est également disponible comme artefact du workflow GitHub Actions.

## 🎮 Utilisation

1. **Ouvrir l'application** : http://localhost:5173 (ou votre URL de déploiement)
2. **Cliquer sur "▶️ Démarrer"** pour lancer le benchmark
3. **Observer les stats** : FPS, nombre d'objets, mémoire utilisée
4. **Les objets augmentent** automatiquement si FPS > 50
5. Utiliser **Partager** pour transmettre le score ou **Classement** pour consulter le top 10.

Le mode CPU exécute un calcul entier réel (hachage FNV-1a) dans un Web Worker par cœur logique
et mesure le débit agrégé en millions d'opérations par seconde (M ops/s).
Le mode stabilité applique une charge GPU constante et analyse la régularité des trames.

## 📈 Métriques

| Métrique | Description |
| --- | --- |
| FPS actuels / moyen | Fréquence d'images instantanée et moyenne du test |
| FPS min / max | Pire et meilleure seconde du test |
| 1% low | FPS correspondant au percentile 99 des temps de rendu (micro-saccades) |
| Stabilité | 100 - écart-type des FPS × 4 |
| Throttling | Alerte si les FPS chutent de plus de 12 % entre la première et la seconde moitié du test |

## ☁️ Classement Supabase (optionnel)

Créer une base Supabase, exécuter `supabase/schema.sql`, puis définir :

```bash
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
```

Sans ces variables, l'application reste entièrement fonctionnelle avec l'historique local.

## 📊 Interprétation des résultats

- **FPS > 50** 🟢 **Excellent** - Appareil très performant
- **FPS 30-50** 🟡 **Bon** - Performance acceptable
- **FPS < 30** 🔴 **Faible** - Appareil moins puissant

## 🚀 Déploiement GitHub Pages

Le projet se déploie automatiquement sur GitHub Pages quand vous poussez sur `main`:

```bash
# Configurer GitHub Pages
# Settings > Pages > Source > GitHub Actions

# Puis simplement faire un push
git push origin main
```

L'app sera disponible à: `https://votre-username.github.io/3d-benchmark-app/`

Le build Pages conserve la base `/Benchmark-3D-by-moonboy/`. Le build Android
utilise automatiquement une base relative (`./`) afin que les assets fonctionnent
dans l'application native.

## 📝 Configuration base URL

Si votre repo n'est pas à la racine du domaine, modifier `vite.config.js`:

```javascript
export default {
  base: '/3d-benchmark-app/',
}
```

## 🏋️ Intensités

L'intensité multiplie la charge initiale, le palier de croissance et le plafond de chaque scène :

| Intensité | Facteur |
| --- | --- |
| Facile | ×0,5 |
| Normal | ×1 |
| Difficile | ×2 |

Le score de chaque scène vaut `FPS moyen × charge / diviseur` (diviseur propre à chaque scène),
et le score global de la suite est la somme des scènes.

## 📄 Licence

MIT - Libre d'utilisation

## 🤝 Contribution

Les PR et issues sont bienvenues!

---

**Développé avec ❤️ par Copilot**
