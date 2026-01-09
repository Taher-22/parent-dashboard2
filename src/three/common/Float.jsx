import React from "react";
import { Float as DreiFloat } from "@react-three/drei";

export default function Float({ children, speed = 1, rotationIntensity = 0.35, floatIntensity = 0.6 }) {
  return (
    <DreiFloat speed={speed} rotationIntensity={rotationIntensity} floatIntensity={floatIntensity}>
      {children}
    </DreiFloat>
  );
}
