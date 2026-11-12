import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, ShaderMaterial } from 'three';
import type { Verdict } from '../data/types.ts';
import { sceneStore } from '../lib/store.ts';

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * Anneau de verdict, codé par la forme (la charte réserve les couleurs au goût,
 * au parfum et aux sources) : Suivre = trait plein épais, Observer = tirets,
 * Ignorer = trait fin gris. Le sens de la file est indiqué sur la pancarte du stand.
 */
const fragment = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
uniform float uFlow;
uniform float uDim;
uniform float uActive;
uniform float uSize;
uniform float uWidth;
uniform float uDashed;
uniform float uStrength;
varying vec2 vUv;

float band(float r, float c, float w) {
  return smoothstep(c - w, c - w * 0.4, r) * (1.0 - smoothstep(c + w * 0.4, c + w, r));
}

void main() {
  vec2 p = vUv - 0.5;
  float r = length(p) * uSize;
  float ang = atan(p.y, p.x);
  float dash = uDashed > 0.5 ? step(0.45, fract(ang * 24.0 / 6.2831853)) : 1.0;
  float ring = band(r, 2.1, uWidth) * dash * uStrength;
  float a = clamp(ring * (0.8 + 0.2 * uActive), 0.0, 1.0) * uDim;
  gl_FragColor = vec4(uColor, a);
  #include <colorspace_fragment>
}
`;

const SIZE = 8;
const STYLE: Record<
  Verdict,
  { color: string; width: number; dashed: number; strength: number }
> = {
  Suivre: { color: '#0b1215', width: 0.12, dashed: 0, strength: 1 },
  Observer: { color: '#0b1215', width: 0.07, dashed: 1, strength: 0.9 },
  Ignorer: { color: '#767676', width: 0.04, dashed: 0, strength: 0.75 },
};

export function VerdictRing({
  verdict,
  flow,
  dimRef,
  activeRef,
}: {
  verdict: Verdict;
  flow: number;
  dimRef: { current: number };
  activeRef: { current: number };
}) {
  const mat = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => {
    const st = STYLE[verdict];
    return {
      uColor: { value: new Color(st.color) },
      uTime: { value: Math.random() * 10 },
      uFlow: { value: flow },
      uDim: { value: 1 },
      uActive: { value: 0 },
      uSize: { value: SIZE },
      uWidth: { value: st.width },
      uDashed: { value: st.dashed },
      uStrength: { value: st.strength },
    };
  }, [verdict, flow]);
  useFrame((_, dt) => {
    const u = mat.current?.uniforms;
    if (!u) return;
    if (!sceneStore.get().paused) u.uTime.value += dt;
    u.uDim.value = 0.2 + 0.8 * dimRef.current;
    u.uActive.value = activeRef.current;
  });
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.02} renderOrder={1}>
      <planeGeometry args={[SIZE, SIZE]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
