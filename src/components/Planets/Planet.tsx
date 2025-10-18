import * as THREE from "three";
import { PlanetData } from "../../types/planet.types";
import { PlanetOrbit } from "./PlanetOrbit";
import { PlanetRotation } from "./PlanetRotation";
import { PlanetMesh } from "./PlanetMesh";

interface PlanetProps {
  planet: PlanetData;
  distance: number;
  speed: number;
  angle: number;
  timeScale: number;
  renderScale?: number;
  showOrbit?: boolean;
  selectedId?: string;
  onSelect?: (planetId: string, worldPos: THREE.Vector3) => void;
  onSelectedFrame?: (planetId: string, worldPos: THREE.Vector3) => void;
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
  onSelect,
  onSelectedFrame,
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

  return (
    <PlanetOrbit
      distance={distance}
      speed={speed}
      angle={angle}
      timeScale={timeScale}
      showOrbit={showOrbit && !isSelected}
      onPositionUpdate={handlePositionUpdate}
    >
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
    </PlanetOrbit>
  );
};

export default Planet;
