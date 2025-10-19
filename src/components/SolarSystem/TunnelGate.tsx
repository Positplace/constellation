import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface TunnelGateProps {
  position: [number, number, number];
  connectedSystemName: string;
  connectedStarColor: string;
  onClick: () => void;
}

const TunnelGate: React.FC<TunnelGateProps> = ({
  position,
  connectedSystemName,
  connectedStarColor,
  onClick,
}) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Rotate the ring slowly
  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Central box/station */}
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
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial
          color={connectedStarColor}
          emissive={connectedStarColor}
          emissiveIntensity={isHovered ? 0.8 : 0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Rotating ring around the box */}
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
          color={connectedStarColor}
          transparent
          opacity={isHovered ? 0.9 : 0.7}
        />
      </mesh>

      {/* Inner glow circle */}
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
        <ringGeometry args={[0.35, 0.4, 32]} />
        <meshBasicMaterial
          color={connectedStarColor}
          transparent
          opacity={isHovered ? 0.5 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Invisible clickable sphere behind the label to block raycasting */}
      <mesh
        position={[0, 0.8, 0]}
        onClick={(e) => {
          e.stopPropagation();
          console.log("Invisible blocker clicked - initiating travel");
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
            border: `2px solid ${connectedStarColor}`,
            boxShadow: `0 0 10px ${connectedStarColor}40`,
            transition: "all 0.2s ease",
            userSelect: "none",
          }}
        >
          <div style={{ fontWeight: "bold" }}>{connectedSystemName}</div>
        </div>
      </Html>
    </group>
  );
};

export default TunnelGate;
