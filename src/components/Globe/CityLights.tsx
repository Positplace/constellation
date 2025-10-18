import React, { useMemo } from "react";
import * as THREE from "three";
import { useGameStore } from "../../store/gameStore";

const CityLights: React.FC = () => {
  const { gameTime } = useGameStore();
  const cityLights = useMemo(() => {
    const latLngToVector3 = (
      lat: number,
      lng: number,
      radius: number = 1.02
    ) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);

      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);

      return new THREE.Vector3(x, y, z);
    };

    // Major cities positioned to match our continent shapes exactly
    const cities = [
      // North America - positioned on our green continent shape
      { lat: 45, lng: -75, name: "New York", size: 0.03 },
      { lat: 35, lng: -120, name: "Los Angeles", size: 0.025 },
      { lat: 42, lng: -88, name: "Chicago", size: 0.025 },
      { lat: 30, lng: -95, name: "Houston", size: 0.02 },
      { lat: 26, lng: -80, name: "Miami", size: 0.02 },
      { lat: 50, lng: -125, name: "Vancouver", size: 0.02 },
      { lat: 44, lng: -79, name: "Toronto", size: 0.025 },
      { lat: 46, lng: -74, name: "Montreal", size: 0.02 },
      { lat: 20, lng: -100, name: "Mexico City", size: 0.03 },

      // South America - positioned on our green continent shape
      { lat: -25, lng: -47, name: "São Paulo", size: 0.03 },
      { lat: -23, lng: -43, name: "Rio de Janeiro", size: 0.025 },
      { lat: -35, lng: -58, name: "Buenos Aires", size: 0.025 },
      { lat: -12, lng: -77, name: "Lima", size: 0.02 },
      { lat: -33, lng: -71, name: "Santiago", size: 0.02 },
      { lat: 5, lng: -74, name: "Bogotá", size: 0.02 },

      // Europe - positioned on our green continent shape
      { lat: 52, lng: 0, name: "London", size: 0.03 },
      { lat: 49, lng: 2, name: "Paris", size: 0.03 },
      { lat: 53, lng: 13, name: "Berlin", size: 0.025 },
      { lat: 56, lng: 38, name: "Moscow", size: 0.03 },
      { lat: 42, lng: 12, name: "Rome", size: 0.025 },
      { lat: 40, lng: -4, name: "Madrid", size: 0.025 },
      { lat: 52, lng: 5, name: "Amsterdam", size: 0.02 },
      { lat: 56, lng: 13, name: "Copenhagen", size: 0.02 },
      { lat: 60, lng: 11, name: "Oslo", size: 0.02 },
      { lat: 60, lng: 25, name: "Helsinki", size: 0.02 },
      { lat: 53, lng: -6, name: "Dublin", size: 0.02 },

      // Asia - positioned on our green continent shape
      { lat: 36, lng: 140, name: "Tokyo", size: 0.04 },
      { lat: 22, lng: 114, name: "Hong Kong", size: 0.03 },
      { lat: 1, lng: 104, name: "Singapore", size: 0.025 },
      { lat: 38, lng: 127, name: "Seoul", size: 0.03 },
      { lat: 40, lng: 116, name: "Beijing", size: 0.03 },
      { lat: 31, lng: 121, name: "Shanghai", size: 0.03 },
      { lat: 19, lng: 73, name: "Mumbai", size: 0.03 },
      { lat: 29, lng: 77, name: "Delhi", size: 0.03 },
      { lat: 13, lng: 78, name: "Bangalore", size: 0.025 },
      { lat: 13, lng: 80, name: "Chennai", size: 0.02 },
      { lat: 23, lng: 88, name: "Kolkata", size: 0.025 },
      { lat: 25, lng: 55, name: "Dubai", size: 0.025 },
      { lat: 25, lng: 47, name: "Riyadh", size: 0.02 },
      { lat: 32, lng: 35, name: "Jerusalem", size: 0.02 },
      { lat: 34, lng: 73, name: "Islamabad", size: 0.02 },
      { lat: 25, lng: 67, name: "Karachi", size: 0.025 },

      // Africa - positioned on our green continent shape
      { lat: -26, lng: 28, name: "Johannesburg", size: 0.025 },
      { lat: -34, lng: 18, name: "Cape Town", size: 0.02 },
      { lat: 30, lng: 31, name: "Cairo", size: 0.03 },
      { lat: 7, lng: 3, name: "Lagos", size: 0.025 },
      { lat: -1, lng: 37, name: "Nairobi", size: 0.02 },
      { lat: 15, lng: -17, name: "Dakar", size: 0.02 },
      { lat: 10, lng: -14, name: "Conakry", size: 0.02 },
      { lat: 6, lng: 1, name: "Lomé", size: 0.02 },

      // Australia - positioned on our green continent shape
      { lat: -34, lng: 151, name: "Sydney", size: 0.025 },
      { lat: -38, lng: 145, name: "Melbourne", size: 0.025 },
      { lat: -28, lng: 153, name: "Brisbane", size: 0.02 },
      { lat: -32, lng: 116, name: "Perth", size: 0.02 },
      { lat: -35, lng: 139, name: "Adelaide", size: 0.02 },
      { lat: -37, lng: 175, name: "Auckland", size: 0.02 },
      { lat: -41, lng: 175, name: "Wellington", size: 0.02 },
    ];

    return cities
      .map((city, index) => {
        const position = latLngToVector3(city.lat, city.lng);

        // Calculate sun position based on game time
        // One day cycle every 60 seconds of game time
        const dayCycle = 60; // seconds
        const sunAngle = ((gameTime % dayCycle) / dayCycle) * 2 * Math.PI;

        // Sun direction (opposite of sun position)
        const sunDirection = new THREE.Vector3(
          -Math.cos(sunAngle),
          0,
          -Math.sin(sunAngle)
        ).normalize();

        // Check if city is on the dark side
        const dotProduct = position.normalize().dot(sunDirection);
        const isOnDarkSide = dotProduct < 0;

        // Only render city lights on the dark side
        if (isOnDarkSide) {
          return (
            <mesh key={index} position={position}>
              <sphereGeometry args={[city.size, 8, 8]} />
              <meshBasicMaterial color="#ffff88" transparent opacity={0.8} />
            </mesh>
          );
        }
        return null;
      })
      .filter(Boolean);
  }, [gameTime]);

  return <group>{cityLights}</group>;
};

export default CityLights;
