import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NOISE_GLSL = `
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

const VERTEX_SHADER = `
uniform float uTime;
uniform float uAmp;
uniform float uSeed;
varying float vElev;
${NOISE_GLSL}
void main() {
  vec3 pos = position;
  float n = snoise(pos.xy * 0.09 + vec2(uTime * 0.35 + uSeed, uTime * 0.22));
  n += 0.5 * snoise(pos.xy * 0.22 + vec2(-uTime * 0.45, uSeed * 2.0));
  pos.z += n * uAmp;
  vElev = n;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const FRAGMENT_SHADER = `
varying float vElev;
void main() {
  vec3 cyan = vec3(0.13, 0.83, 0.93);
  vec3 violet = vec3(0.65, 0.54, 0.98);
  vec3 color = mix(cyan, violet, smoothstep(-1.2, 1.4, vElev));
  gl_FragColor = vec4(color, 0.85);
}
`;

function WaveLayer({ seed, yOffset, animated }) {
  const materialRef = useRef();

  useFrame(({ clock }) => {
    if (materialRef.current) materialRef.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <group rotation-x={-Math.PI / 2} position-y={yOffset}>
      <mesh>
        <planeGeometry args={[52, 52, 150, 150]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={VERTEX_SHADER}
          fragmentShader={FRAGMENT_SHADER}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          uniforms={{
            uTime: { value: 0 },
            uAmp: { value: animated ? 1.6 : 1.6 },
            uSeed: { value: seed },
          }}
        />
      </mesh>
      <mesh>
        <planeGeometry args={[52, 52, 150, 150]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.07} />
      </mesh>
    </group>
  );
}

export default function SceneWaves({ load, animated }) {
  const groupRef = useRef();
  const layers = Math.max(Math.round(load), 1);

  const seeds = useMemo(
    () => Array.from({ length: layers }, (_, i) => ({ seed: i * 7.31, yOffset: -3 + i * 2.1 })),
    [layers]
  );

  useFrame((_, delta) => {
    if (!animated || !groupRef.current) return;
    groupRef.current.rotation.z += delta * 0.02;
  });

  return (
    <group ref={groupRef}>
      {seeds.map((layer) => (
        <WaveLayer key={layer.seed} seed={layer.seed} yOffset={layer.yOffset} animated={animated} />
      ))}
      <ambientLight intensity={0.4} />
    </group>
  );
}
