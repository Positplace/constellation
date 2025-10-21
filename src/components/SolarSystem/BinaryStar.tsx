import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";
import { CompanionStarData } from "../../types/game.types";

interface BinaryStarProps {
  companion: CompanionStarData;
  timeScale: number;
  onUpdate?: (angle: number) => void;
}

/**
 * Renders the companion star in a binary star system
 * The companion orbits around the primary star (at origin)
 */
export const BinaryStar: React.FC<BinaryStarProps> = ({
  companion,
  timeScale,
  onUpdate,
}) => {
  const companionRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const glowRefs = useRef<(THREE.Mesh | null)[]>([null, null, null]);
  const currentAngle = useRef(companion.orbitalAngle);

  useFrame((_, delta) => {
    if (companionRef.current) {
      // Rotate the companion star itself
      companionRef.current.rotation.y += delta * 0.15;

      // Update orbital position
      currentAngle.current += delta * companion.orbitalSpeed * timeScale;
      const x = Math.cos(currentAngle.current) * companion.orbitalDistance;
      const z = Math.sin(currentAngle.current) * companion.orbitalDistance;

      companionRef.current.position.set(x, 0, z);

      // Update light position to match companion star
      if (lightRef.current) {
        lightRef.current.position.set(x, 0, z);
        // Debug: Log light position occasionally
        if (Math.random() < 0.01) {
          console.log(
            `Companion light at: (${x.toFixed(2)}, 0, ${z.toFixed(
              2
            )}), intensity: ${lightRef.current.intensity}`
          );
        }
      }

      // Update glow positions
      glowRefs.current.forEach((glow) => {
        if (glow) {
          glow.position.set(x, 0, z);
        }
      });

      if (onUpdate) {
        onUpdate(currentAngle.current);
      }
    }
  });

  return (
    <group>
      {/* Companion star */}
      <Sphere
        ref={companionRef}
        args={[companion.size, 32, 32]}
        position={[
          Math.cos(companion.orbitalAngle) * companion.orbitalDistance,
          0,
          Math.sin(companion.orbitalAngle) * companion.orbitalDistance,
        ]}
      >
        <meshBasicMaterial color={companion.color} />
      </Sphere>

      {/* Inner glow */}
      <Sphere
        ref={(el) => (glowRefs.current[0] = el)}
        args={[companion.size * 1.15, 32, 32]}
        position={[
          Math.cos(companion.orbitalAngle) * companion.orbitalDistance,
          0,
          Math.sin(companion.orbitalAngle) * companion.orbitalDistance,
        ]}
      >
        <meshBasicMaterial
          color={companion.color}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Middle glow */}
      <Sphere
        ref={(el) => (glowRefs.current[1] = el)}
        args={[companion.size * 1.4, 32, 32]}
        position={[
          Math.cos(companion.orbitalAngle) * companion.orbitalDistance,
          0,
          Math.sin(companion.orbitalAngle) * companion.orbitalDistance,
        ]}
      >
        <meshBasicMaterial
          color={companion.glowColor}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Outer glow */}
      <Sphere
        ref={(el) => (glowRefs.current[2] = el)}
        args={[companion.size * 1.8, 32, 32]}
        position={[
          Math.cos(companion.orbitalAngle) * companion.orbitalDistance,
          0,
          Math.sin(companion.orbitalAngle) * companion.orbitalDistance,
        ]}
      >
        <meshBasicMaterial
          color={companion.glowColor}
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Secondary point light from companion - properly tracks position */}
      <pointLight
        ref={lightRef}
        position={[
          Math.cos(companion.orbitalAngle) * companion.orbitalDistance,
          0,
          Math.sin(companion.orbitalAngle) * companion.orbitalDistance,
        ]}
        intensity={companion.luminosity * 100}
        distance={0}
        decay={0.5}
        color={companion.color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={100}
        shadow-radius={2}
      />
    </group>
  );
};

export default BinaryStar;
