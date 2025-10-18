import { useMemo } from "react";
import * as THREE from "three";
import { PlanetData } from "../../types/planet.types";
import { generateSurfaceTextures } from "../../utils/textureGenerators";

interface PlanetMeshProps {
  planet: PlanetData;
  renderScale?: number;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Renders the actual planet mesh with textures and atmosphere.
 * This is the visual representation that gets rotated.
 */
export const PlanetMesh: React.FC<PlanetMeshProps> = ({
  planet,
  renderScale = 0.16,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  // Generate textures
  const { map, displacementMap } = useMemo(
    () => generateSurfaceTextures(planet),
    [planet.id]
  );

  const radiusUnits = (planet.radius / EARTH_RADIUS_KM) * renderScale;

  // Only ice planets should be glossy
  const isIcyPlanet =
    planet.type === "ice_giant" || planet.type === "ice_world";

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {/* Main planet sphere */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[radiusUnits, 128, 128]} />
        <meshPhongMaterial
          map={map}
          displacementMap={displacementMap}
          displacementScale={0.015}
          shininess={isIcyPlanet ? 100 : 10}
          specular={new THREE.Color(isIcyPlanet ? "#ffffff" : "#000000")}
          reflectivity={isIcyPlanet ? 0.95 : 0}
        />
      </mesh>

      {/* Atmosphere */}
      {planet.atmosphere.present && (
        <mesh>
          <sphereGeometry args={[radiusUnits * 1.06, 64, 64]} />
          <meshBasicMaterial
            color={planet.atmosphere.color}
            transparent
            opacity={planet.atmosphere.opacity}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Rotation marker - a small dot to make rotation visible */}
      <mesh position={[radiusUnits * 0.95, 0, 0]}>
        <sphereGeometry args={[radiusUnits * 0.05, 16, 16]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </group>
  );
};
