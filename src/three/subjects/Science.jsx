import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import Float from "../common/Float.jsx";

export default function Science() {
  const groupRef = useRef(null);
  const orbitA = useRef(null);
  const orbitB = useRef(null);
  const orbitC = useRef(null);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.35;
    if (orbitA.current) orbitA.current.rotation.z += delta * 0.8;
    if (orbitB.current) orbitB.current.rotation.x += delta * 0.7;
    if (orbitC.current) orbitC.current.rotation.y += delta * 0.9;
  });

  return (
    <Float speed={1} rotationIntensity={0.3} floatIntensity={0.75}>
      <group ref={groupRef} position={[0, -0.2, 0]}>
        {/* Core */}
        <mesh castShadow>
          <sphereGeometry args={[0.45, 48, 48]} />
          <meshPhysicalMaterial
            color="#a855f7"
            emissive="#7c3aed"
            emissiveIntensity={0.25}
            metalness={0.35}
            roughness={0.25}
            clearcoat={0.9}
          />
        </mesh>

        {/* Orbits */}
        <group ref={orbitA}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.15, 0.03, 24, 160]} />
            <meshStandardMaterial color="#93c5fd" metalness={0.3} roughness={0.25} />
          </mesh>
          <mesh position={[1.15, 0, 0]} castShadow>
            <sphereGeometry args={[0.12, 32, 32]} />
            <meshStandardMaterial color="#22d3ee" metalness={0.4} roughness={0.2} />
          </mesh>
        </group>

        <group ref={orbitB}>
          <mesh rotation={[0, Math.PI / 2.2, 0]}>
            <torusGeometry args={[1.05, 0.03, 24, 160]} />
            <meshStandardMaterial color="#86efac" metalness={0.25} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.05, 0]} castShadow>
            <sphereGeometry args={[0.11, 32, 32]} />
            <meshStandardMaterial color="#34d399" metalness={0.35} roughness={0.25} />
          </mesh>
        </group>

        <group ref={orbitC}>
          <mesh rotation={[Math.PI / 4, 0, Math.PI / 2]}>
            <torusGeometry args={[0.95, 0.03, 24, 160]} />
            <meshStandardMaterial color="#fda4af" metalness={0.25} roughness={0.35} />
          </mesh>
          <mesh position={[-0.95, 0, 0]} castShadow>
            <sphereGeometry args={[0.10, 32, 32]} />
            <meshStandardMaterial color="#fb7185" metalness={0.3} roughness={0.25} />
          </mesh>
        </group>
      </group>
    </Float>
  );
}
