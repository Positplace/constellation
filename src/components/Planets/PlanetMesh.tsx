import { useMemo, useEffect } from "react";
import * as THREE from "three";
import { PlanetData } from "../../types/planet.types";
import { generateSurfaceTextures } from "../../utils/textureGenerators";

interface PlanetMeshProps {
  planet: PlanetData;
  renderScale?: number;
  onClick?: () => void;
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
}) => {
  // Generate textures
  const { map, displacementMap } = useMemo(
    () => generateSurfaceTextures(planet),
    [planet.id]
  );

  // Dispose textures when component unmounts or planet changes
  useEffect(() => {
    return () => {
      map.dispose();
      displacementMap.dispose();
    };
  }, [map, displacementMap]);

  const radiusUnits = (planet.radius / EARTH_RADIUS_KM) * renderScale;

  // Only ice planets should be glossy
  const isIcyPlanet =
    planet.type === "ice_giant" || planet.type === "ice_world";

  // Determine glow color based on atmosphere or planet type
  const glowColor = planet.atmosphere.present
    ? planet.atmosphere.color
    : planet.appearance.baseColor || "#4a9eff";

  // Gas giants and planets with atmospheres get stronger glow
  const hasStrongGlow =
    planet.type === "gas_giant" ||
    planet.type === "ice_giant" ||
    planet.atmosphere.present;

  // Earth-like and ocean world planets get slightly stronger glow for better visibility
  const isEarthLike = planet.type === "earth_like";
  const isOceanWorld = planet.type === "ocean_world";
  const isWaterPlanet = isEarthLike || isOceanWorld;
  const glowIntensity = hasStrongGlow ? (isWaterPlanet ? 0.95 : 1.0) : 0.6;

  // Memoize all geometries
  const mainGeometry = useMemo(
    () => new THREE.SphereGeometry(radiusUnits, 128, 128),
    [radiusUnits]
  );
  const atmosphereGeometry = useMemo(
    () => new THREE.SphereGeometry(radiusUnits * 1.06, 64, 64),
    [radiusUnits]
  );
  const innerGlowGeometry = useMemo(
    () => new THREE.SphereGeometry(radiusUnits * 1.08, 32, 32),
    [radiusUnits]
  );
  const outerGlowGeometry = useMemo(
    () => new THREE.SphereGeometry(radiusUnits * 1.15, 32, 32),
    [radiusUnits]
  );
  const extendedGlowGeometry = useMemo(
    () => new THREE.SphereGeometry(radiusUnits * 1.25, 32, 32),
    [radiusUnits]
  );
  const rotationMarkerGeometry = useMemo(
    () => new THREE.SphereGeometry(radiusUnits * 0.05, 16, 16),
    [radiusUnits]
  );

  // Dispose all geometries on cleanup
  useEffect(() => {
    return () => {
      mainGeometry.dispose();
      atmosphereGeometry.dispose();
      innerGlowGeometry.dispose();
      outerGlowGeometry.dispose();
      extendedGlowGeometry.dispose();
      rotationMarkerGeometry.dispose();
    };
  }, [
    mainGeometry,
    atmosphereGeometry,
    innerGlowGeometry,
    outerGlowGeometry,
    extendedGlowGeometry,
    rotationMarkerGeometry,
  ]);

  return (
    <group>
      {/* Main planet sphere */}
      <mesh
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "auto";
        }}
      >
        <primitive object={mainGeometry} />
        <meshPhongMaterial
          map={map}
          displacementMap={displacementMap}
          displacementScale={0.015}
          shininess={isIcyPlanet ? 100 : 10}
          specular={new THREE.Color(isIcyPlanet ? "#ffffff" : "#000000")}
          reflectivity={isIcyPlanet ? 0.95 : 0}
          emissive={
            planet.type === "earth_like" || planet.type === "ocean_world"
              ? new THREE.Color("#0d2538")
              : new THREE.Color(planet.appearance.baseColor || "#333333")
          }
          emissiveIntensity={
            planet.type === "earth_like" || planet.type === "ocean_world"
              ? 0.25
              : 0.1
          }
        />
      </mesh>

      {/* Atmosphere - non-interactive */}
      {planet.atmosphere.present && (
        <mesh raycast={() => null}>
          <primitive object={atmosphereGeometry} />
          <meshBasicMaterial
            color={planet.atmosphere.color}
            transparent
            opacity={planet.atmosphere.opacity}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Inner glow - subtle atmospheric rim - non-interactive */}
      <mesh raycast={() => null}>
        <primitive object={innerGlowGeometry} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.25 * glowIntensity}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer glow - soft halo - non-interactive */}
      <mesh raycast={() => null}>
        <primitive object={outerGlowGeometry} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.15 * glowIntensity}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Extended glow for gas giants - non-interactive */}
      {hasStrongGlow && (
        <mesh raycast={() => null}>
          <primitive object={extendedGlowGeometry} />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={0.08}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Rotation marker - a small dot to make rotation visible */}
      <mesh position={[radiusUnits * 0.95, 0, 0]} raycast={() => null}>
        <primitive object={rotationMarkerGeometry} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </group>
  );
};
