import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Html } from "@react-three/drei";
import * as THREE from "three";
import TunnelConnection from "./TunnelConnection";
import { useGameStore } from "../../store/gameStore";
import { useSocket } from "../../hooks/useSocket";
import { useMultiplayerStore } from "../../store/multiplayerStore";

const ConstellationView: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const {
    solarSystems,
    tunnels,
    currentSystemId,
    setCurrentSystem,
    setActiveView,
    generateAndAddSystem,
    canAddConnection,
  } = useGameStore();
  const { emitSystemGenerated, emitCurrentSystemChanged, changeView } =
    useSocket();
  const { isConnected } = useMultiplayerStore();

  const [hoveredSystemId, setHoveredSystemId] = useState<string | null>(null);

  // Rotate the entire constellation slowly
  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  const handleExplore = () => {
    if (!currentSystemId) return;

    if (!canAddConnection(currentSystemId)) {
      alert("This system has reached the maximum of 3 connections!");
      return;
    }

    try {
      const newSystem = generateAndAddSystem(currentSystemId);
      // Emit to server if connected
      if (isConnected) {
        emitSystemGenerated(newSystem, currentSystemId);
      }
    } catch (error) {
      console.error("Failed to generate system:", error);
      alert("Failed to generate new system");
    }
  };

  const handleSystemClick = (systemId: string) => {
    setCurrentSystem(systemId);
    setActiveView("solar");
    // Emit to server if connected
    if (isConnected) {
      emitCurrentSystemChanged(systemId);
      changeView("solar");
    }
  };

  const currentSystem = solarSystems.find((s) => s.id === currentSystemId);
  const canExplore = currentSystemId && canAddConnection(currentSystemId);

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
        {solarSystems.map((system) => {
          const isSelected = system.id === currentSystemId;
          const isHovered = system.id === hoveredSystemId;
          const starColor = system.star.color;

          return (
            <group
              key={system.id}
              position={system.position as [number, number, number]}
              onClick={(e) => {
                e.stopPropagation();
                handleSystemClick(system.id);
              }}
              onPointerEnter={() => setHoveredSystemId(system.id)}
              onPointerLeave={() => setHoveredSystemId(null)}
            >
              {/* System node */}
              <Sphere args={[isSelected ? 0.25 : 0.2, 16, 16]}>
                <meshBasicMaterial color={starColor} />
              </Sphere>

              {/* System glow */}
              <Sphere args={[isSelected ? 0.4 : 0.3, 16, 16]}>
                <meshBasicMaterial
                  color={starColor}
                  transparent
                  opacity={isSelected ? 0.5 : 0.3}
                />
              </Sphere>

              {/* Hover/selection indicator ring */}
              {(isSelected || isHovered) && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.35, 0.4, 32]} />
                  <meshBasicMaterial
                    color={isSelected ? "#00ff00" : "#ffffff"}
                    transparent
                    opacity={0.8}
                  />
                </mesh>
              )}

              {/* System label */}
              {(isHovered || isSelected) && (
                <Html position={[0, 0.6, 0]} center>
                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.8)",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                      border: `1px solid ${starColor}`,
                    }}
                  >
                    <div style={{ fontWeight: "bold" }}>{system.name}</div>
                    <div style={{ fontSize: "10px", color: "#aaa" }}>
                      {system.star.name}
                    </div>
                    {system.colonized && (
                      <div style={{ fontSize: "10px", color: "#00ff00" }}>
                        Colonized
                      </div>
                    )}
                  </div>
                </Html>
              )}
            </group>
          );
        })}

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

      {/* Explore Button */}
      <Html fullscreen>
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            zIndex: 10,
          }}
        >
          <button
            onClick={handleExplore}
            disabled={!canExplore}
            style={{
              background: canExplore
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "#666",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: canExplore ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: canExplore
                ? "0 4px 15px rgba(102, 126, 234, 0.4)"
                : "none",
              transition: "all 0.3s ease",
              opacity: canExplore ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              if (canExplore) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(102, 126, 234, 0.6)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = canExplore
                ? "0 4px 15px rgba(102, 126, 234, 0.4)"
                : "none";
            }}
          >
            <span style={{ fontSize: "20px" }}>🚀</span>
            <span>Explore</span>
            {currentSystem && (
              <span
                style={{
                  fontSize: "12px",
                  opacity: 0.8,
                  marginLeft: "4px",
                }}
              >
                ({currentSystem.connections.length}/3)
              </span>
            )}
          </button>
        </div>
      </Html>
    </>
  );
};

export default ConstellationView;
