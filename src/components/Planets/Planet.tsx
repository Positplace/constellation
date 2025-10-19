import * as THREE from "three";
import { PlanetData } from "../../types/planet.types";
import { PlanetOrbit } from "./PlanetOrbit";
import { PlanetRotation } from "./PlanetRotation";
import { PlanetMesh } from "./PlanetMesh";
import { MoonOrbit } from "./MoonOrbit";
import { MoonMesh } from "./MoonMesh";
import { PlanetRings } from "./PlanetRings";
import { migrateRingData } from "../../utils/moonFactory";

interface PlanetProps {
  planet: PlanetData;
  distance: number;
  speed: number;
  angle: number;
  timeScale: number;
  renderScale?: number;
  showOrbit?: boolean;
  selectedId?: string;
  selectedMoonId?: string;
  onSelect?: (planetId: string, worldPos: THREE.Vector3) => void;
  onSelectedFrame?: (planetId: string, worldPos: THREE.Vector3) => void;
  onMoonSelect?: (moonId: string, worldPos: THREE.Vector3) => void;
  onMoonSelectedFrame?: (moonId: string, worldPos: THREE.Vector3) => void;
}

/**
 * Complete planet component that combines orbital movement and self-rotation.
 * Architecture:
 * - PlanetOrbit: Handles movement around the sun
 *   - PlanetRotation: Handles self-rotation
 *     - PlanetMesh: The actual visual representation
 */
export const Planet: React.FC<PlanetProps> = ({
  planet,
  distance,
  speed,
  angle,
  timeScale,
  renderScale = 0.16,
  showOrbit = true,
  selectedId,
  selectedMoonId,
  onSelect,
  onSelectedFrame,
  onMoonSelect,
  onMoonSelectedFrame,
}) => {
  const isSelected = selectedId === planet.id;

  const handlePositionUpdate = (worldPos: THREE.Vector3) => {
    // If this planet is selected, notify parent of position changes
    if (isSelected && onSelectedFrame) {
      onSelectedFrame(planet.id, worldPos);
    }
  };

  const handleClick = () => {
    if (onSelect) {
      // Get current world position - we'll calculate it in the parent
      const pos = new THREE.Vector3(
        Math.cos(angle) * distance,
        0,
        Math.sin(angle) * distance
      );
      onSelect(planet.id, pos);
    }
  };

  const handleMoonClick = (moonId: string, moonPos: THREE.Vector3) => {
    if (onMoonSelect) {
      onMoonSelect(moonId, moonPos);
    }
  };

  const handleMoonPositionUpdate = (
    moonId: string,
    worldPos: THREE.Vector3
  ) => {
    if (selectedMoonId === moonId && onMoonSelectedFrame) {
      onMoonSelectedFrame(moonId, worldPos);
    }
  };

  return (
    <PlanetOrbit
      distance={distance}
      speed={speed}
      angle={angle}
      timeScale={timeScale}
      showOrbit={showOrbit && !isSelected}
      onPositionUpdate={handlePositionUpdate}
    >
      {/* Planet rings (rendered before planet mesh) */}
      {planet.rings && (
        <PlanetRings
          ringData={planet.rings}
          planetAxialTilt={planet.axialTilt}
          timeScale={timeScale}
        />
      )}

      <PlanetRotation
        spinAxis={planet.spinAxis}
        spinSpeed={planet.spinSpeed}
        spinDirection={planet.spinDirection}
        timeScale={timeScale}
      >
        <PlanetMesh
          planet={planet}
          renderScale={renderScale}
          onClick={handleClick}
        />
      </PlanetRotation>

      {/* Moons orbiting the planet */}
      {planet.moons?.map((moon) => (
        <MoonOrbit
          key={moon.id}
          distance={moon.orbitalDistance}
          speed={moon.orbitalSpeed}
          angle={moon.orbitalAngle}
          timeScale={timeScale}
          showOrbit={selectedMoonId === moon.id} // Show orbit for selected moon
          inclination={moon.orbitalInclination}
          onPositionUpdate={(worldPos) =>
            handleMoonPositionUpdate(moon.id, worldPos)
          }
        >
          <MoonMesh
            moon={moon}
            renderScale={renderScale}
            isSelected={selectedMoonId === moon.id}
            onClick={(moonPos) => handleMoonClick(moon.id, moonPos)}
          />
        </MoonOrbit>
      ))}
    </PlanetOrbit>
  );
};

export default Planet;
