import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import Float from "../common/Float.jsx";

export default function Reading() {
  const bookRef = useRef(null);

  useFrame((_, delta) => {
    if (bookRef.current) bookRef.current.rotation.y += delta * 0.25;
  });

  return (
    <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.8}>
      <group ref={bookRef} position={[0, -0.45, 0]}>
        {/* Cover */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.9, 1.2, 0.22]} />
          <meshStandardMaterial color="#22c55e" metalness={0.15} roughness={0.35} />
        </mesh>

        {/* Pages */}
        <mesh position={[0.02, 0, 0.08]} castShadow receiveShadow>
          <boxGeometry args={[1.75, 1.05, 0.10]} />
          <meshPhysicalMaterial
            color="#f8fafc"
            metalness={0.05}
            roughness={0.35}
            clearcoat={0.6}
            clearcoatRoughness={0.25}
          />
        </mesh>

        {/* Bookmark */}
        <mesh position={[0.55, 0.2, 0.14]} rotation={[0, 0, 0.2]} castShadow>
          <boxGeometry args={[0.12, 0.9, 0.02]} />
          <meshStandardMaterial color="#f97316" metalness={0.2} roughness={0.4} />
        </mesh>
      </group>
    </Float>
  );
}
