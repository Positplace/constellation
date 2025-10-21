import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CometData } from "../../types/comet.types";
import { updateCometTail } from "../../utils/cometFactory";
import CometMesh from "./CometMesh";
import CometTail from "./CometTail";
import { CompanionStarData } from "../../types/game.types";

interface CometProps {
  comet: CometData;
  timeScale: number;
  selectedId?: string;
  showOrbit?: boolean;
  companionStar?: CompanionStarData; // For binary star systems
  onSelect?: (id: string, position: THREE.Vector3) => void;
  onSelectedFrame?: (id: string, position: THREE.Vector3) => void;
}

/**
 * Main Comet component that handles orbital mechanics and rendering
 */
const Comet: React.FC<CometProps> = ({
  comet,
  timeScale,
  selectedId,
  showOrbit = false,
  companionStar,
  onSelect,
  onSelectedFrame,
}) => {
  const positionRef = useRef(new THREE.Vector3(...comet.position));
  const angleRef = useRef(comet.orbital.angle);
  const cometDataRef = useRef({ ...comet });
  const companionAngleRef = useRef(companionStar?.orbitalAngle || 0);
  const secondaryTailIntensityRef = useRef(0);

  const isSelected = selectedId === comet.id;

  // Update comet position based on elliptical orbit
  useFrame((_, delta) => {
    const scaledDelta = delta * timeScale;

    // Update orbital angle
    // For elliptical orbits, angular velocity varies with distance
    // v = h/r where h is angular momentum (constant)
    // Approximate: speed is higher near perihelion, lower near aphelion
    const currentR = positionRef.current.length();
    const angularSpeed = comet.orbital.speed / currentR;
    angleRef.current += angularSpeed * scaledDelta;

    // Keep angle in 0-2π range
    if (angleRef.current > Math.PI * 2) {
      angleRef.current -= Math.PI * 2;
    }

    // Calculate position using ellipse equation
    // r = a(1-e²)/(1+e*cos(θ))
    const { semiMajorAxis, eccentricity, inclination } = comet.orbital;
    const r =
      (semiMajorAxis * (1 - eccentricity * eccentricity)) /
      (1 + eccentricity * Math.cos(angleRef.current));

    // Calculate 3D position with inclination
    const x = r * Math.cos(angleRef.current);
    const y = r * Math.sin(inclination) * Math.sin(angleRef.current);
    const z = r * Math.cos(inclination) * Math.sin(angleRef.current);

    positionRef.current.set(x, y, z);

    // Update companion star angle if in binary system
    if (companionStar) {
      companionAngleRef.current +=
        delta * companionStar.orbitalSpeed * timeScale;

      // Calculate distance from companion star
      const companionPos = new THREE.Vector3(
        Math.cos(companionAngleRef.current) * companionStar.orbitalDistance,
        0,
        Math.sin(companionAngleRef.current) * companionStar.orbitalDistance
      );
      const distanceFromCompanion =
        positionRef.current.distanceTo(companionPos);

      // Calculate secondary tail intensity based on distance from companion
      // Tail becomes visible within ~3.5 AU, peaks when close
      if (distanceFromCompanion > 3.5) {
        secondaryTailIntensityRef.current = 0;
      } else {
        const maxTailDistance = 3.5;
        const intensity =
          1 - Math.min(1, distanceFromCompanion / maxTailDistance);
        // Apply power curve for more dramatic effect near star
        secondaryTailIntensityRef.current = Math.pow(intensity, 0.7);
      }
    }

    // Update tail intensity based on distance from primary star
    const distanceFromStar = positionRef.current.length();
    cometDataRef.current.tail = updateCometTail(comet, distanceFromStar);

    // If selected, notify parent component of position update
    if (isSelected && onSelectedFrame) {
      onSelectedFrame(comet.id, positionRef.current.clone());
    }
  });

  const handleClick = () => {
    if (onSelect) {
      onSelect(comet.id, positionRef.current.clone());
    }
  };

  // Calculate companion star position if in binary system
  const companionStarPosition = companionStar
    ? new THREE.Vector3(
        Math.cos(companionAngleRef.current) * companionStar.orbitalDistance,
        0,
        Math.sin(companionAngleRef.current) * companionStar.orbitalDistance
      )
    : null;

  return (
    <group>
      {/* Render comet nucleus (core) */}
      <CometMesh
        comet={cometDataRef.current}
        position={positionRef.current}
        onClick={handleClick}
        selected={isSelected}
      />

      {/* Render primary tail (away from primary star) */}
      <CometTail
        comet={cometDataRef.current}
        position={positionRef.current}
        starPosition={new THREE.Vector3(0, 0, 0)}
      />

      {/* Render secondary tail (away from companion star) in binary systems */}
      {companionStar &&
        companionStarPosition &&
        secondaryTailIntensityRef.current > 0.05 && (
          <CometTail
            comet={cometDataRef.current}
            position={positionRef.current}
            starPosition={companionStarPosition}
            isSecondaryTail={true}
            secondaryIntensity={secondaryTailIntensityRef.current}
          />
        )}

      {/* Orbital path visualization when selected or when showing all orbits */}
      {(isSelected || showOrbit) && (
        <OrbitPath
          semiMajorAxis={comet.orbital.semiMajorAxis}
          eccentricity={comet.orbital.eccentricity}
          inclination={comet.orbital.inclination}
          isSelected={isSelected}
        />
      )}
    </group>
  );
};

/**
 * Component to visualize the elliptical orbit of a comet
 */
interface OrbitPathProps {
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  isSelected?: boolean;
}

const OrbitPath: React.FC<OrbitPathProps> = ({
  semiMajorAxis,
  eccentricity,
  inclination,
  isSelected = false,
}) => {
  const orbitRef = useRef<THREE.Line>(null);

  useEffect(() => {
    if (!orbitRef.current) return;

    // Generate elliptical orbit points
    const points: THREE.Vector3[] = [];
    const segments = 128;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;

      // Calculate radius at this angle
      const r =
        (semiMajorAxis * (1 - eccentricity * eccentricity)) /
        (1 + eccentricity * Math.cos(angle));

      // Calculate 3D position
      const x = r * Math.cos(angle);
      const y = r * Math.sin(inclination) * Math.sin(angle);
      const z = r * Math.cos(inclination) * Math.sin(angle);

      points.push(new THREE.Vector3(x, y, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    orbitRef.current.geometry.dispose();
    orbitRef.current.geometry = geometry;
  }, [semiMajorAxis, eccentricity, inclination]);

  // Use magenta/purple for comet orbits to distinguish from planet orbits (cyan)
  // Brighter when selected
  const orbitColor = isSelected ? "#ff00ff" : "#ff00ff";
  const orbitOpacity = isSelected ? 0.6 : 0.25;

  // Calculate perihelion position (closest to star, at angle = 0)
  const perihelionDistance =
    (semiMajorAxis * (1 - eccentricity * eccentricity)) / (1 + eccentricity);
  const perihelionPos = new THREE.Vector3(perihelionDistance, 0, 0);

  // Calculate aphelion position (farthest from star, at angle = π)
  const aphelionDistance =
    (semiMajorAxis * (1 - eccentricity * eccentricity)) / (1 - eccentricity);
  const aphelionPos = new THREE.Vector3(
    -aphelionDistance * Math.cos(inclination),
    -aphelionDistance * Math.sin(inclination),
    0
  );

  return (
    <group>
      {/* Orbit path */}
      <line ref={orbitRef}>
        <bufferGeometry />
        <lineBasicMaterial
          color={orbitColor}
          transparent
          opacity={orbitOpacity}
          linewidth={1}
        />
      </line>

      {/* Perihelion marker (closest point - orange/hot) */}
      {isSelected && (
        <mesh position={perihelionPos}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#ff6600" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Aphelion marker (farthest point - blue/cold) */}
      {isSelected && (
        <mesh position={aphelionPos}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#0066ff" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
};

export default Comet;
