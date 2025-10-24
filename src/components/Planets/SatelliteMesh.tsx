import React, { useMemo } from "react";
import { SatelliteData } from "../../types/planet.types";

interface SatelliteMeshProps {
  satellite: SatelliteData;
  renderScale?: number;
}

/**
 * Renders a single artificial satellite as a small glittering, glowing dot
 */
export const SatelliteMesh: React.FC<SatelliteMeshProps> = ({
  satellite,
  renderScale = 0.16,
}) => {
  // Small dot size
  const dotSize = 0.003 * renderScale;

  // Color based on type
  const color = useMemo(() => {
    switch (satellite.type) {
      case "communications":
        return "#4a9eff";
      case "observation":
        return "#ffaa44";
      case "navigation":
        return "#44ff88";
      case "weather":
        return "#88aaff";
      case "military":
        return "#ff4444";
      case "research":
        return "#aa44ff";
      default:
        return "#888888";
    }
  }, [satellite.type]);

  // Defunct satellites are dimmer
  const emissiveIntensity = satellite.active ? 0.8 : 0.2;
  const metalness = satellite.active ? 0.9 : 0.5;

  return (
    <mesh raycast={() => null}>
      <sphereGeometry args={[dotSize, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        metalness={metalness}
        roughness={0.2}
        transparent={!satellite.active}
        opacity={satellite.active ? 1.0 : 0.5}
      />
    </mesh>
  );
};
