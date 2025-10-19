import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AsteroidBeltData } from "../../types/asteroid.types";
import { AsteroidMesh } from "./AsteroidMesh";
import { getSimpleRenderScale } from "../../utils/asteroidSizingSimple";

interface AsteroidBeltProps {
  belt: AsteroidBeltData;
  timeScale?: number;
  selectedId?: string;
  showBeltRing?: boolean;
  onAsteroidSelect?: (asteroidId: string, position: THREE.Vector3) => void;
  onSelectedFrame?: (asteroidId: string, position: THREE.Vector3) => void;
}

/**
 * Renders an entire asteroid belt with orbital motion
 */
export const AsteroidBelt: React.FC<AsteroidBeltProps> = ({
  belt,
  timeScale = 1,
  selectedId,
  showBeltRing = true,
  onAsteroidSelect,
  onSelectedFrame,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Track orbital phases locally without mutating shared data
  const orbitalPhasesRef = useRef<number[]>(
    belt.asteroids.map((a) => a.orbital.angle)
  );

  // Memoize initial asteroid positions
  const asteroidPositions = useMemo(() => {
    return belt.asteroids.map((asteroid, index) => {
      // Convert orbital distance to visual scale (same as planets)
      const visualDistance = asteroid.orbital.distance * 1.5;

      // Use initial angle for position
      const angle = asteroid.orbital.angle;
      const x = Math.cos(angle) * visualDistance;
      const z = Math.sin(angle) * visualDistance;
      const y = asteroid.position[1]; // Keep original vertical position

      // Initialize phase ref
      orbitalPhasesRef.current[index] = angle;

      return new THREE.Vector3(x, y, z);
    });
  }, [belt.asteroids]);

  // Handle orbital motion animation using local phase tracking
  useFrame((_state, delta) => {
    if (groupRef.current) {
      // Update orbital positions for each asteroid
      belt.asteroids.forEach((asteroid, index) => {
        const asteroidMesh = groupRef.current?.children[index] as THREE.Group;
        if (asteroidMesh) {
          // Update local orbital phase only when time is running
          if (timeScale > 0) {
            orbitalPhasesRef.current[index] +=
              asteroid.orbital.speed * delta * timeScale;
          }

          const currentAngle = orbitalPhasesRef.current[index];

          // Calculate new position (always update, even when paused)
          const visualDistance = asteroid.orbital.distance * 1.5;
          const x = Math.cos(currentAngle) * visualDistance;
          const z = Math.sin(currentAngle) * visualDistance;

          asteroidMesh.position.set(x, asteroid.position[1], z);

          // If this asteroid is selected, emit its position for camera tracking
          if (selectedId === asteroid.id && onSelectedFrame) {
            const worldPos = new THREE.Vector3();
            asteroidMesh.getWorldPosition(worldPos);
            onSelectedFrame(asteroid.id, worldPos);
          }
        }
      });
    }
  });

  // Memoize asteroid count for performance (could be used for LOD optimization)
  // const asteroidCount = belt.asteroids.length;

  return (
    <group ref={groupRef}>
      {/* Render individual asteroids */}
      {belt.asteroids.map((asteroid, index) => {
        const position = asteroidPositions[index];

        return (
          <AsteroidMesh
            key={asteroid.id}
            asteroid={asteroid}
            renderScale={getSimpleRenderScale()} // Use SIMPLE sizing
            timeScale={timeScale}
            selectedId={selectedId}
            onClick={() => {
              if (onAsteroidSelect) {
                onAsteroidSelect(asteroid.id, position.clone());
              }
            }}
          />
        );
      })}

      {/* Optional: Belt visualization ring (subtle wireframe) */}
      {showBeltRing && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry
            args={[belt.innerRadius * 1.5, belt.outerRadius * 1.5, 64]}
          />
          <meshBasicMaterial
            color="#444444"
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
            wireframe
          />
        </mesh>
      )}
    </group>
  );
};
