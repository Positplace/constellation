import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";

interface PlanetOrbitProps {
  name: string;
  distance: number;
  size: number;
  color: string;
  speed: number;
  angle: number;
}

const PlanetOrbit: React.FC<PlanetOrbitProps> = ({
  name,
  distance,
  size,
  color,
  speed,
  angle,
}) => {
  const planetRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (planetRef.current) {
      const time = state.clock.getElapsedTime();
      const x = Math.cos(time * speed + angle) * distance;
      const z = Math.sin(time * speed + angle) * distance;
      planetRef.current.position.set(x, 0, z);
    }
  });

  return (
    <group>
      {/* Orbital path */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[distance - 0.01, distance + 0.01, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
      </mesh>

      {/* Planet */}
      <Sphere
        ref={planetRef}
        args={[size, 16, 16]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshPhongMaterial
          color={hovered ? "#ffffff" : color}
          shininess={100}
        />
      </Sphere>

      {/* Planet label */}
      {hovered && (
        <mesh position={[0, size + 0.2, 0]}>
          <planeGeometry args={[0.5, 0.1]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
};

export default PlanetOrbit;
