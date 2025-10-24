import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { PlanetData, CityData } from "../../types/planet.types";

interface RoadNetworkProps {
  planet: PlanetData;
  renderScale?: number;
  sunPosition: THREE.Vector3;
}

const EARTH_RADIUS_KM = 6371;
const MAX_ROAD_DISTANCE = 30; // degrees - max distance to connect cities

/**
 * Renders glowing road networks connecting nearby cities
 */
export const RoadNetwork: React.FC<RoadNetworkProps> = ({
  planet,
  renderScale = 0.16,
  sunPosition,
}) => {
  const cities = planet.surface?.cities || [];
  if (cities.length < 2) return null; // Need at least 2 cities for roads

  const radiusUnits = (planet.radius / EARTH_RADIUS_KM) * renderScale;

  // Calculate which cities should be connected
  const connections = useMemo(() => {
    const roads: Array<[CityData, CityData]> = [];
    
    // Helper to calculate approximate distance between two lat/lng points
    const distance = (c1: CityData, c2: CityData): number => {
      const dLat = c2.lat - c1.lat;
      const dLng = c2.lng - c1.lng;
      return Math.sqrt(dLat * dLat + dLng * dLng);
    };

    // Sort cities by size (larger cities are major hubs)
    const sortedCities = [...cities].sort((a, b) => b.size - a.size);

    // Connect each city to its nearest neighbors
    sortedCities.forEach((city, idx) => {
      // Larger cities get more connections
      const maxConnections = city.type === "metropolis" ? 5 : 
                            city.type === "city" ? 3 : 2;
      
      // Find nearest cities
      const distances = sortedCities
        .map((other, otherIdx) => ({
          city: other,
          distance: distance(city, other),
          idx: otherIdx,
        }))
        .filter(d => d.idx !== idx && d.distance < MAX_ROAD_DISTANCE)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxConnections);

      // Add connections (avoid duplicates)
      distances.forEach(({ city: other }) => {
        const exists = roads.some(
          ([a, b]) =>
            (a.id === city.id && b.id === other.id) ||
            (a.id === other.id && b.id === city.id)
        );
        if (!exists) {
          roads.push([city, other]);
        }
      });
    });

    return roads;
  }, [cities]);

  // Convert lat/lng to 3D position on sphere
  const latLngToPosition = (lat: number, lng: number): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    // Slightly above surface to account for displacement
    const r = radiusUnits * 1.002;
    
    const x = -r * Math.sin(phi) * Math.cos(theta);
    const z = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  };

  // Create road geometries
  const roadLines = useMemo(() => {
    return connections.map(([city1, city2], idx) => {
      const pos1 = latLngToPosition(city1.lat, city1.lng);
      const pos2 = latLngToPosition(city2.lat, city2.lng);

      // Create a curved path along the sphere surface
      const points: THREE.Vector3[] = [];
      const segments = 20; // Smooth curve
      
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        // Spherical interpolation (SLERP)
        const pos = new THREE.Vector3().lerpVectors(pos1, pos2, t);
        // Project back onto sphere surface
        pos.normalize().multiplyScalar(radiusUnits * 1.002);
        points.push(pos);
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      
      return { geometry, key: `road-${idx}` };
    });
  }, [connections, radiusUnits]);

  // Cleanup geometries
  useEffect(() => {
    return () => {
      roadLines.forEach(({ geometry }) => geometry.dispose());
    };
  }, [roadLines]);

  return (
    <group>
      {roadLines.map(({ geometry, key }) => (
        <line key={key} geometry={geometry} raycast={() => null}>
          <lineBasicMaterial
            color="#ffaa44"
            transparent
            opacity={0.3}
            linewidth={2}
            blending={THREE.AdditiveBlending}
          />
        </line>
      ))}
    </group>
  );
};

