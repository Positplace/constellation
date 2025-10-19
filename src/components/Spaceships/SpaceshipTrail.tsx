import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SpaceshipData } from "../../types/spaceship.types";

interface SpaceshipTrailProps {
  spaceship: SpaceshipData;
}

const SpaceshipTrail: React.FC<SpaceshipTrailProps> = ({ spaceship }) => {
  const lineRef = useRef<THREE.Line>(null);
  const pointsRef = useRef<THREE.Points>(null);

  // Create trail geometry from spaceship trail positions
  const trailGeometry = useMemo(() => {
    if (spaceship.trailPositions.length < 2) return null;

    const positions = new Float32Array(spaceship.trailPositions.length * 3);
    const colors = new Float32Array(spaceship.trailPositions.length * 3);

    spaceship.trailPositions.forEach((pos, index) => {
      const i = index * 3;
      positions[i] = pos.x;
      positions[i + 1] = pos.y;
      positions[i + 2] = pos.z;

      // Fade from bright at the end to transparent at the beginning
      const fade = index / (spaceship.trailPositions.length - 1);
      const intensity = Math.pow(fade, 2); // Quadratic fade for smoother effect

      // Convert spaceship color to RGB
      const color = new THREE.Color(spaceship.color);
      colors[i] = color.r * intensity;
      colors[i + 1] = color.g * intensity;
      colors[i + 2] = color.b * intensity;
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    return geometry;
  }, [spaceship.trailPositions, spaceship.color]);

  // Update trail geometry when positions change
  useFrame(() => {
    if (!trailGeometry || !pointsRef.current) return;

    const positions = trailGeometry.attributes.position.array as Float32Array;
    const colors = trailGeometry.attributes.color.array as Float32Array;

    spaceship.trailPositions.forEach((pos, index) => {
      const i = index * 3;
      positions[i] = pos.x;
      positions[i + 1] = pos.y;
      positions[i + 2] = pos.z;

      // Fade from bright at the end to transparent at the beginning
      const fade = index / (spaceship.trailPositions.length - 1);
      const intensity = Math.pow(fade, 2);

      const color = new THREE.Color(spaceship.color);
      colors[i] = color.r * intensity;
      colors[i + 1] = color.g * intensity;
      colors[i + 2] = color.b * intensity;
    });

    trailGeometry.attributes.position.needsUpdate = true;
    trailGeometry.attributes.color.needsUpdate = true;
  });

  if (!trailGeometry || spaceship.trailPositions.length < 2) {
    return null;
  }

  return (
    <group>
      {/* Trail as line segments */}
      <line ref={lineRef} geometry={trailGeometry}>
        <lineBasicMaterial
          color={spaceship.color}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          vertexColors
        />
      </line>

      {/* Trail as points for a more particle-like effect */}
      <points ref={pointsRef} geometry={trailGeometry}>
        <pointsMaterial
          size={0.02}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          vertexColors
          sizeAttenuation={true}
        />
      </points>
    </group>
  );
};

export default SpaceshipTrail;
