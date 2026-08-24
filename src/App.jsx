import { useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Benchmark from './components/Benchmark';
import Stats from './components/Stats';
import './App.css';

const difficulties = {
  easy: { label: 'Facile', initialMeshes: 100, step: 25 },
  normal: { label: 'Normal', initialMeshes: 250, step: 50 },
  hard: { label: 'Difficile', initialMeshes: 500, step: 100 },
};

function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  const platform = navigator.userAgentData?.platform || navigator.platform || 'Inconnu';
  const browser = userAgent.includes('Chrome') ? 'Chrome'
    : userAgent.includes('Firefox') ? 'Firefox'
    : userAgent.includes('Safari') ? 'Safari'
    : 'Navigateur web';

  return {
    platform,
    browser,
    cores: navigator.hardwareConcurrency || 'N/A',
    screen: `${window.screen.width} × ${window.screen.height}`,
  };
}

function App() {
  const [stats, setStats] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [difficulty, setDifficulty] = useState('normal');
  const [duration, setDuration] = useState(30);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const appRef = useRef(null);
  const device = useMemo(getDeviceInfo, []);

  const toggleBenchmark = () => {
    if (isRunning) {
      setIsRunning(false);
      return;
    }
    setStats(null);
    setIsRunning(true);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await appRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="app" ref={appRef}>
      <header className="header">
        <div>
          <h1>📱 3D Benchmark</h1>
          <p>Mesurez les performances graphiques de votre téléphone</p>
        </div>
        <button className="fullscreen-btn" onClick={toggleFullscreen}>
          {isFullscreen ? '⤢ Quitter plein écran' : '⛶ Plein écran'}
        </button>
      </header>

      <main className="container">
        <div className="canvas-wrapper">
          <Canvas camera={{ position: [0, 0, 5] }} dpr={[1, 2]}>
            <Benchmark
              difficulty={difficulties[difficulty]}
              duration={duration}
              isRunning={isRunning}
              onComplete={() => setIsRunning(false)}
              onStatsUpdate={setStats}
            />
          </Canvas>
          {isRunning && <div className="running-badge">TEST EN COURS · {stats ? `${stats.elapsed}s / ${duration}s` : `0s / ${duration}s`}</div>}
        </div>

        <aside className="sidebar">
          <button className="start-btn" onClick={toggleBenchmark}>
            {isRunning ? '⏹ Arrêter le test' : '▶ Démarrer le test'}
          </button>

          <div className="controls">
            <label>
              Difficulté
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} disabled={isRunning}>
                {Object.entries(difficulties).map(([value, item]) => (
                  <option key={value} value={value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label>
              Durée
              <select value={duration} onChange={(event) => setDuration(Number(event.target.value))} disabled={isRunning}>
                <option value={15}>15 secondes</option>
                <option value={30}>30 secondes</option>
                <option value={60}>60 secondes</option>
              </select>
            </label>
          </div>

          {stats ? <Stats {...stats} /> : <p className="hint">Choisissez un niveau puis démarrez le test.</p>}

          <section className="device-info">
            <h2>Appareil</h2>
            <p>{device.platform} · {device.browser}</p>
            <p>{device.cores} cœurs · écran {device.screen}</p>
          </section>
        </aside>
      </main>
    </div>
  );
}

export default App;
