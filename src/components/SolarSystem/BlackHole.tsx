import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
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
  const topArcRef = useRef<THREE.Mesh>(null);
  const bottomArcRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

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

    // Position lensing arcs based on camera angle - smooth billboarding
    if (topArcRef.current && bottomArcRef.current) {
      // Check if camera is looking up or down at the disk
      const cameraIsAbove = camera.position.y > 0;
      const arcOffset = 0.4;

      const cameraPos = camera.position.clone();

      if (cameraIsAbove) {
        // Camera above: arcs in normal positions
        topArcRef.current.position.set(0, arcOffset, 0);
        bottomArcRef.current.position.set(0, -arcOffset, 0);

        // Calculate rotation to face camera from above
        const up = new THREE.Vector3(0, 1, 0);
        const direction = cameraPos.clone().normalize();
        const right = new THREE.Vector3()
          .crossVectors(up, direction)
          .normalize();
        const forward = new THREE.Vector3().crossVectors(right, up).normalize();

        const matrix = new THREE.Matrix4();
        matrix.makeBasis(right, up, forward);
        const quaternion = new THREE.Quaternion().setFromRotationMatrix(matrix);

        topArcRef.current.quaternion.copy(quaternion);
        bottomArcRef.current.quaternion.copy(quaternion);
      } else {
        // Camera below: flip the positions
        topArcRef.current.position.set(0, -arcOffset, 0);
        bottomArcRef.current.position.set(0, arcOffset, 0);

        // Calculate rotation to face camera from below (inverted up vector)
        const up = new THREE.Vector3(0, -1, 0);
        const direction = cameraPos.clone().normalize();
        const right = new THREE.Vector3()
          .crossVectors(up, direction)
          .normalize();
        const forward = new THREE.Vector3().crossVectors(right, up).normalize();

        const matrix = new THREE.Matrix4();
        matrix.makeBasis(right, up, forward);
        const quaternion = new THREE.Quaternion().setFromRotationMatrix(matrix);

        topArcRef.current.quaternion.copy(quaternion);
        bottomArcRef.current.quaternion.copy(quaternion);
      }
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

      {/* Photon ring - bright ring at event horizon */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry
          args={[
            blackHoleData.eventHorizonRadius * 0.98,
            blackHoleData.eventHorizonRadius * 1.15,
            64,
          ]}
        />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Gravitational lensing - bright rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry
          args={[
            blackHoleData.eventHorizonRadius * 1.15,
            blackHoleData.eventHorizonRadius * 1.4,
            64,
          ]}
        />
        <meshBasicMaterial
          color="#ff9944"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Shadow region */}
      <Sphere
        args={[blackHoleData.eventHorizonRadius * 1.5, 64, 64]}
        position={[0, 0, 0]}
      >
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.7}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Very bright inner accretion disk */}
      <mesh
        ref={accretionDiskRef}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <ringGeometry
          args={[
            blackHoleData.accretionDiskInnerRadius,
            blackHoleData.accretionDiskInnerRadius * 1.3,
            64,
          ]}
        />
        <meshBasicMaterial
          color="#ffdd44"
          transparent
          opacity={1.0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Bright inner glow layer */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry
          args={[
            blackHoleData.accretionDiskInnerRadius * 0.95,
            blackHoleData.accretionDiskInnerRadius * 1.35,
            64,
          ]}
        />
        <meshBasicMaterial
          color="#ffaa22"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Middle accretion disk - warm */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry
          args={[
            blackHoleData.accretionDiskInnerRadius * 1.3,
            blackHoleData.accretionDiskInnerRadius * 2.0,
            64,
          ]}
        />
        <meshBasicMaterial
          color={blackHoleData.accretionDiskColor}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer accretion disk - dimmer red/orange */}
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
          ).multiplyScalar(0.5)}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Far outer disk - very dim */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry
          args={[
            blackHoleData.accretionDiskOuterRadius,
            blackHoleData.accretionDiskOuterRadius * 1.3,
            64,
          ]}
        />
        <meshBasicMaterial
          color={new THREE.Color(
            blackHoleData.accretionDiskColor
          ).multiplyScalar(0.3)}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Gravitational lensing arcs - camera-relative and flip correctly */}
      {/* Top arc */}
      <mesh ref={topArcRef}>
        <ringGeometry
          args={[
            blackHoleData.accretionDiskInnerRadius * 1.2,
            blackHoleData.accretionDiskInnerRadius * 1.8,
            128,
            8,
            0,
            Math.PI,
          ]}
        />
        <meshBasicMaterial
          color="#ff8833"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Bottom arc */}
      <mesh ref={bottomArcRef}>
        <ringGeometry
          args={[
            blackHoleData.accretionDiskInnerRadius * 1.2,
            blackHoleData.accretionDiskInnerRadius * 1.8,
            128,
            8,
            0,
            Math.PI,
          ]}
        />
        <meshBasicMaterial
          color="#ff8833"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
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

      {/* Bright light from accretion disk */}
      <pointLight
        position={[0, 0, 0]}
        intensity={8}
        distance={30}
        decay={1.5}
        color="#ff8833"
      />

      {/* Additional glow for dramatic effect */}
      <pointLight
        position={[0, 0.5, 0]}
        intensity={4}
        distance={20}
        decay={2}
        color="#ffaa44"
      />

      <pointLight
        position={[0, -0.5, 0]}
        intensity={3}
        distance={20}
        decay={2}
        color="#ff6622"
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
