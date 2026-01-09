import React from "react";
import { OrbitControls } from "@react-three/drei";

export default function Controls({ enabled = true }) {
  if (!enabled) return null;

  return (
    <OrbitControls
      enablePan={false}
      enableZoom={false}
      minPolarAngle={Math.PI / 2.6}
      maxPolarAngle={Math.PI / 2.1}
      rotateSpeed={0.6}
      dampingFactor={0.08}
      enableDamping
    />
  );
}
