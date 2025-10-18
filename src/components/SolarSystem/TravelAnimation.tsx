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
  const starStreaksRef = useRef<THREE.Points>(null);
  const initialCameraPos = useRef(camera.position.clone());

  // Create star streak particles for hyperspace effect
  const starStreakSystem = useMemo(() => {
    const particleCount = 3000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const fromColor = new THREE.Color(fromStarColor);
    const toColor = new THREE.Color(toStarColor);

    for (let i = 0; i < particleCount; i++) {
      // Distribute stars in a sphere around the camera
      const radius = 50 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi) - 100; // Start behind camera

      // Transition colors from source to destination
      const color = fromColor.clone().lerp(toColor, Math.random());
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.5 + Math.random() * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    return geometry;
  }, [fromStarColor, toStarColor]);

  // Animate the hyperspace jump
  useFrame(() => {
    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);

    // Ease in-out for smooth acceleration/deceleration
    const easeProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    // Speed increases as we progress (simulating acceleration)
    const speed = 2 + easeProgress * 50;

    // Position camera
    camera.position.copy(initialCameraPos.current);
    camera.rotation.set(0, 0, 0);

    // Move stars toward and past camera for hyperspace effect
    if (starStreaksRef.current) {
      const positions = starStreaksRef.current.geometry.attributes.position
        .array as Float32Array;
      const sizes = starStreaksRef.current.geometry.attributes.size
        .array as Float32Array;

      for (let i = 0; i < positions.length / 3; i++) {
        // Move stars forward (toward and past camera)
        positions[i * 3 + 2] += speed;

        // Stretch stars into streaks based on speed (motion blur)
        sizes[i] = (0.5 + Math.random() * 2) * (1 + speed * 0.3);

        // Reset stars that have passed the camera
        if (positions[i * 3 + 2] > 100) {
          positions[i * 3 + 2] = -100 - Math.random() * 100;
          // Reset size
          sizes[i] = 0.5 + Math.random() * 2;
        }
      }

      starStreaksRef.current.geometry.attributes.position.needsUpdate = true;
      starStreaksRef.current.geometry.attributes.size.needsUpdate = true;
    }

    // Slight camera shake for intensity during peak speed
    const shakeIntensity = Math.sin(progress * Math.PI) * 0.3;
    camera.position.x += Math.sin(elapsed * 0.02) * shakeIntensity;
    camera.position.y += Math.cos(elapsed * 0.025) * shakeIntensity;

    // Subtle FOV effect (zoom in slightly at peak speed)
    const fovEffect = Math.sin(progress * Math.PI) * 5;
    camera.fov = 60 + fovEffect;
    camera.updateProjectionMatrix();

    // Complete animation
    if (progress >= 1) {
      camera.fov = 60; // Reset FOV
      camera.updateProjectionMatrix();
      onComplete();
    }
  });

  const elapsed = Date.now() - startTime.current;
  const progress = Math.min(elapsed / duration, 1);

  return (
    <group>
      {/* Star streak particles for hyperspace effect */}
      <points ref={starStreaksRef} geometry={starStreakSystem}>
        <pointsMaterial
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Travel status HUD */}
      <Html fullscreen>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: toStarColor,
              textShadow: `0 0 20px ${toStarColor}, 0 0 40px ${toStarColor}`,
              opacity: Math.sin(progress * Math.PI),
              marginBottom: "10px",
            }}
          >
            Traveling to {toSystemName}
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#ffffff",
              opacity: 0.7 * Math.sin(progress * Math.PI),
            }}
          >
            {Math.round(progress * 100)}%
          </div>
        </div>
      </Html>
    </group>
  );
};

export default TravelAnimation;
