# 📱 3D Benchmark - FPS Test

Une application web interactive pour tester les performances 3D de votre téléphone avec React, Three.js et WebGL.

## 🚀 Fonctionnalités

- **Benchmark FPS en temps réel** : Mesure les FPS et la performance 3D
- **Augmentation dynamique** : Le nombre d'objets 3D augmente automatiquement si les FPS sont élevés
- **Statistiques en direct** : Affiche FPS, nombre d'objets et mémoire utilisée
- **Historique local** : Conserve les 20 derniers résultats et permet de les comparer
- **Partage** : Web Share API, avec copie presse-papiers en fallback
- **Modes GPU, CPU et stabilité** : Les deux derniers sont des simulations indicatives côté navigateur
- **Classement Supabase optionnel** : Envoi et lecture des scores si les variables d'environnement sont configurées
- **Responsive** : Fonctionne sur mobile, tablette et desktop
- **Déploiement automatique** : Compilé et déployé sur GitHub Pages via GitHub Actions

## 🛠️ Tech Stack

- **React 18** - Interface utilisateur
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

Les modes CPU et stabilité ne mesurent pas directement le matériel : ils évaluent une charge JavaScript et la régularité des trames dans le navigateur.

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

## 📄 Licence

MIT - Libre d'utilisation

## 🤝 Contribution

Les PR et issues sont bienvenues!

---

**Développé avec ❤️ par Copilot**
