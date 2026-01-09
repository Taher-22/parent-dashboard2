import React from "react";

export default function Lights() {
  return (
    <>
      {/* Soft base light */}
      <ambientLight intensity={0.55} />

      {/* Main key light */}
      <directionalLight
        position={[6, 10, 6]}
        intensity={1.25}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />

      {/* Fill */}
      <pointLight position={[-6, 4, -4]} intensity={0.6} />

      {/* Rim */}
      <spotLight
        position={[0, 10, -10]}
        intensity={0.8}
        angle={0.35}
        penumbra={0.6}
        castShadow
      />
    </>
  );
}
