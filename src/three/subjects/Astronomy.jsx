import * as THREE from "three";
import React, { useMemo, useRef } from "react";
import { Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import Float from "../common/Float.jsx";

function makePlanetTexture(size = 256) {
  // Simple procedural “planet” texture (no external files)
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Base gradient
  const g = ctx.createRadialGradient(size * 0.35, size * 0.35, size * 0.05, size * 0.5, size * 0.5, size * 0.55);
  g.addColorStop(0, "#2a74ff");
  g.addColorStop(0.55, "#1556c7");
  g.addColorStop(1, "#0b2a6a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // “Cloud” noise blobs
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 2 + Math.random() * 10;
    ctx.fillStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.08})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

export default function Astronomy() {
  const planetRef = useRef(null);
  const ringRef = useRef(null);

  const textureCanvas = useMemo(() => makePlanetTexture(384), []);
  const texture = useMemo(() => {
    // drei can accept canvas as map via TextureLoader? easiest is CanvasTexture:
    // @react-three/fiber uses three under the hood:
    // eslint-disable-next-line no-undef
    return new THREE.CanvasTexture(textureCanvas);
  }, [textureCanvas]);

  useFrame((_, delta) => {
    if (planetRef.current) planetRef.current.rotation.y += delta * 0.35;
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.2;
  });

  return (
    <>
      <Stars radius={30} depth={18} count={700} factor={3} fade speed={0.6} />

      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.8}>
        <group position={[0, -0.1, 0]}>
          {/* Planet */}
          <mesh ref={planetRef} castShadow receiveShadow>
            <sphereGeometry args={[1.05, 64, 64]} />
            <meshStandardMaterial
              map={texture}
              metalness={0.05}
              roughness={0.75}
            />
          </mesh>

          {/* Atmosphere glow */}
          <mesh>
            <sphereGeometry args={[1.12, 64, 64]} />
            <meshStandardMaterial
              color="#7fd3ff"
              transparent
              opacity={0.12}
              roughness={1}
              metalness={0}
            />
          </mesh>

          {/* Ring (subtle) */}
          <mesh ref={ringRef} rotation={[Math.PI / 2.6, 0, 0]}>
            <torusGeometry args={[1.45, 0.05, 24, 120]} />
            <meshStandardMaterial color="#b7d8ff" metalness={0.35} roughness={0.35} transparent opacity={0.6} />
          </mesh>
        </group>
      </Float>
    </>
  );
}
