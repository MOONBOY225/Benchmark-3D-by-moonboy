import SceneSwarm from './SceneSwarm';
import SceneParticles from './SceneParticles';
import SceneShadow from './SceneShadow';
import SceneGeometry from './SceneGeometry';
import SceneWaves from './SceneWaves';

export const SCENES = {
  swarm: {
    id: 'swarm',
    label: 'Essaim',
    icon: '🐝',
    description: 'Centaines d’objets instanciés en orbite',
    component: SceneSwarm,
    initial: 250,
    step: 50,
    max: 6000,
    divisor: 6,
  },
  particles: {
    id: 'particles',
    label: 'Particules',
    icon: '✨',
    description: 'Milliers de particules additives',
    component: SceneParticles,
    initial: 4000,
    step: 900,
    max: 26000,
    divisor: 24,
  },
  shadow: {
    id: 'shadow',
    label: 'Ombres',
    icon: '🌑',
    description: 'Nombreux objets et ombres dynamiques',
    component: SceneShadow,
    initial: 40,
    step: 8,
    max: 320,
    divisor: 0.25,
  },
  geometry: {
    id: 'geometry',
    label: 'Géométrie',
    icon: '🧿',
    description: 'Nœuds de tore très subdivisés',
    component: SceneGeometry,
    initial: 16,
    step: 4,
    max: 130,
    divisor: 0.125,
  },
  waves: {
    id: 'waves',
    label: 'Vagues',
    icon: '🌊',
    description: 'Terrain procédural en shader GPU',
    component: SceneWaves,
    initial: 2,
    step: 1,
    max: 8,
    divisor: 0.008,
  },
};

export const SUITE_SCENE_IDS = ['swarm', 'particles', 'shadow', 'geometry', 'waves'];

export function scaleConfig(config, factor) {
  return {
    ...config,
    initial: Math.max(1, Math.round(config.initial * factor)),
    step: Math.max(1, Math.round(config.step * factor)),
    max: Math.max(1, Math.round(config.max * factor)),
  };
}
