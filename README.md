# 📱 3D Benchmark - FPS Test

Une application web interactive pour tester les performances 3D de votre téléphone avec React, Three.js et WebGL.

## 🚀 Fonctionnalités

- **Benchmark FPS en temps réel** : Mesure les FPS et la performance 3D
- **Augmentation dynamique** : Le nombre d'objets 3D augmente automatiquement si les FPS sont élevés
- **Statistiques en direct** : Affiche FPS, nombre d'objets et mémoire utilisée
- **Responsive** : Fonctionne sur mobile, tablette et desktop
- **Déploiement automatique** : Compilé et déployé sur GitHub Pages via GitHub Actions

## 🛠️ Tech Stack

- **React 18** - Interface utilisateur
- **Vite** - Build tool ultra-rapide
- **Three.js** - Rendu 3D WebGL
- **React Three Fiber** - Intégration React pour Three.js
- **GitHub Actions** - CI/CD automatique
- **GitHub Pages** - Hosting gratuit

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
```

## 🎮 Utilisation

1. **Ouvrir l'application** : http://localhost:5173 (ou votre URL de déploiement)
2. **Cliquer sur "▶️ Démarrer"** pour lancer le benchmark
3. **Observer les stats** : FPS, nombre d'objets, mémoire utilisée
4. **Les objets augmentent** automatiquement si FPS > 50

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
