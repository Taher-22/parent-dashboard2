import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import Float from "../common/Float.jsx";

/* Retro arcade joystick + four glowing console buttons.
   Distinct from the other subject scenes (which all use central
   die/sphere + orbiters) so Minigames reads instantly as "games". */
export default function Minigames() {
  const stickRef    = useRef(null);
  const buttonsRef  = useRef(null);
  const ballRef     = useRef(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Joystick tilts back and forth in a small ellipse like it's
    // being wiggled — gives the scene movement and a "playing" feel.
    if (stickRef.current) {
      stickRef.current.rotation.z = Math.sin(t * 1.2) * 0.32;
      stickRef.current.rotation.x = Math.cos(t * 0.9) * 0.22;
    }

    // The ball on top gently spins so the highlight catches the eye.
    if (ballRef.current) {
      ballRef.current.rotation.y += delta * 0.6;
    }

    // Buttons rotate as a group around the base.
    if (buttonsRef.current) {
      buttonsRef.current.rotation.y += delta * 0.35;
    }
  });

  // 4 arcade buttons — classic colors, positioned on a ring.
  const buttons = [
    { angle: 0,             color: "#ef4444" }, // red
    { angle: Math.PI / 2,   color: "#3b82f6" }, // blue
    { angle: Math.PI,       color: "#facc15" }, // yellow
    { angle: 3 * Math.PI/2, color: "#22c55e" }, // green
  ];
  const BUTTON_R = 1.6;

  return (
    <Float speed={1} rotationIntensity={0.15} floatIntensity={0.6}>
      <group position={[0, -0.7, 0]}>

        {/* Console base — dark slate plate with a slight bevel feel. */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.55, 1.7, 0.32, 48]} />
          <meshPhysicalMaterial
            color="#1f2937"
            metalness={0.55}
            roughness={0.45}
            clearcoat={0.4}
          />
        </mesh>

        {/* Subtle accent ring on top of base */}
        <mesh position={[0, 0.17, 0]} castShadow>
          <torusGeometry args={[1.4, 0.05, 12, 64]} />
          <meshStandardMaterial
            color="#7c3aed"
            emissive="#7c3aed"
            emissiveIntensity={0.35}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>

        {/* JOYSTICK — group rotates around base center to tilt the stick. */}
        <group ref={stickRef} position={[0, 0.18, 0]}>
          {/* Stem */}
          <mesh position={[0, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.18, 1.5, 24]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>

          {/* Ball on top — bright fuchsia, glossy */}
          <mesh ref={ballRef} position={[0, 1.6, 0]} castShadow>
            <sphereGeometry args={[0.42, 48, 48]} />
            <meshPhysicalMaterial
              color="#e879f9"
              metalness={0.4}
              roughness={0.1}
              clearcoat={0.95}
              clearcoatRoughness={0.05}
              emissive="#a21caf"
              emissiveIntensity={0.18}
            />
          </mesh>
        </group>

        {/* Arcade buttons — 4 on a ring around the base, pulsing glow. */}
        <group ref={buttonsRef} position={[0, 0.17, 0]}>
          {buttons.map(({ angle, color }, i) => {
            const x = Math.cos(angle) * BUTTON_R;
            const z = Math.sin(angle) * BUTTON_R;
            return (
              <group key={i} position={[x, 0, z]}>
                {/* Button cap */}
                <mesh castShadow>
                  <cylinderGeometry args={[0.32, 0.32, 0.18, 32]} />
                  <meshPhysicalMaterial
                    color={color}
                    metalness={0.35}
                    roughness={0.18}
                    clearcoat={0.9}
                    clearcoatRoughness={0.08}
                    emissive={color}
                    emissiveIntensity={0.22}
                  />
                </mesh>
                {/* Tiny dark ring underneath for definition */}
                <mesh position={[0, -0.11, 0]}>
                  <cylinderGeometry args={[0.36, 0.36, 0.05, 32]} />
                  <meshStandardMaterial
                    color="#111827"
                    metalness={0.6}
                    roughness={0.5}
                  />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>
    </Float>
  );
}
