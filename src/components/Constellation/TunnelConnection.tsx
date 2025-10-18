import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TunnelConnectionProps {
  from: [number, number, number];
  to: [number, number, number];
  status: "planned" | "under_construction" | "active";
}

const TunnelConnection: React.FC<TunnelConnectionProps> = ({
  from,
  to,
  status,
}) => {
  const tunnelRef = useRef<THREE.Mesh>(null);

  // Calculate tunnel geometry
  const direction = new THREE.Vector3().subVectors(
    new THREE.Vector3(...to),
    new THREE.Vector3(...from)
  );
  const length = direction.length();
  const midpoint = new THREE.Vector3()
    .addVectors(new THREE.Vector3(...from), new THREE.Vector3(...to))
    .multiplyScalar(0.5);

  // Create tunnel tube geometry
  const geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
  const material = new THREE.MeshBasicMaterial({
    color:
      status === "active"
        ? "#00ff00"
        : status === "under_construction"
        ? "#ffaa00"
        : "#666666",
    transparent: true,
    opacity: status === "active" ? 0.8 : 0.4,
  });

  // Animate tunnel based on status
  useFrame((state) => {
    if (tunnelRef.current && status === "active") {
      // Pulsing effect for active tunnels
      const pulse = Math.sin(state.clock.getElapsedTime() * 2) * 0.1 + 0.9;
      tunnelRef.current.material.opacity = pulse * 0.8;
    }
  });

  return (
    <mesh
      ref={tunnelRef}
      position={midpoint}
      geometry={geometry}
      material={material}
      rotation={[
        Math.atan2(direction.z, direction.x) + Math.PI / 2,
        0,
        Math.atan2(
          direction.y,
          Math.sqrt(direction.x * direction.x + direction.z * direction.z)
        ),
      ]}
    />
  );
};

export default TunnelConnection;
