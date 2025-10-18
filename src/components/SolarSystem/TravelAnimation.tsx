import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";

interface TravelAnimationProps {
  fromSystemName: string;
  toSystemName: string;
  fromStarColor: string;
  toStarColor: string;
  duration?: number;
  onComplete: () => void;
}

const TravelAnimation: React.FC<TravelAnimationProps> = ({
  fromSystemName,
  toSystemName,
  fromStarColor,
  toStarColor,
  duration = 2000,
  onComplete,
}) => {
  const { camera } = useThree();
  const startTime = useRef(Date.now());
  const particlesRef = useRef<THREE.Points>(null);
  const tunnelRingRefs = useRef<THREE.Mesh[]>([]);

  // Create tunnel particles
  const particleSystem = useMemo(() => {
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Distribute particles in a cylindrical tunnel
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 10;
      const z = Math.random() * 100 - 50;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = z;

      // Use destination star color
      const color = new THREE.Color(toStarColor);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    return geometry;
  }, [toStarColor]);

  // Animate the tunnel warp
  useFrame(() => {
    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);

    // Position camera in tunnel center
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);

    // Move particles to create tunnel effect
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position
        .array as Float32Array;

      for (let i = 0; i < positions.length / 3; i++) {
        // Move particles backward to create forward motion effect
        positions[i * 3 + 2] += 1.2;

        // Reset particles that have passed
        if (positions[i * 3 + 2] > 50) {
          positions[i * 3 + 2] = -50;
        }
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.rotation.z = elapsed * 0.0003;
    }

    // Rotate tunnel rings
    tunnelRingRefs.current.forEach((ring, i) => {
      if (ring) {
        ring.rotation.z = elapsed * 0.002 * (i % 2 === 0 ? 1 : -1);
      }
    });

    // Camera shake effect for intensity
    const shakeIntensity = Math.sin(progress * Math.PI); // Peak in middle
    camera.position.x += Math.sin(elapsed * 0.01) * 0.15 * shakeIntensity;
    camera.position.y += Math.cos(elapsed * 0.015) * 0.15 * shakeIntensity;

    // Complete animation
    if (progress >= 1) {
      onComplete();
    }
  });

  const elapsed = Date.now() - startTime.current;
  const progress = Math.min(elapsed / duration, 1);

  return (
    <group>
      {/* Particle tunnel effect */}
      <points ref={particlesRef} geometry={particleSystem}>
        <pointsMaterial
          size={0.15}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Tunnel rings for depth */}
      {[...Array(10)].map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) tunnelRingRefs.current[i] = el;
          }}
          position={[0, 0, -40 + i * 10]}
        >
          <torusGeometry args={[8 - i * 0.3, 0.2, 16, 32]} />
          <meshBasicMaterial
            color={new THREE.Color(toStarColor)}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}

      {/* Glowing center */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color={toStarColor} transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

export default TravelAnimation;
