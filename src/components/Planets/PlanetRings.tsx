import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RingData } from "../../types/planet.types";

interface PlanetRingsProps {
  ringData: RingData;
  planetAxialTilt: number;
  timeScale: number;
}

/**
 * Renders planet rings as a flat ring geometry
 */
export const PlanetRings: React.FC<PlanetRingsProps> = ({
  ringData,
  planetAxialTilt,
  timeScale,
}) => {
  const ringRef = useRef<THREE.Mesh>(null);

  // Rotate rings to match planet's axial tilt
  useFrame((_state, delta) => {
    if (ringRef.current) {
      // Rotate rings around their axis
      ringRef.current.rotation.z += delta * ringData.rotationSpeed * timeScale;
    }
  });

  return (
    <group>
      {ringData.bands.map((band, index) => (
        <mesh
          key={index}
          ref={index === 0 ? ringRef : undefined} // Only the first ring needs ref for rotation
          rotation={[Math.PI / 2, 0, (planetAxialTilt * Math.PI) / 180]}
        >
          <ringGeometry
            args={[band.innerRadius, band.outerRadius, 64, 1, 0, Math.PI * 2]}
          />
          <meshBasicMaterial
            color={band.color}
            transparent
            opacity={band.opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.NormalBlending}
          />
        </mesh>
      ))}
    </group>
  );
};
