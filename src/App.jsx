import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Benchmark from './components/Benchmark';
import Stats from './components/Stats';
import './App.css';

function App() {
  const [stats, setStats] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  return (
    <div className="app">
      <div className="header">
        <h1>📱 3D Benchmark - FPS Test</h1>
        <p>Test la performance 3D de votre téléphone</p>
      </div>

      <div className="container">
        <div className="canvas-wrapper">
          <Canvas camera={{ position: [0, 0, 5] }} performance={{ min: 0.5 }}>
            <Benchmark onStatsUpdate={setStats} isRunning={isRunning} />
          </Canvas>
        </div>

        <div className="sidebar">
          <button 
            className="start-btn"
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? '⏹️ Arrêter' : '▶️ Démarrer'}
          </button>
          
          {stats && <Stats {...stats} />}
        </div>
      </div>
    </div>
  );
}

export default App
