import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import * as THREE from "three";
import GlobeControls from "./GlobeControls";
import ToggleableWorkingWorldMap from "./ToggleableWorkingWorldMap";
import ToggleableCityLights from "./ToggleableCityLights";
import ToggleableEarthAtmosphere from "./ToggleableEarthAtmosphere";
import { useGameStore } from "../../store/gameStore";
import { useGameLoop } from "../../hooks/useGameLoop";

const EarthGlobe: React.FC = () => {
  const earthRef = useRef<THREE.Mesh>(null);
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const { isPlaying, gameTime, layers } = useGameStore();

  // Start the game loop
  useGameLoop();

  // Rotate Earth slowly and move sun light
  useFrame((state, delta) => {
    if (earthRef.current && isPlaying) {
      // Rotate Earth based on real time (24 hours = 1 rotation)
      const rotationSpeed = (2 * Math.PI) / (24 * 60 * 60); // One full rotation per 24 hours
      earthRef.current.rotation.y += delta * rotationSpeed;
    }

    if (sunLightRef.current && isPlaying) {
      // Move sun light around the globe based on game time
      // One day cycle every 60 seconds of game time
      const dayCycle = 60; // seconds
      const sunAngle = ((gameTime % dayCycle) / dayCycle) * 2 * Math.PI;

      // Position sun light in a circle around the globe
      const sunDistance = 10;
      sunLightRef.current.position.x = Math.cos(sunAngle) * sunDistance;
      sunLightRef.current.position.z = Math.sin(sunAngle) * sunDistance;
      sunLightRef.current.position.y = 0;
    }
  });

  return (
    <>
      <GlobeControls />

      {/* Beautiful Earth Sphere */}
      <Sphere ref={earthRef} args={[1, 128, 128]} position={[0, 0, 0]}>
        <meshPhongMaterial
          color="#1e90ff"
          transparent
          opacity={0.9}
          shininess={0}
          specular="#000000"
        />
      </Sphere>

      {/* Working World Map with Elevations */}
      <ToggleableWorkingWorldMap showContinents={layers.continents} />

      {/* City Lights on Dark Side */}
      <ToggleableCityLights showCities={layers.cities} />

      {/* Earth Atmosphere and Clouds */}
      <ToggleableEarthAtmosphere
        showAtmosphere={layers.atmosphere}
        showClouds={layers.clouds}
      />

      {/* Realistic Sun Lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight
        ref={sunLightRef}
        position={[10, 0, 0]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        color="#fff8dc"
      />
    </>
  );
};

export default EarthGlobe;
