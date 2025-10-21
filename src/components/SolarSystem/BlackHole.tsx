import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Ring } from "@react-three/drei";
import * as THREE from "three";
import { BlackHoleData } from "../../types/game.types";

interface BlackHoleProps {
  blackHoleData: BlackHoleData;
  size: number;
  timeScale: number;
}

/**
 * Renders a black hole with accretion disk and event horizon
 */
export const BlackHole: React.FC<BlackHoleProps> = ({
  blackHoleData,
  size,
  timeScale,
}) => {
  const eventHorizonRef = useRef<THREE.Mesh>(null);
  const accretionDiskRef = useRef<THREE.Mesh>(null);
  const outerDiskRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    // Rotate accretion disk
    if (accretionDiskRef.current) {
      accretionDiskRef.current.rotation.z += delta * 0.5 * timeScale;
    }
    if (outerDiskRef.current) {
      outerDiskRef.current.rotation.z += delta * 0.3 * timeScale;
    }

    // Pulse event horizon slightly
    if (eventHorizonRef.current) {
      const scale = 1.0 + Math.sin(Date.now() * 0.001) * 0.05;
      eventHorizonRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      {/* Event Horizon - pure black sphere */}
      <Sphere
        ref={eventHorizonRef}
        args={[blackHoleData.eventHorizonRadius, 64, 64]}
        position={[0, 0, 0]}
      >
        <meshBasicMaterial color="#000000" />
      </Sphere>

      {/* Gravitational lensing effect - dark distortion ring */}
      <Sphere
        args={[blackHoleData.eventHorizonRadius * 1.3, 64, 64]}
        position={[0, 0, 0]}
      >
        <meshBasicMaterial
          color="#0a0a0a"
          transparent
          opacity={0.8}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Inner accretion disk - bright and hot */}
      <mesh
        ref={accretionDiskRef}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <ringGeometry
          args={[
            blackHoleData.accretionDiskInnerRadius,
            blackHoleData.accretionDiskInnerRadius * 1.5,
            64,
          ]}
        />
        <meshBasicMaterial
          color={blackHoleData.accretionDiskColor}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Middle accretion disk */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry
          args={[
            blackHoleData.accretionDiskInnerRadius * 1.5,
            blackHoleData.accretionDiskInnerRadius * 2.0,
            64,
          ]}
        />
        <meshBasicMaterial
          color={blackHoleData.accretionDiskColor}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer accretion disk - cooler and dimmer */}
      <mesh
        ref={outerDiskRef}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
      >
        <ringGeometry
          args={[
            blackHoleData.accretionDiskInnerRadius * 2.0,
            blackHoleData.accretionDiskOuterRadius,
            64,
          ]}
        />
        <meshBasicMaterial
          color={new THREE.Color(
            blackHoleData.accretionDiskColor
          ).multiplyScalar(0.6)}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Hawking radiation glow (if enabled) */}
      {blackHoleData.hawkingRadiation && (
        <>
          <Sphere
            args={[blackHoleData.eventHorizonRadius * 1.1, 32, 32]}
            position={[0, 0, 0]}
          >
            <meshBasicMaterial
              color="#4a5fff"
              transparent
              opacity={0.15}
              blending={THREE.AdditiveBlending}
            />
          </Sphere>
          <Sphere
            args={[blackHoleData.eventHorizonRadius * 1.2, 32, 32]}
            position={[0, 0, 0]}
          >
            <meshBasicMaterial
              color="#8a9fff"
              transparent
              opacity={0.08}
              blending={THREE.AdditiveBlending}
            />
          </Sphere>
        </>
      )}

      {/* Faint ambient light from accretion disk */}
      <pointLight
        position={[0, 0, 0]}
        intensity={2}
        distance={20}
        decay={2}
        color={blackHoleData.accretionDiskColor}
      />

      {/* Particle jets (simplified representation) */}
      <mesh position={[0, blackHoleData.accretionDiskOuterRadius * 1.5, 0]}>
        <cylinderGeometry
          args={[0.05, 0.02, blackHoleData.accretionDiskOuterRadius * 2, 8]}
        />
        <meshBasicMaterial
          color={blackHoleData.accretionDiskColor}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[0, -blackHoleData.accretionDiskOuterRadius * 1.5, 0]}>
        <cylinderGeometry
          args={[0.02, 0.05, blackHoleData.accretionDiskOuterRadius * 2, 8]}
        />
        <meshBasicMaterial
          color={blackHoleData.accretionDiskColor}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

export default BlackHole;
