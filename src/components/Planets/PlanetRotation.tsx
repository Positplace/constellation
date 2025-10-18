import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PlanetRotationProps {
  children: React.ReactNode;
  spinAxis: [number, number, number];
  spinSpeed: number;
  spinDirection: 1 | -1;
  timeScale: number;
}

/**
 * Handles planet self-rotation independent of orbital movement.
 * Wraps the planet mesh and applies continuous rotation.
 */
export const PlanetRotation: React.FC<PlanetRotationProps> = ({
  children,
  spinAxis,
  spinSpeed,
  spinDirection,
  timeScale,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    // Create normalized rotation axis
    const axis = new THREE.Vector3(spinAxis[0], spinAxis[1], spinAxis[2]);
    axis.normalize();

    // Calculate rotation amount for this frame
    const effectiveSpeed = spinSpeed * spinDirection * timeScale;
    const rotationAmount = effectiveSpeed * delta;

    // Apply rotation
    groupRef.current.rotateOnAxis(axis, rotationAmount);
  });

  return <group ref={groupRef}>{children}</group>;
};


