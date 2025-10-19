import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";
import { SpaceshipData } from "../../types/spaceship.types";
import { useGameStore } from "../../store/gameStore";

interface SpaceshipProps {
  spaceship: SpaceshipData;
}

const Spaceship: React.FC<SpaceshipProps> = ({ spaceship }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const setSelectedObject = useGameStore((state) => state.setSelectedObject);
  const selectedObject = useGameStore((state) => state.selectedObject);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;

    // Gentle pulsing animation
    const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 1;
    meshRef.current.scale.setScalar(pulse);

    // Subtle rotation
    meshRef.current.rotation.y += delta * 0.5;
  });

  const isSelected =
    selectedObject?.id === spaceship.id && selectedObject?.type === "spaceship";

  const handleClick = (e: any) => {
    e.stopPropagation();
    setSelectedObject({ id: spaceship.id, type: "spaceship" });
  };

  return (
    <group position={spaceship.position} onClick={handleClick}>
      {/* Main ship body - bright glowing sphere */}
      <Sphere
        ref={meshRef}
        args={[spaceship.size * 0.33, 16, 16]}
        position={[0, 0, 0]}
      >
        <meshBasicMaterial
          color={spaceship.color}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Inner glow - brighter core */}
      <Sphere args={[spaceship.size * 0.33 * 0.6, 12, 12]} position={[0, 0, 0]}>
        <meshBasicMaterial
          color={spaceship.color}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Outer glow - soft halo */}
      <Sphere args={[spaceship.size * 0.33 * 2, 16, 16]} position={[0, 0, 0]}>
        <meshBasicMaterial
          color={spaceship.color}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Selection indicator */}
      {isSelected && (
        <Sphere args={[spaceship.size * 0.33 * 3, 16, 16]} position={[0, 0, 0]}>
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
          />
        </Sphere>
      )}

      {/* Engine glow - directional based on movement */}
      {(() => {
        // Convert velocity to Vector3 if it's not already
        const velocity =
          spaceship.velocity instanceof THREE.Vector3
            ? spaceship.velocity
            : new THREE.Vector3(
                spaceship.velocity.x || 0,
                spaceship.velocity.y || 0,
                spaceship.velocity.z || 0
              );

        return (
          velocity.length() > 0 && (
            <Sphere
              args={[spaceship.size * 0.33 * 0.3, 8, 8]}
              position={velocity
                .clone()
                .normalize()
                .multiplyScalar(-spaceship.size * 0.33 * 1.5)}
            >
              <meshBasicMaterial
                color="#ff6600"
                transparent
                opacity={0.6}
                blending={THREE.AdditiveBlending}
              />
            </Sphere>
          )
        );
      })()}
    </group>
  );
};

export default Spaceship;
