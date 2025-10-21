import React, { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
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
    setSelectedObject,
    constellationCameraState,
    saveConstellationCameraState,
    updateSystemPosition,
  } = useGameStore();
  const { emitSystemGenerated, emitCurrentSystemChanged } = useSocket();
  const { isConnected } = useMultiplayerStore();
  const { camera, raycaster, gl } = useThree();

  const [hoveredSystemId, setHoveredSystemId] = useState<string | null>(null);
  const [draggingSystemId, setDraggingSystemId] = useState<string | null>(null);
  const orbitControlsRef = useRef<any>(null);
  const ringRotationRef = useRef(0);
  const hasRestoredCamera = useRef(false);
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const dragPointRef = useRef(new THREE.Vector3());
  const lastUpdateTimeRef = useRef(0);

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
    // Don't transition if we were dragging
    if (draggingSystemId) return;

    // Save current camera state before transitioning
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current;
      saveConstellationCameraState({
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: [controls.target.x, controls.target.y, controls.target.z],
      });
    }

    setCurrentSystem(systemId);
    // Clear selection when clicking a star
    setSelectedObject(null);
    // Emit to server if connected
    if (isConnected) {
      emitCurrentSystemChanged(systemId);
    }
    // Transition to solar system view
    setActiveView("solar");
  };

  const handleContextMenu = (e: any, systemId: string) => {
    e.stopPropagation();
    e.nativeEvent.preventDefault();

    setDraggingSystemId(systemId);

    // Change cursor to grabbing
    document.body.style.cursor = "grabbing";

    // Disable orbit controls while dragging
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false;
    }
  };

  const handlePointerMove = (e: any) => {
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
  };

  const handlePointerUp = () => {
    setDraggingSystemId(null);

    // Reset cursor
    document.body.style.cursor = "default";

    // Re-enable orbit controls
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true;
    }
  };

  // Restore saved camera state on mount
  useEffect(() => {
    if (
      constellationCameraState &&
      orbitControlsRef.current &&
      !hasRestoredCamera.current
    ) {
      const controls = orbitControlsRef.current;
      const { position, target } = constellationCameraState;

      // Restore camera position and target
      camera.position.set(position[0], position[1], position[2]);
      controls.target.set(target[0], target[1], target[2]);
      controls.update();

      hasRestoredCamera.current = true;
    }
  }, [constellationCameraState, camera]);

  // Prevent context menu while dragging
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
      if (draggingSystemId) {
        e.preventDefault();
      }
    };

    window.addEventListener("contextmenu", preventContextMenu);
    return () => window.removeEventListener("contextmenu", preventContextMenu);
  }, [draggingSystemId]);

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
          // Clear selection when clicked on empty space
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
          const isBlackHole = system.star.type === "black_hole";
          const isBinary = system.star.type === "binary_star";
          const starColor = isBlackHole
            ? system.star.blackHole?.accretionDiskColor || "#ff6b35"
            : system.star.color;
          const companionColor = isBinary
            ? system.star.companion?.color || "#ff8c42"
            : null;

          return (
            <group
              key={system.id}
              position={system.position as [number, number, number]}
              onClick={(e) => {
                e.stopPropagation();
                handleSystemClick(system.id);
              }}
              onContextMenu={(e) => handleContextMenu(e, system.id)}
              onPointerEnter={(e) => {
                if (!draggingSystemId) {
                  setHoveredSystemId(system.id);
                  document.body.style.cursor = "pointer";
                }
              }}
              onPointerLeave={(e) => {
                if (!draggingSystemId) {
                  setHoveredSystemId(null);
                  document.body.style.cursor = "default";
                }
              }}
            >
              {isBlackHole ? (
                <>
                  {/* Black hole event horizon - small dark sphere */}
                  <Sphere
                    args={[isDragging ? 0.15 : isSelected ? 0.12 : 0.1, 16, 16]}
                  >
                    <meshBasicMaterial color="#000000" />
                  </Sphere>

                  {/* Gravitational lensing effect */}
                  <Sphere
                    args={[isDragging ? 0.2 : isSelected ? 0.17 : 0.15, 16, 16]}
                  >
                    <meshBasicMaterial
                      color="#1a1a2e"
                      transparent
                      opacity={0.6}
                    />
                  </Sphere>

                  {/* Accretion disk glow - horizontal ring */}
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry
                      args={[
                        isDragging ? 0.2 : isSelected ? 0.17 : 0.15,
                        isDragging ? 0.4 : isSelected ? 0.35 : 0.3,
                        32,
                      ]}
                    />
                    <meshBasicMaterial
                      color={starColor}
                      transparent
                      opacity={0.9}
                      side={THREE.DoubleSide}
                      blending={THREE.AdditiveBlending}
                    />
                  </mesh>

                  {/* Outer accretion disk glow */}
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry
                      args={[
                        isDragging ? 0.3 : isSelected ? 0.27 : 0.22,
                        isDragging ? 0.6 : isSelected ? 0.5 : 0.45,
                        32,
                      ]}
                    />
                    <meshBasicMaterial
                      color={starColor}
                      transparent
                      opacity={0.5}
                      side={THREE.DoubleSide}
                      blending={THREE.AdditiveBlending}
                    />
                  </mesh>

                  {/* Polar jet - top */}
                  <mesh position={[0, isDragging ? 0.5 : isSelected ? 0.4 : 0.35, 0]}>
                    <cylinderGeometry
                      args={[
                        0.02,
                        0.01,
                        isDragging ? 1.0 : isSelected ? 0.8 : 0.7,
                        8,
                      ]}
                    />
                    <meshBasicMaterial
                      color={starColor}
                      transparent
                      opacity={0.7}
                      blending={THREE.AdditiveBlending}
                    />
                  </mesh>

                  {/* Polar jet - bottom */}
                  <mesh position={[0, isDragging ? -0.5 : isSelected ? -0.4 : -0.35, 0]}>
                    <cylinderGeometry
                      args={[
                        0.01,
                        0.02,
                        isDragging ? 1.0 : isSelected ? 0.8 : 0.7,
                        8,
                      ]}
                    />
                    <meshBasicMaterial
                      color={starColor}
                      transparent
                      opacity={0.7}
                      blending={THREE.AdditiveBlending}
                    />
                  </mesh>

                  {/* Hawking radiation glow */}
                  <Sphere
                    args={[isDragging ? 0.25 : isSelected ? 0.22 : 0.18, 16, 16]}
                  >
                    <meshBasicMaterial
                      color="#4a5fff"
                      transparent
                      opacity={0.2}
                      blending={THREE.AdditiveBlending}
                    />
                  </Sphere>
                </>
              ) : isBinary ? (
                <>
                  {/* Binary star system - Primary star */}
                  <Sphere
                    args={[isDragging ? 0.25 : isSelected ? 0.2 : 0.16, 16, 16]}
                    position={[-0.08, 0, 0]}
                  >
                    <meshBasicMaterial color={starColor} />
                  </Sphere>

                  {/* Primary star glow */}
                  <Sphere
                    args={[isDragging ? 0.35 : isSelected ? 0.28 : 0.22, 16, 16]}
                    position={[-0.08, 0, 0]}
                  >
                    <meshBasicMaterial
                      color={starColor}
                      transparent
                      opacity={isDragging ? 0.7 : isSelected ? 0.6 : 0.35}
                      blending={THREE.AdditiveBlending}
                    />
                  </Sphere>

                  {/* Companion star - smaller */}
                  <Sphere
                    args={[isDragging ? 0.2 : isSelected ? 0.16 : 0.12, 16, 16]}
                    position={[0.08, 0, 0]}
                  >
                    <meshBasicMaterial color={companionColor} />
                  </Sphere>

                  {/* Companion star glow */}
                  <Sphere
                    args={[isDragging ? 0.28 : isSelected ? 0.22 : 0.18, 16, 16]}
                    position={[0.08, 0, 0]}
                  >
                    <meshBasicMaterial
                      color={companionColor}
                      transparent
                      opacity={isDragging ? 0.6 : isSelected ? 0.5 : 0.3}
                      blending={THREE.AdditiveBlending}
                    />
                  </Sphere>

                  {/* Combined outer glow */}
                  <Sphere
                    args={[isDragging ? 0.6 : isSelected ? 0.5 : 0.4, 16, 16]}
                  >
                    <meshBasicMaterial
                      color={starColor}
                      transparent
                      opacity={isDragging ? 0.4 : isSelected ? 0.3 : 0.15}
                      blending={THREE.AdditiveBlending}
                    />
                  </Sphere>
                </>
              ) : (
                <>
                  {/* Regular star - System node */}
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
                </>
              )}

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

              {/* Hover label with system name and star type */}
              {isHovered && (
                <Html
                  position={[0, 1.5, 0]}
                  center
                  distanceFactor={10}
                  style={{ pointerEvents: "none" }}
                >
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,40,0.9) 100%)",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      whiteSpace: "nowrap",
                      border: `2px solid ${starColor}`,
                      boxShadow: `0 0 15px ${starColor}60, 0 4px 10px rgba(0,0,0,0.5)`,
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: "bold",
                        marginBottom: "2px",
                      }}
                    >
                      {system.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: starColor,
                        opacity: 0.9,
                      }}
                    >
                      {system.star.type.replace(/_/g, " ").toUpperCase()}
                    </div>
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
