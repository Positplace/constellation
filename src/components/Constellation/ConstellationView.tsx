import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import * as THREE from "three";
import TunnelConnection from "./TunnelConnection";

const ConstellationView: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  // Sample solar systems for the constellation network
  const solarSystems = [
    {
      id: "sol",
      name: "Sol",
      position: [0, 0, 0],
      discovered: true,
      colonized: true,
    },
    {
      id: "alpha_centauri",
      name: "Alpha Centauri",
      position: [5, 0, 0],
      discovered: true,
      colonized: false,
    },
    {
      id: "proxima_centauri",
      name: "Proxima Centauri",
      position: [7, 2, 0],
      discovered: true,
      colonized: false,
    },
    {
      id: "barnard_star",
      name: "Barnard's Star",
      position: [-4, 3, 0],
      discovered: false,
      colonized: false,
    },
    {
      id: "wolf_359",
      name: "Wolf 359",
      position: [3, -4, 0],
      discovered: false,
      colonized: false,
    },
    {
      id: "lalande_21185",
      name: "Lalande 21185",
      position: [-2, -5, 0],
      discovered: false,
      colonized: false,
    },
  ];

  // Tunnel connections between systems
  const tunnels = [
    { from: "sol", to: "alpha_centauri", status: "active" as const },
    {
      from: "alpha_centauri",
      to: "proxima_centauri",
      status: "under_construction" as const,
    },
    { from: "sol", to: "barnard_star", status: "planned" as const },
  ];

  // Rotate the entire constellation slowly
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <>
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={25}
        autoRotate={false}
      />

      <group ref={groupRef}>
        {/* Solar Systems */}
        {solarSystems.map((system) => (
          <group
            key={system.id}
            position={system.position as [number, number, number]}
          >
            {/* System node */}
            <Sphere args={[0.2, 16, 16]}>
              <meshBasicMaterial
                color={
                  system.colonized
                    ? "#00ff00"
                    : system.discovered
                    ? "#ffff00"
                    : "#666666"
                }
              />
            </Sphere>

            {/* System glow */}
            <Sphere args={[0.3, 16, 16]}>
              <meshBasicMaterial
                color={
                  system.colonized
                    ? "#00ff00"
                    : system.discovered
                    ? "#ffff00"
                    : "#666666"
                }
                transparent
                opacity={0.3}
              />
            </Sphere>

            {/* System label */}
            <mesh position={[0, 0.5, 0]}>
              <planeGeometry args={[1, 0.2]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.7} />
            </mesh>
          </group>
        ))}

        {/* Tunnel Connections */}
        {tunnels.map((tunnel, index) => {
          const fromSystem = solarSystems.find((s) => s.id === tunnel.from);
          const toSystem = solarSystems.find((s) => s.id === tunnel.to);

          if (!fromSystem || !toSystem) return null;

          return (
            <TunnelConnection
              key={index}
              from={fromSystem.position as [number, number, number]}
              to={toSystem.position as [number, number, number]}
              status={tunnel.status}
            />
          );
        })}
      </group>

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={1} color="#ffffff" />
    </>
  );
};

export default ConstellationView;
