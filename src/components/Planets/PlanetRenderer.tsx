import React, { useMemo } from "react";
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

  return (
    <group
      rotation={new THREE.Euler(0, 0, 0)}
      // apply spin axis by using quaternion in onUpdate to preserve axis
      onUpdate={(obj) => {
        const g = obj as THREE.Group;
        const axis = new THREE.Vector3(
          planet.spinAxis[0],
          planet.spinAxis[1],
          planet.spinAxis[2]
        ).normalize();
        // store axis on userData for external animation (set by parent)
        (g.userData as any).spinAxis = axis;
        (g.userData as any).spinSpeed = planet.spinSpeed * planet.spinDirection;
      }}
    >
      <mesh>
        <sphereGeometry args={[radiusUnits, 128, 128]} />
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
          <sphereGeometry args={[radiusUnits * 1.06, 64, 64]} />
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
