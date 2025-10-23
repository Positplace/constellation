import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { PlanetData } from "../../types/planet.types";
import { generateSurfaceTextures } from "../../utils/textureGenerators";

interface PlanetRendererProps {
  planet: PlanetData;
  renderScale?: number; // visual scale multiplier
}

const EARTH_RADIUS_KM = 6371;

const PlanetRenderer: React.FC<PlanetRendererProps> = ({
  planet,
  renderScale = 0.16,
}) => {
  // Memoize textures by stable planet id to avoid regeneration on re-renders
  const { map, displacementMap } = useMemo(
    () => generateSurfaceTextures(planet),
    [planet.id]
  );

  const radiusUnits = (planet.radius / EARTH_RADIUS_KM) * renderScale;

  // Memoize geometries
  const planetGeometry = useMemo(
    () => new THREE.SphereGeometry(radiusUnits, 128, 128),
    [radiusUnits]
  );
  const atmosphereGeometry = useMemo(
    () => new THREE.SphereGeometry(radiusUnits * 1.06, 64, 64),
    [radiusUnits]
  );

  // Dispose textures and geometries on cleanup
  useEffect(() => {
    return () => {
      map.dispose();
      displacementMap.dispose();
      planetGeometry.dispose();
      atmosphereGeometry.dispose();
    };
  }, [map, displacementMap, planetGeometry, atmosphereGeometry]);

  return (
    <group rotation={new THREE.Euler(0, 0, 0)}>
      <mesh>
        <primitive object={planetGeometry} />
        <meshPhongMaterial
          map={map}
          displacementMap={displacementMap}
          displacementScale={0.015}
          shininess={10}
          specular={new THREE.Color("#000000")}
        />
      </mesh>

      {/* Atmosphere shells */}
      {planet.atmosphere.present && (
        <mesh>
          <primitive object={atmosphereGeometry} />
          <meshBasicMaterial
            color={planet.atmosphere.color}
            transparent
            opacity={planet.atmosphere.opacity}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
};

export default PlanetRenderer;
