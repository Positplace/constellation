import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import * as THREE from "three";
import CountryMesh from "./CountryMesh";
import GlobeControls from "./GlobeControls";
import ContinentOutlines from "./ContinentOutlines";
import ContinentShapes from "./ContinentShapes";
import WorldMap from "./WorldMap";
import SimpleWorldMap from "./SimpleWorldMap";
import WorldMapTexture from "./WorldMapTexture";
import SimpleContinentMap from "./SimpleContinentMap";
import EarthTextureMap from "./EarthTextureMap";
import AccurateWorldMap from "./AccurateWorldMap";
import RealWorldMap from "./RealWorldMap";
import WorkingWorldMap from "./WorkingWorldMap";

const EarthGlobe: React.FC = () => {
  const earthRef = useRef<THREE.Mesh>(null);

  // Rotate Earth slowly
  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <>
      <GlobeControls />

      {/* Earth Sphere with more realistic appearance */}
      <Sphere ref={earthRef} args={[1, 128, 128]} position={[0, 0, 0]}>
        <meshPhongMaterial
          color="#0066cc"
          transparent
          opacity={0.9}
          shininess={100}
          specular="#ffffff"
        />
      </Sphere>

      {/* Working World Map with Elevations */}
      <WorkingWorldMap />

      {/* Country Meshes */}
      <CountryMesh />

      {/* Enhanced Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#87ceeb" />
    </>
  );
};

export default EarthGlobe;
