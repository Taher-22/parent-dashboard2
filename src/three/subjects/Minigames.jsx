import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import Float from "../common/Float.jsx";

/* A playful arcade-themed scene: a chrome-pink central die surrounded by
   three orbiting game tokens (sphere · cube · pyramid). Matches the
   visual cadence of Math/Science/Reading/Astronomy so the card grid
   stays cohesive. */
export default function Minigames() {
  const dieRef    = useRef(null);
  const tokensRef = useRef(null);

  useFrame((_, delta) => {
    if (dieRef.current) {
      dieRef.current.rotation.x += delta * 0.35;
      dieRef.current.rotation.y += delta * 0.5;
    }
    if (tokensRef.current) tokensRef.current.rotation.y += delta * 0.45;
  });

  return (
    <Float speed={1.1} rotationIntensity={0.3} floatIntensity={0.85}>
      <group position={[0, -0.2, 0]}>
        {/* Central die — bright fuchsia, glossy */}
        <mesh ref={dieRef} castShadow receiveShadow>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
          <meshPhysicalMaterial
            color="#e879f9"
            metalness={0.4}
            roughness={0.15}
            clearcoat={0.85}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* Orbiting tokens — sphere, cube, tetrahedron */}
        <group ref={tokensRef}>
          {/* Sphere — cyan */}
          <mesh position={[2.0, 0.5, 0.0]} castShadow>
            <sphereGeometry args={[0.32, 32, 32]} />
            <meshStandardMaterial
              color="#22d3ee"
              metalness={0.5}
              roughness={0.2}
            />
          </mesh>

          {/* Small cube — amber */}
          <mesh position={[-1.6, -0.2, 1.1]} rotation={[0.4, 0.6, 0]} castShadow>
            <boxGeometry args={[0.42, 0.42, 0.42]} />
            <meshStandardMaterial
              color="#fbbf24"
              metalness={0.3}
              roughness={0.25}
            />
          </mesh>

          {/* Tetrahedron / pyramid — emerald */}
          <mesh position={[0.4, 1.6, -1.3]} rotation={[0.5, 0.2, 0.3]} castShadow>
            <tetrahedronGeometry args={[0.42]} />
            <meshStandardMaterial
              color="#34d399"
              metalness={0.35}
              roughness={0.25}
            />
          </mesh>
        </group>
      </group>
    </Float>
  );
}
