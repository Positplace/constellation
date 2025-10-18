import React, { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGameStore } from "../../store/gameStore";
import { Country } from "../../types/game.types";
import * as THREE from "three";
import countriesData from "../../data/countries.json";

const CountryMesh: React.FC = () => {
  const { setSelectedCountry } = useGameStore();
  const { camera, raycaster, mouse } = useThree();
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const meshRefs = useRef<{ [key: string]: THREE.Mesh }>({});

  // Convert lat/lng to 3D coordinates on sphere
  const latLngToVector3 = (lat: number, lng: number, radius: number = 1.02) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  };

  // Get continent color
  const getContinentColor = (continent: string) => {
    const colors: { [key: string]: string } = {
      "North America": "#4a90e2",
      "South America": "#7ed321",
      Europe: "#f5a623",
      Asia: "#d0021b",
      Africa: "#9013fe",
      Oceania: "#50e3c2",
      Antarctica: "#b8e986",
    };
    return colors[continent] || "#4a90e2";
  };

  // Create country markers with realistic positioning
  const createCountryMesh = (country: Country) => {
    const position = latLngToVector3(country.latitude, country.longitude);
    const continentColor = getContinentColor(country.continent);

    // Create a small sphere for the country marker
    const geometry = new THREE.SphereGeometry(0.02, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: hoveredCountry === country.id ? "#ff6b6b" : continentColor,
      transparent: true,
      opacity: hoveredCountry === country.id ? 1.0 : 0.8,
    });

    return (
      <mesh
        key={country.id}
        ref={(ref) => {
          if (ref) meshRefs.current[country.id] = ref;
        }}
        position={position}
        geometry={geometry}
        material={material}
        onClick={(event) => {
          event.stopPropagation();
          setSelectedCountry(country);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHoveredCountry(country.id);
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          setHoveredCountry(null);
        }}
      />
    );
  };

  // Handle mouse interactions
  useFrame(() => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(
      Object.values(meshRefs.current),
      false
    );

    if (intersects.length > 0) {
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "auto";
    }
  });

  return (
    <group>{countriesData.map((country) => createCountryMesh(country))}</group>
  );
};

export default CountryMesh;
