import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import * as THREE from "three";
import PlanetOrbit from "./PlanetOrbit";

const SolarSystemView: React.FC = () => {
  const sunRef = useRef<THREE.Mesh>(null);

  // Rotate Sun slowly
  useFrame((state, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.2;
    }
  });

  const planets = [
    { name: "Mercury", distance: 1.5, size: 0.1, color: "#8c7853", speed: 0.8 },
    { name: "Venus", distance: 2.0, size: 0.15, color: "#ffc649", speed: 0.6 },
    { name: "Earth", distance: 2.5, size: 0.16, color: "#4a90e2", speed: 0.5 },
    { name: "Mars", distance: 3.0, size: 0.12, color: "#cd5c5c", speed: 0.4 },
    { name: "Jupiter", distance: 4.5, size: 0.4, color: "#d2691e", speed: 0.2 },
    {
      name: "Saturn",
      distance: 6.0,
      size: 0.35,
      color: "#f4a460",
      speed: 0.15,
    },
    { name: "Uranus", distance: 7.5, size: 0.2, color: "#40e0d0", speed: 0.1 },
    {
      name: "Neptune",
      distance: 9.0,
      size: 0.2,
      color: "#4169e1",
      speed: 0.08,
    },
  ];

  return (
    <>
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={20}
        autoRotate={false}
      />

      {/* Sun */}
      <Sphere ref={sunRef} args={[0.3, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#ffd700" />
      </Sphere>

      {/* Sun glow effect */}
      <Sphere args={[0.4, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#ffd700" transparent opacity={0.3} />
      </Sphere>

      {/* Planets */}
      {planets.map((planet, index) => (
        <PlanetOrbit
          key={planet.name}
          name={planet.name}
          distance={planet.distance}
          size={planet.size}
          color={planet.color}
          speed={planet.speed}
          angle={(index * Math.PI) / 4} // Start at different positions
        />
      ))}

      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#ffd700" />
    </>
  );
};

export default SolarSystemView;
