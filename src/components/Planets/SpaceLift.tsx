import { useMemo, useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PlanetData } from "../../types/planet.types";
import { useGameStore } from "../../store/gameStore";

interface SpaceLiftProps {
  planet: PlanetData;
  renderScale?: number;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Renders a space lift (space elevator) on the home world.
 * A tall structure extending from the surface into geostationary orbit.
 */
export const SpaceLift: React.FC<SpaceLiftProps> = ({
  planet,
  renderScale = 0.16,
}) => {
  const cableRef = useRef<THREE.Line>(null);
  const elevatorCarRef = useRef<THREE.Mesh>(null);
  const baseRef = useRef<THREE.Mesh>(null);
  const topRef = useRef<THREE.Mesh>(null);
  const torus1Ref = useRef<THREE.Mesh>(null);
  const torus2Ref = useRef<THREE.Mesh>(null);
  const animationTimeRef = useRef(0);

  // Only render on planets with space elevators (home worlds)
  if (!planet.hasSpaceElevator) {
    return null;
  }

  // Find the capital city to place the space lift
  const cities = planet.surface?.cities || [];
  if (cities.length === 0) {
    return null;
  }

  const capital = useMemo(() => {
    // First, try to find a city marked as capital
    const capitalCity = cities.find((city) => city.isCapital);
    if (capitalCity) {
      return capitalCity;
    }
    // Otherwise, fall back to the largest city
    return cities.reduce(
      (largest, city) => (city.size > largest.size ? city : largest),
      cities[0]
    );
  }, [cities]);

  const radiusUnits = (planet.radius / EARTH_RADIUS_KM) * renderScale;

  // Convert lat/lng to 3D position on sphere
  const getPositionOnSphere = (
    lat: number,
    lng: number,
    altitude: number = 0
  ): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const r = radiusUnits + altitude;

    const x = -r * Math.sin(phi) * Math.cos(theta);
    const z = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  };

  // Get surface position and direction
  const surfacePos = getPositionOnSphere(capital.lat, capital.lng, 0.003);
  const direction = surfacePos.clone().normalize();

  // Small space lift - just a subtle structure
  const liftHeight = radiusUnits * 0.8; // Much shorter
  const groundAltitude = 0.006; // Height where ground station sits (just above surface)

  // Create the cable geometry
  const cableGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 12;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const altitude = groundAltitude + t * (liftHeight - groundAltitude);
      const pos = direction.clone().multiplyScalar(radiusUnits + altitude);
      points.push(pos);
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radiusUnits, liftHeight, direction]);

  // Ground station position (on the surface)
  const groundStationPos = direction
    .clone()
    .multiplyScalar(radiusUnits + groundAltitude);

  // Top station position
  const topStationPos = direction
    .clone()
    .multiplyScalar(radiusUnits + liftHeight);

  // Create elevator cabin geometry - tiny to show scale
  const cabinGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.001, 0.001, 0.002, 6),
    []
  );

  // Create rotating torus geometries for the space station - small and cute
  const torusGeometry = useMemo(
    () => new THREE.TorusGeometry(0.008, 0.001, 8, 12),
    []
  );

  // Align base, top, and tori with the cable direction
  useEffect(() => {
    if (baseRef.current) {
      baseRef.current.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction
      );
    }
    if (topRef.current) {
      topRef.current.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction
      );
    }
    // Align tori with the station
    if (torus1Ref.current) {
      torus1Ref.current.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction
      );
    }
    if (torus2Ref.current) {
      torus2Ref.current.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction
      );
      // Start with 90-degree offset for perpendicular orientation
      torus2Ref.current.rotateY(Math.PI / 2);
    }
  }, [direction]);

  // Cleanup
  useEffect(() => {
    return () => {
      cableGeometry.dispose();
      cabinGeometry.dispose();
      torusGeometry.dispose();
    };
  }, [cableGeometry, cabinGeometry, torusGeometry]);

  // Get timeScale from game store
  const timeScale = useGameStore((state) => state.timeScale);

  // Animate elevator cabin moving up and down, and rotate tori (only when time is moving)
  useFrame((state, delta) => {
    // Only animate when game time is moving
    const scaledDelta = delta * timeScale;

    animationTimeRef.current += scaledDelta * 0.5;

    if (elevatorCarRef.current) {
      // Oscillate between 0 and 1
      const t = (Math.sin(animationTimeRef.current) + 1) / 2;
      // Move between ground station and top station
      const minAltitude = groundAltitude; // Start at ground station
      const maxAltitude = liftHeight * 0.95; // Just below top
      const altitude = minAltitude + t * (maxAltitude - minAltitude);
      const pos = direction.clone().multiplyScalar(radiusUnits + altitude);
      elevatorCarRef.current.position.copy(pos);

      // Align cabin with the cable direction
      elevatorCarRef.current.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction
      );
    }

    // Rotate the tori around the space station
    if (torus1Ref.current) {
      torus1Ref.current.rotation.x += scaledDelta * 0.5; // Rotate around X axis
    }
    if (torus2Ref.current) {
      torus2Ref.current.rotation.y += scaledDelta * 0.3; // Rotate around Y axis (different speed)
    }
  });

  return (
    <group>
      {/* Main cable */}
      <line geometry={cableGeometry} raycast={() => null} ref={cableRef}>
        <lineBasicMaterial
          color="#88ccff"
          transparent
          opacity={0.4}
          linewidth={3}
        />
      </line>

      {/* Base - cylinder */}
      <mesh position={groundStationPos} ref={baseRef} raycast={() => null}>
        <cylinderGeometry args={[0.003, 0.004, 0.006, 8]} />
        <meshStandardMaterial
          color="#aaddff"
          emissive="#88ccff"
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Top - square platform */}
      <mesh position={topStationPos} ref={topRef} raycast={() => null}>
        <boxGeometry args={[0.006, 0.003, 0.006]} />
        <meshStandardMaterial
          color="#aaddff"
          emissive="#88ccff"
          emissiveIntensity={0.25}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Rotating torus 1 - horizontal ring */}
      <mesh position={topStationPos} ref={torus1Ref} raycast={() => null}>
        <primitive object={torusGeometry} />
        <meshStandardMaterial
          color="#88ccff"
          emissive="#66aadd"
          emissiveIntensity={0.4}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Rotating torus 2 - perpendicular ring */}
      <mesh position={topStationPos} ref={torus2Ref} raycast={() => null}>
        <primitive object={torusGeometry} />
        <meshStandardMaterial
          color="#88ccff"
          emissive="#66aadd"
          emissiveIntensity={0.4}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Animated cabin - cylinder moving up and down */}
      <mesh ref={elevatorCarRef} raycast={() => null}>
        <primitive object={cabinGeometry} />
        <meshStandardMaterial
          color="#dddddd"
          emissive="#ffaa44"
          emissiveIntensity={0.5}
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
};
