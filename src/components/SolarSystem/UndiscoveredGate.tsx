import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface UndiscoveredGateProps {
  position: [number, number, number];
  onClick: () => void;
}

const UndiscoveredGate: React.FC<UndiscoveredGateProps> = ({
  position,
  onClick,
}) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Rotate the ring slowly and pulse the gate
  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 0.5;
    }
    if (pulseRef.current) {
      // Pulsing effect for mysterious appearance
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.8;
      pulseRef.current.scale.setScalar(pulse);
    }
  });

  const gateColor = "#6b7fff"; // Mysterious purple-blue color
  const glowColor = "#8b9fff";

  return (
    <group position={position}>
      {/* Central mysterious orb */}
      <mesh
        ref={pulseRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerEnter={() => {
          setIsHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          setIsHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial
          color={gateColor}
          emissive={gateColor}
          emissiveIntensity={isHovered ? 1.2 : 0.8}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Rotating ring around the orb */}
      <mesh
        ref={ringRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerEnter={() => {
          setIsHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          setIsHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <torusGeometry args={[0.5, 0.04, 16, 32]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={isHovered ? 0.9 : 0.6}
        />
      </mesh>

      {/* Outer glow ring */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerEnter={() => {
          setIsHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          setIsHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <ringGeometry args={[0.4, 0.55, 32]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={isHovered ? 0.4 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Question mark particles (4 orbiting points) */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2;
        const orbitRadius = 0.7;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * orbitRadius,
              Math.sin(angle * 2) * 0.1,
              Math.sin(angle) * orbitRadius,
            ]}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            onPointerEnter={() => {
              setIsHovered(true);
              document.body.style.cursor = "pointer";
            }}
            onPointerLeave={() => {
              setIsHovered(false);
              document.body.style.cursor = "default";
            }}
          >
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color={gateColor} transparent opacity={0.6} />
          </mesh>
        );
      })}

      {/* Invisible clickable sphere behind the label to block raycasting */}
      <mesh
        position={[0, 0.8, 0]}
        onClick={(e) => {
          e.stopPropagation();
          console.log("Undiscovered gate clicked - generating new system");
          onClick();
        }}
        onPointerEnter={() => {
          setIsHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          setIsHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* Label - purely visual, clicks handled by invisible sphere */}
      <Html
        position={[0, 0.8, 0]}
        center
        zIndexRange={[100, 0]}
        occlude={false}
        transform
        sprite
      >
        <div
          style={{
            background: "rgba(0, 0, 0, 0.85)",
            color: "white",
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "13px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            border: `2px solid ${gateColor}`,
            boxShadow: `0 0 10px ${gateColor}60`,
            transition: "all 0.2s ease",
            userSelect: "none",
          }}
        >
          <div style={{ fontWeight: "bold", fontStyle: "italic" }}>
            ??? Undiscovered
          </div>
        </div>
      </Html>
    </group>
  );
};

export default UndiscoveredGate;
