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
 * Creates a triangular shape geometry
 */
const createTriangleShape = (radius: number) => {
  const shape = new THREE.Shape();
  for (let i = 0; i < 3; i++) {
    const angle = ((Math.PI * 2) / 3) * i - Math.PI / 2; // Start from top
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  shape.closePath();
  return shape;
};

/**
 * Renders a half-complete Dyson Sphere with triangular panels
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

  // Create triangular geometry once
  const triangleGeometry = useMemo(() => {
    const triangleShape = createTriangleShape(sphereRadius * 0.18);
    return new THREE.ShapeGeometry(triangleShape);
  }, [sphereRadius]);

  // Generate panel positions based on completion percentage
  const panels = useMemo(() => {
    const panelData: Array<{
      position: THREE.Vector3;
      normal: THREE.Vector3;
      id: number;
    }> = [];

    const latDivisions = 10;
    const panelSize = sphereRadius * 0.18;

    let id = 0;
    for (let lat = 0; lat < latDivisions; lat++) {
      const phi = (Math.PI * (lat + 0.5)) / latDivisions;
      const y = Math.cos(phi) * sphereRadius;
      const rowRadius = Math.sin(phi) * sphereRadius;
      const rowCircumference = 2 * Math.PI * rowRadius;

      // Calculate how many panels fit in this row with smaller spacing
      const panelsInRow = Math.max(
        3,
        Math.floor(rowCircumference / (panelSize * 1.6))
      );

      // Offset alternating rows for better tessellation
      const rowOffset = (lat % 2) * (Math.PI / panelsInRow);

      for (let lon = 0; lon < panelsInRow; lon++) {
        const theta = (Math.PI * 2 * lon) / panelsInRow + rowOffset;

        const x = Math.cos(theta) * rowRadius;
        const z = Math.sin(theta) * rowRadius;

        const position = new THREE.Vector3(x, y, z);
        const normal = position.clone().normalize();

        panelData.push({
          position,
          normal,
          id: id++,
        });
      }
    }

    // Filter panels based on completion percentage
    // Show panels in a progressive pattern from one side
    const totalPanels = panelData.length;
    const panelsToShow = Math.floor((totalPanels * completionPercentage) / 100);

    return panelData.slice(0, panelsToShow);
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

      {/* Triangular solar panels on half the sphere */}
      {panels.map((panel) => {
        // Create quaternion to align panel with sphere surface
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), panel.normal);

        return (
          <mesh
            key={`panel-${panel.id}`}
            position={panel.position}
            quaternion={quaternion}
            geometry={triangleGeometry}
          >
            <meshStandardMaterial
              color="#4488aa"
              metalness={0.85}
              roughness={0.15}
              emissive={starColor}
              emissiveIntensity={0.08}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export default DysonSphere;
