import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AsteroidData, MaterialType } from "../../types/asteroid.types";
import { fractalNoise2D } from "../../utils/noiseUtils";
import {
  getSimpleAsteroidSize,
  getSimpleRenderScale,
  getVisibilityScale,
  debugAsteroidSize,
} from "../../utils/asteroidSizingSimple";

interface AsteroidMeshProps {
  asteroid: AsteroidData;
  renderScale?: number;
  onClick?: () => void;
  timeScale?: number;
  selectedId?: string;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Generate procedural irregular asteroid geometry
 */
function createAsteroidGeometry(
  asteroid: AsteroidData,
  renderScale: number
): THREE.BufferGeometry {
  // Use SIMPLE sizing calculation with detailed logging
  const radiusUnits = getSimpleAsteroidSize(asteroid.size);

  // Debug logging to help identify sizing issues (disabled to reduce spam)
  // if (process.env.NODE_ENV === "development") {
  //   debugAsteroidSize(asteroid.size, renderScale);
  // }

  // Start with sphere geometry (simpler and more reliable)
  const geometry = new THREE.SphereGeometry(
    radiusUnits, // Use actual calculated size, no minimum constraint
    8,
    6
  ); // Low poly sphere

  const positions = geometry.attributes.position;
  const vertices = positions.array as Float32Array;

  // Apply noise-based vertex displacement for irregular shape
  const noiseConfig = {
    octaves: 3,
    frequency: 2.0,
    amplitude: 1.0,
    lacunarity: 2.0,
    persistence: 0.5,
    seed: asteroid.shapeSeed,
  };

  // Displacement strength is relative to base radius so geometry cannot inflate
  // beyond a small percentage of its original size regardless of scale
  const displacementStrength =
    (0.06 + ((asteroid.shapeSeed % 100) / 100) * 0.08) * radiusUnits; // ~6%-14% of base radius

  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const y = vertices[i + 1];
    const z = vertices[i + 2];

    // Convert to spherical coordinates for noise
    const radius = Math.sqrt(x * x + y * y + z * z);
    const theta = Math.acos(z / radius);
    const phi = Math.atan2(y, x);

    // Generate noise at this point
    const noise = fractalNoise2D(theta * 10, phi * 10, noiseConfig);

    // Apply displacement along normal
    const displacement = noise * displacementStrength;
    // Move along normal but cap absolute displacement to 15% base radius
    const maxDisp = 0.15 * radiusUnits;
    const applied = Math.max(-maxDisp, Math.min(maxDisp, displacement));
    const nx = x / radius;
    const ny = y / radius;
    const nz = z / radius;
    vertices[i] = x + nx * applied;
    vertices[i + 1] = y + ny * applied;
    vertices[i + 2] = z + nz * applied;
  }

  // Update geometry
  positions.needsUpdate = true;
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Get material properties based on asteroid material type
 */
function getMaterialProperties(material: MaterialType): {
  color: string;
  metalness: number;
  roughness: number;
  emissive?: string;
  emissiveIntensity?: number;
} {
  switch (material) {
    case "silicate":
      return {
        color: "#8B7355", // Gray-brown rocky
        metalness: 0.1,
        roughness: 0.8,
      };
    case "iron":
      return {
        color: "#4A4A4A", // Dark metallic gray
        metalness: 0.9,
        roughness: 0.2,
      };
    case "nickel":
      return {
        color: "#6B6B6B", // Slightly lighter metallic
        metalness: 0.85,
        roughness: 0.3,
      };
    case "carbonaceous":
      return {
        color: "#2C2C2C", // Dark charcoal
        metalness: 0.05,
        roughness: 0.9,
      };
    case "ice":
      return {
        color: "#E6F3FF", // White-blue
        metalness: 0.0,
        roughness: 0.1,
        emissive: "#B0E0E6",
        emissiveIntensity: 0.1,
      };
    case "platinum":
      return {
        color: "#E5E4E2", // Platinum color
        metalness: 0.95,
        roughness: 0.1,
        emissive: "#F0F0F0",
        emissiveIntensity: 0.2,
      };
    case "gold":
      return {
        color: "#FFD700", // Gold color
        metalness: 0.9,
        roughness: 0.15,
        emissive: "#FFED4E",
        emissiveIntensity: 0.15,
      };
    case "rare_earth":
      return {
        color: "#C0C0C0", // Silver-gray
        metalness: 0.8,
        roughness: 0.25,
        emissive: "#D3D3D3",
        emissiveIntensity: 0.1,
      };
    default:
      return {
        color: "#8B7355",
        metalness: 0.1,
        roughness: 0.8,
      };
  }
}

/**
 * Renders an individual asteroid with procedural shape and material
 */
export const AsteroidMesh: React.FC<AsteroidMeshProps> = ({
  asteroid,
  renderScale,
  onClick,
  timeScale = 1,
  selectedId,
}) => {
  // Use SIMPLE render scale calculation
  const actualRenderScale = renderScale ?? getSimpleRenderScale();
  const meshRef = useRef<THREE.Mesh>(null);

  // Compute base radius and a visibility scale for rendering
  const baseRadius = useMemo(
    () => getSimpleAsteroidSize(asteroid.size),
    [asteroid.size]
  );
  const visibilityScale = useMemo(
    () => getVisibilityScale(baseRadius),
    [baseRadius]
  );

  // Generate geometry once using unscaled base radius
  const geometry = useMemo(
    () => createAsteroidGeometry(asteroid, actualRenderScale),
    [asteroid.shapeSeed, baseRadius, actualRenderScale]
  );

  // Get material properties
  const materialProps = useMemo(
    () => getMaterialProperties(asteroid.material),
    [asteroid.material]
  );

  // Create material
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: materialProps.color,
      metalness: materialProps.metalness,
      roughness: materialProps.roughness,
      emissive: materialProps.emissive
        ? new THREE.Color(materialProps.emissive)
        : new THREE.Color("#000000"),
      emissiveIntensity: materialProps.emissiveIntensity || 0,
    });
  }, [materialProps]);

  // Handle rotation animation
  useFrame((_state, delta) => {
    if (meshRef.current && timeScale > 0) {
      const rotationSpeed = asteroid.rotation.speed * timeScale;
      const direction = asteroid.rotation.direction;

      // Rotate around the asteroid's rotation axis
      meshRef.current.rotateOnAxis(
        new THREE.Vector3(...asteroid.rotation.axis),
        rotationSpeed * delta * direction
      );
    }
  });

  const isSelected = selectedId === asteroid.id;

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Main asteroid mesh */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
        position={[0, 0, 0]}
        scale={[visibilityScale, visibilityScale, visibilityScale]}
        onClick={(e) => {
          e.stopPropagation();
          // Debug size info when clicking asteroid
          debugAsteroidSize(asteroid.size);
          onClick?.();
        }}
      />

      {/* Selection highlight */}
      {isSelected && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[baseRadius * visibilityScale * 1.1, 16, 16]} />
          <meshBasicMaterial
            color="#00ff00"
            transparent
            opacity={0.3}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Subtle glow for rare metal asteroids */}
      {(asteroid.material === "platinum" ||
        asteroid.material === "gold" ||
        asteroid.material === "rare_earth") && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry
            args={[baseRadius * visibilityScale * 1.05, 16, 16]}
          />
          <meshBasicMaterial
            color={materialProps.color}
            transparent
            opacity={0.15}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
};
