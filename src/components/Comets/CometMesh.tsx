import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CometData } from "../../types/comet.types";

interface CometMeshProps {
  comet: CometData;
  position: THREE.Vector3;
  onClick?: () => void;
  selected?: boolean;
}

/**
 * Renders the nucleus (core) of a comet
 */
const CometMesh: React.FC<CometMeshProps> = ({
  comet,
  position,
  onClick,
  selected = false,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Convert nucleus size from km to scene units (very small)
  // Typical comet nuclei: 1-50 km, we'll scale them to 0.02-0.08 units
  const nucleusRadius = Math.max(0.02, Math.min(0.08, comet.nucleusSize / 500));

  // Determine color based on composition
  const getNucleusColor = () => {
    if (comet.composition.ice > 70) {
      return "#b8c5d6"; // Icy blue-gray
    } else if (comet.composition.dust > 30) {
      return "#8b7355"; // Dusty brown
    } else {
      return "#5a5a5a"; // Rocky gray
    }
  };

  const nucleusColor = getNucleusColor();

  // Comet glow (coma) - atmosphere of gas and dust
  const comaIntensity = comet.tail.intensity;
  const comaColor = comet.composition.ice > 60 ? "#e6f0ff" : "#fff5e6"; // Bluer for icy, yellower for dusty

  // Memoize geometries to prevent recreation every render
  const nucleusGeometry = useMemo(
    () => new THREE.IcosahedronGeometry(nucleusRadius, 1),
    [nucleusRadius]
  );
  const selectionGeometry = useMemo(
    () => new THREE.SphereGeometry(nucleusRadius * 1.5, 16, 16),
    [nucleusRadius]
  );
  const comaInnerGeometry = useMemo(
    () => new THREE.SphereGeometry(nucleusRadius * 3, 16, 16),
    [nucleusRadius]
  );
  const comaOuterGeometry = useMemo(
    () => new THREE.SphereGeometry(nucleusRadius * 5, 16, 16),
    [nucleusRadius]
  );

  // Dispose geometries on cleanup
  useEffect(() => {
    return () => {
      nucleusGeometry.dispose();
      selectionGeometry.dispose();
      comaInnerGeometry.dispose();
      comaOuterGeometry.dispose();
    };
  }, [
    nucleusGeometry,
    selectionGeometry,
    comaInnerGeometry,
    comaOuterGeometry,
  ]);

  useFrame(() => {
    // Pulsate glow based on distance from star (coma effect)
    if (glowRef.current) {
      const pulsate = 0.8 + Math.sin(Date.now() * 0.002) * 0.2;
      glowRef.current.scale.setScalar(1 + comaIntensity * 0.5 * pulsate);
    }
  });

  return (
    <group position={position}>
      {/* Nucleus - irregular, elongated potato/peanut shape */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "auto";
        }}
        scale={[1.5, 0.8, 0.9]} // Elongated ellipsoid
      >
        {/* Use icosahedron for bumpy, irregular surface */}
        <primitive object={nucleusGeometry} />
        <meshStandardMaterial
          color={nucleusColor}
          roughness={0.9}
          metalness={0.1}
          emissive={comaIntensity > 0.3 ? nucleusColor : "#000000"}
          emissiveIntensity={comaIntensity * 0.1}
        />
      </mesh>

      {/* Selection indicator */}
      {selected && (
        <mesh>
          <primitive object={selectionGeometry} />
          <meshBasicMaterial
            color="#ffff00"
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      )}

      {/* Coma - glowing atmosphere (only visible when near star) */}
      {comaIntensity > 0.05 && (
        <>
          {/* Inner coma - bright */}
          <mesh ref={glowRef} renderOrder={100}>
            <primitive object={comaInnerGeometry} />
            <meshBasicMaterial
              color={comaColor}
              transparent
              opacity={comaIntensity * 0.4}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              depthTest={true}
            />
          </mesh>

          {/* Outer coma - softer glow */}
          <mesh renderOrder={100}>
            <primitive object={comaOuterGeometry} />
            <meshBasicMaterial
              color={comaColor}
              transparent
              opacity={comaIntensity * 0.2}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              depthTest={true}
            />
          </mesh>
        </>
      )}
    </group>
  );
};

export default CometMesh;
