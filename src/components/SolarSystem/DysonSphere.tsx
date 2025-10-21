import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface DysonSphereProps {
  starSize: number;
  starColor: string;
  timeScale: number;
  completionPercentage: number; // 0-100
}

/**
 * Renders a Dyson Sphere by filling in sections of the wireframe mesh
 * A megastructure built around a star to capture its energy
 */
export const DysonSphere: React.FC<DysonSphereProps> = ({
  starSize,
  starColor,
  timeScale,
  completionPercentage,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Dyson sphere closer to the star
  const sphereRadius = starSize * 2.2;

  // Create filled sections geometry based on completion percentage
  const filledGeometry = useMemo(() => {
    const widthSegments = 16;
    const heightSegments = 12;

    // Create base sphere geometry
    const baseGeometry = new THREE.SphereGeometry(
      sphereRadius,
      widthSegments,
      heightSegments
    );

    // Get the position attribute
    const positionAttribute = baseGeometry.attributes.position;
    const indexAttribute = baseGeometry.index;

    if (!indexAttribute) return new THREE.BufferGeometry();

    // Calculate how many faces to fill
    const totalFaces = indexAttribute.count / 3;
    const facesToFill = Math.floor((totalFaces * completionPercentage) / 100);

    // Fill faces in contiguous clusters instead of random spread
    const filledFaces = new Set<number>();

    // Create adjacency map for faces
    const adjacencyMap = new Map<number, Set<number>>();

    for (let faceIdx = 0; faceIdx < totalFaces; faceIdx++) {
      const i0 = indexAttribute.getX(faceIdx * 3);
      const i1 = indexAttribute.getX(faceIdx * 3 + 1);
      const i2 = indexAttribute.getX(faceIdx * 3 + 2);

      // Check other faces for shared vertices
      const neighbors = new Set<number>();
      for (let otherIdx = 0; otherIdx < totalFaces; otherIdx++) {
        if (otherIdx === faceIdx) continue;

        const j0 = indexAttribute.getX(otherIdx * 3);
        const j1 = indexAttribute.getX(otherIdx * 3 + 1);
        const j2 = indexAttribute.getX(otherIdx * 3 + 2);

        // Share at least 2 vertices = adjacent face
        const sharedVertices = [i0, i1, i2].filter((v) =>
          [j0, j1, j2].includes(v)
        ).length;

        if (sharedVertices >= 2) {
          neighbors.add(otherIdx);
        }
      }
      adjacencyMap.set(faceIdx, neighbors);
    }

    // Start from a seed face and grow clusters
    const startFace = Math.floor(
      (Math.sin(completionPercentage * 78.233) * 43758.5453) % totalFaces
    );
    const queue: number[] = [Math.abs(startFace)];

    while (filledFaces.size < facesToFill && queue.length > 0) {
      const currentFace = queue.shift()!;

      if (filledFaces.has(currentFace)) continue;

      // Occasionally skip a face to create gaps (15% chance)
      const skipChance =
        Math.sin(currentFace * 9.898 + completionPercentage * 3.14) * 0.5 + 0.5;
      if (skipChance > 0.85 && filledFaces.size < facesToFill * 0.9) {
        // Add back to queue for later
        queue.push(currentFace);
        continue;
      }

      filledFaces.add(currentFace);

      // Add neighboring faces to queue with some randomness
      const neighbors = adjacencyMap.get(currentFace);
      if (neighbors) {
        const neighborArray = Array.from(neighbors).filter(
          (n) => !filledFaces.has(n)
        );
        // Sort by pseudo-random but add some to maintain growth pattern
        neighborArray.sort(
          () => Math.sin(currentFace * 12.9898 + completionPercentage) - 0.5
        );
        queue.push(...neighborArray.slice(0, 3)); // Take up to 3 neighbors
      }
    }

    // Create new geometry with only filled faces
    const positions: number[] = [];
    const normals: number[] = [];

    for (const faceIndex of filledFaces) {
      const i0 = indexAttribute.getX(faceIndex * 3);
      const i1 = indexAttribute.getX(faceIndex * 3 + 1);
      const i2 = indexAttribute.getX(faceIndex * 3 + 2);

      // Get vertices for this face
      const v0 = new THREE.Vector3(
        positionAttribute.getX(i0),
        positionAttribute.getY(i0),
        positionAttribute.getZ(i0)
      );
      const v1 = new THREE.Vector3(
        positionAttribute.getX(i1),
        positionAttribute.getY(i1),
        positionAttribute.getZ(i1)
      );
      const v2 = new THREE.Vector3(
        positionAttribute.getX(i2),
        positionAttribute.getY(i2),
        positionAttribute.getZ(i2)
      );

      // Calculate face normal
      const edge1 = new THREE.Vector3().subVectors(v1, v0);
      const edge2 = new THREE.Vector3().subVectors(v2, v0);
      const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

      // Add triangle vertices
      positions.push(v0.x, v0.y, v0.z);
      positions.push(v1.x, v1.y, v1.z);
      positions.push(v2.x, v2.y, v2.z);

      // Add normals
      normals.push(normal.x, normal.y, normal.z);
      normals.push(normal.x, normal.y, normal.z);
      normals.push(normal.x, normal.y, normal.z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(normals, 3)
    );

    return geometry;
  }, [sphereRadius, completionPercentage]);

  // Slow rotation of the entire structure
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03 * timeScale;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Wireframe sphere showing the full structure */}
      <mesh>
        <sphereGeometry args={[sphereRadius, 16, 12]} />
        <meshBasicMaterial
          color={starColor}
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Filled sections representing completed panels - blocks star light but glows */}
      <mesh geometry={filledGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#4488aa"
          metalness={0.9}
          roughness={0.1}
          emissive="#ff8833"
          emissiveIntensity={0.25}
          side={THREE.DoubleSide}
          opacity={1.0}
          transparent={false}
        />
      </mesh>
    </group>
  );
};

export default DysonSphere;
