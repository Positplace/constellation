import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
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

      {/* Billboard group that rotates labels to face camera */}
      <Billboard
        position={[0, 0.8, 0]}
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        {/* Background plane for better text readability */}
        <mesh
          position={[0, 0, -0.01]}
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
          <planeGeometry args={[connectedSystemName.length * 0.12, 0.25]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={0.7}
            depthTest={true}
            depthWrite={false}
          />
        </mesh>

        {/* 3D Text Label that can be occluded by planets and stars */}
        <Text
          position={[0, 0, 0]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor={connectedStarColor}
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
          {connectedSystemName}
          <meshBasicMaterial
            color="white"
            transparent
            opacity={isHovered ? 1.0 : 0.9}
            depthTest={true}
            depthWrite={true}
          />
        </Text>
      </Billboard>
    </group>
  );
};

export default TunnelGate;
