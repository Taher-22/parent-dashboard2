import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import Float from "../common/Float.jsx";

export default function Math() {
  const cubeRef = useRef(null);
  const nodesRef = useRef(null);

  useFrame((_, delta) => {
    if (cubeRef.current) {
      cubeRef.current.rotation.x += delta * 0.25;
      cubeRef.current.rotation.y += delta * 0.35;
    }
    if (nodesRef.current) nodesRef.current.rotation.y -= delta * 0.25;
  });

  return (
    <Float speed={1} rotationIntensity={0.25} floatIntensity={0.7}>
      <group position={[0, -0.2, 0]}>
        {/* Main cube (glass-ish) */}
        <mesh ref={cubeRef} castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshPhysicalMaterial
            color="#22d3ee"
            metalness={0.25}
            roughness={0.08}
            transmission={0.65}
            thickness={0.9}
            ior={1.25}
            clearcoat={0.9}
            clearcoatRoughness={0.12}
          />
        </mesh>

        {/* Orbiting nodes */}
        <group ref={nodesRef}>
          {[
            [2.0, 0.4, 0.0],
            [-1.8, -0.1, 1.0],
            [0.2, 1.6, -1.4],
          ].map((p, i) => (
            <mesh key={i} position={p} castShadow>
              <sphereGeometry args={[0.22, 32, 32]} />
              <meshStandardMaterial color="#7c3aed" metalness={0.35} roughness={0.35} />
            </mesh>
          ))}
        </group>
      </group>
    </Float>
  );
}
