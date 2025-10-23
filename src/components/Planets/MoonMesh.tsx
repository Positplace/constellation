import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { MoonData } from "../../types/planet.types";

interface MoonMeshProps {
  moon: MoonData;
  renderScale?: number;
  isSelected?: boolean;
  onClick?: (moonPos: THREE.Vector3) => void;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Renders a moon as a small sphere with material-based coloring
 */
export const MoonMesh: React.FC<MoonMeshProps> = ({
  moon,
  renderScale = 0.16,
  isSelected = false,
  onClick,
}) => {
  // Calculate moon size in render units with minimum size for visibility
  const calculatedSize = (moon.size / EARTH_RADIUS_KM) * renderScale;
  const moonRadiusUnits = Math.max(calculatedSize, 0.01); // Minimum 0.01 render units

  // Generate color based on moon planet type
  const moonColor = useMemo(() => {
    switch (moon.type) {
      case "ice_world":
        return "#E6F3FF"; // Light blue-white
      case "rocky_world":
        return "#8B7355"; // Brownish gray
      case "terrestrial":
        return "#4A5D23"; // Earth-like green-brown
      case "desert_world":
        return "#D2B48C"; // Sandy beige
      case "dwarf_planet":
        return "#696969"; // Dark gray
      case "lava_world":
        return "#FF4500"; // Orange-red
      case "ocean_world":
        return "#4682B4"; // Steel blue
      case "frozen_world":
        return "#B0E0E6"; // Powder blue
      default:
        return "#8B7355"; // Default brownish gray
    }
  }, [moon.type]);

  // Memoize geometry to prevent recreation every render
  const moonGeometry = useMemo(
    () => new THREE.SphereGeometry(moonRadiusUnits, 16, 16),
    [moonRadiusUnits]
  );

  // Dispose geometry on cleanup
  useEffect(() => {
    return () => {
      moonGeometry.dispose();
    };
  }, [moonGeometry]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onClick) {
      const worldPos = new THREE.Vector3();
      e.object.getWorldPosition(worldPos);
      onClick(worldPos);
    }
  };

  return (
    <group>
      <mesh
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "auto";
        }}
        castShadow
        receiveShadow
      >
        <primitive object={moonGeometry} />
        <meshPhongMaterial
          color={moonColor}
          shininess={5}
          specular={new THREE.Color("#000000")}
        />
      </mesh>
    </group>
  );
};
