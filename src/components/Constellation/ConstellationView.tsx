import React, { useRef, useState, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Html, Torus } from "@react-three/drei";
import * as THREE from "three";
import TunnelConnection from "./TunnelConnection";
import Starfield from "../Background/Starfield";
import { useGameStore } from "../../store/gameStore";
import { useSocket } from "../../hooks/useSocket";
import { useMultiplayerStore } from "../../store/multiplayerStore";

const ConstellationView: React.FC = () => {
  const {
    solarSystems,
    tunnels,
    currentSystemId,
    setCurrentSystem,
    setActiveView,
    generateAndAddSystem,
    canAddConnection,
    updateSystemPosition,
    setSelectedObject,
  } = useGameStore();
  const { emitSystemGenerated, emitCurrentSystemChanged, changeView } =
    useSocket();
  const { isConnected } = useMultiplayerStore();

  const [hoveredSystemId, setHoveredSystemId] = useState<string | null>(null);
  const [draggingSystemId, setDraggingSystemId] = useState<string | null>(null);
  const orbitControlsRef = useRef<any>(null);
  const { camera, raycaster, gl } = useThree();
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const dragPointRef = useRef(new THREE.Vector3());
  const lastUpdateTimeRef = useRef(0);
  const ringRotationRef = useRef(0);

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
    if (draggingSystemId) return; // Don't select if we're dragging
    setCurrentSystem(systemId);
    // Clear selection when clicking a star
    setSelectedObject(null);
    // Emit to server if connected
    if (isConnected) {
      emitCurrentSystemChanged(systemId);
    }
  };

  const handlePointerDown = useCallback((e: any, systemId: string) => {
    e.stopPropagation();
    setDraggingSystemId(systemId);

    // Change cursor to pointer hand
    document.body.style.cursor = "grabbing";

    // Disable orbit controls while dragging
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false;
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: any) => {
      if (!draggingSystemId) return;
      e.stopPropagation();

      // Throttle updates to improve performance
      const now = performance.now();
      if (now - lastUpdateTimeRef.current < 16) return; // ~60fps
      lastUpdateTimeRef.current = now;

      // Calculate intersection with drag plane
      const pointer = new THREE.Vector2(
        (e.clientX / gl.domElement.clientWidth) * 2 - 1,
        -(e.clientY / gl.domElement.clientHeight) * 2 + 1
      );

      raycaster.setFromCamera(pointer, camera);

      // Update drag plane to be perpendicular to camera
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      dragPlaneRef.current.setFromNormalAndCoplanarPoint(
        cameraDirection,
        new THREE.Vector3(0, 0, 0)
      );

      if (
        raycaster.ray.intersectPlane(dragPlaneRef.current, dragPointRef.current)
      ) {
        updateSystemPosition(draggingSystemId, [
          dragPointRef.current.x,
          dragPointRef.current.y,
          dragPointRef.current.z,
        ]);
      }
    },
    [draggingSystemId, camera, raycaster, gl, updateSystemPosition]
  );

  const handlePointerUp = useCallback(() => {
    setDraggingSystemId(null);

    // Reset cursor
    document.body.style.cursor = "default";

    // Re-enable orbit controls
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true;
    }
  }, []);

  // Animate ring rotation
  useFrame((state, delta) => {
    ringRotationRef.current += delta * 2; // Rotate at 2 radians per second
  });

  const currentSystem = solarSystems.find((s) => s.id === currentSystemId);
  const canExplore = currentSystemId && canAddConnection(currentSystemId);

  return (
    <>
      {/* Starfield background - uses current system's star type if available */}
      <Starfield starType={currentSystem?.star.type || "yellow_star"} />

      <OrbitControls
        ref={orbitControlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={25}
        autoRotate={false}
      />

      <group
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerMissed={(e) => {
          // Only clear selection if we're not dragging and clicked on empty space
          if (!draggingSystemId) {
            setSelectedObject(null);
          }
        }}
      >
        {/* Solar Systems */}
        {solarSystems.map((system) => {
          const isSelected = system.id === currentSystemId;
          const isHovered = system.id === hoveredSystemId;
          const isDragging = system.id === draggingSystemId;
          const starColor = system.star.color;

          return (
            <group
              key={system.id}
              position={system.position as [number, number, number]}
              onClick={(e) => {
                e.stopPropagation();
                handleSystemClick(system.id);
              }}
              onPointerDown={(e) => handlePointerDown(e, system.id)}
              onPointerEnter={(e) => {
                if (!draggingSystemId) {
                  setHoveredSystemId(system.id);
                  document.body.style.cursor = "pointer";
                }
              }}
              onPointerLeave={(e) => {
                setHoveredSystemId(null);
                document.body.style.cursor = "default";
              }}
            >
              {/* System node */}
              <Sphere
                args={[isDragging ? 0.3 : isSelected ? 0.25 : 0.2, 16, 16]}
              >
                <meshBasicMaterial color={starColor} />
              </Sphere>

              {/* Inner glow */}
              <Sphere
                args={[isDragging ? 0.4 : isSelected ? 0.35 : 0.26, 16, 16]}
              >
                <meshBasicMaterial
                  color={starColor}
                  transparent
                  opacity={isDragging ? 0.8 : isSelected ? 0.7 : 0.4}
                  blending={THREE.AdditiveBlending}
                />
              </Sphere>

              {/* Outer glow */}
              <Sphere
                args={[isDragging ? 0.6 : isSelected ? 0.5 : 0.4, 16, 16]}
              >
                <meshBasicMaterial
                  color={starColor}
                  transparent
                  opacity={isDragging ? 0.5 : isSelected ? 0.4 : 0.2}
                  blending={THREE.AdditiveBlending}
                />
              </Sphere>

              {/* Current system indicator - animated rotating 3D torus rings */}
              {isSelected && (
                <>
                  {/* Ring 1 - horizontal */}
                  <Torus
                    args={[0.55, 0.05, 8, 32]}
                    rotation={[Math.PI / 2, ringRotationRef.current, 0]}
                  >
                    <meshBasicMaterial
                      color="#ffff00"
                      transparent
                      opacity={0.8}
                    />
                  </Torus>
                  {/* Ring 2 - vertical */}
                  <Torus
                    args={[0.55, 0.05, 8, 32]}
                    rotation={[0, ringRotationRef.current, Math.PI / 2]}
                  >
                    <meshBasicMaterial
                      color="#ffff00"
                      transparent
                      opacity={0.8}
                    />
                  </Torus>
                  {/* Ring 3 - diagonal */}
                  <Torus
                    args={[0.55, 0.05, 8, 32]}
                    rotation={[ringRotationRef.current, Math.PI / 4, 0]}
                  >
                    <meshBasicMaterial
                      color="#ffff00"
                      transparent
                      opacity={0.8}
                    />
                  </Torus>
                </>
              )}

              {/* Hover/selection indicator ring */}
              {(isSelected || isHovered || isDragging) && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.35, 0.4, 32]} />
                  <meshBasicMaterial
                    color={
                      isDragging
                        ? "#ffff00"
                        : isSelected
                        ? "#00ff00"
                        : "#ffffff"
                    }
                    transparent
                    opacity={0.8}
                  />
                </mesh>
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
            pointerEvents: draggingSystemId ? "none" : "auto",
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
