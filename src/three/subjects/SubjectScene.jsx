import React from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import Lights from "../common/Lights.jsx";
import Controls from "../common/Controls.jsx";

export default function SubjectScene({
  children,
  cameraPosition = [0, 1.2, 4.2],
  enableControls = true,
  className = "",
}) {
  return (
    <div className={className}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: cameraPosition, fov: 45 }}
      >
        <Lights />

        {/* Nice reflections without any downloaded HDR file */}
        <Environment preset="city" />

        {/* Object */}
        {children}

        {/* Ground shadow to look more “real” */}
        <ContactShadows
          position={[0, -1.1, 0]}
          opacity={0.45}
          scale={8}
          blur={2.6}
          far={6}
        />

        <Controls enabled={enableControls} />
      </Canvas>
    </div>
  );
}
