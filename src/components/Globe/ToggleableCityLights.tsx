import React, { useMemo } from "react";
import * as THREE from "three";

interface ToggleableCityLightsProps {
  showCities: boolean;
}

const ToggleableCityLights: React.FC<ToggleableCityLightsProps> = ({
  showCities,
}) => {
  const cityLights = useMemo(() => {
    if (!showCities) return [];

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

    // Function to check if coordinates are on land based on our canvas continent shapes
    const isOnLand = (lat: number, lng: number): boolean => {
      // Convert lat/lng to canvas coordinates (matching our 2048x1024 canvas)
      const canvasX = ((lng + 180) / 360) * 2048;
      const canvasY = ((90 - lat) / 180) * 1024;

      // Define our continent regions more precisely
      // North America region
      if (
        canvasX >= 200 &&
        canvasX <= 560 &&
        canvasY >= 100 &&
        canvasY <= 480
      ) {
        return true;
      }
      // Alaska region
      if (canvasX >= 100 && canvasX <= 250 && canvasY >= 60 && canvasY <= 160) {
        return true;
      }
      // South America region
      if (
        canvasX >= 280 &&
        canvasX <= 460 &&
        canvasY >= 440 &&
        canvasY <= 820
      ) {
        return true;
      }
      // Europe region
      if (
        canvasX >= 920 &&
        canvasX <= 1160 &&
        canvasY >= 160 &&
        canvasY <= 400
      ) {
        return true;
      }
      // British Isles region
      if (
        canvasX >= 900 &&
        canvasX <= 960 &&
        canvasY >= 220 &&
        canvasY <= 300
      ) {
        return true;
      }
      // Asia region
      if (
        canvasX >= 1040 &&
        canvasX <= 1740 &&
        canvasY >= 140 &&
        canvasY <= 700
      ) {
        return true;
      }
      // India subcontinent region
      if (
        canvasX >= 1280 &&
        canvasX <= 1560 &&
        canvasY >= 380 &&
        canvasY <= 560
      ) {
        return true;
      }
      // Africa region
      if (
        canvasX >= 900 &&
        canvasX <= 1140 &&
        canvasY >= 360 &&
        canvasY <= 800
      ) {
        return true;
      }
      // Madagascar region
      if (
        canvasX >= 1180 &&
        canvasX <= 1300 &&
        canvasY >= 580 &&
        canvasY <= 740
      ) {
        return true;
      }
      // Australia region
      if (
        canvasX >= 1440 &&
        canvasX <= 1680 &&
        canvasY >= 680 &&
        canvasY <= 920
      ) {
        return true;
      }
      // New Zealand region
      if (
        canvasX >= 1800 &&
        canvasX <= 1920 &&
        canvasY >= 780 &&
        canvasY <= 1000
      ) {
        return true;
      }
      // Japan region
      if (
        canvasX >= 1680 &&
        canvasX <= 1800 &&
        canvasY >= 280 &&
        canvasY <= 400
      ) {
        return true;
      }
      // Philippines region
      if (
        canvasX >= 1580 &&
        canvasX <= 1700 &&
        canvasY >= 480 &&
        canvasY <= 600
      ) {
        return true;
      }

      return false;
    };

    // Major cities positioned to match our continent shapes exactly
    const cities = [
      // North America - positioned on our green continent shape
      { lat: 40, lng: -74, name: "New York", size: 0.03 },
      { lat: 34, lng: -118, name: "Los Angeles", size: 0.025 },
      { lat: 41, lng: -87, name: "Chicago", size: 0.025 },
      { lat: 29, lng: -95, name: "Houston", size: 0.02 },
      { lat: 25, lng: -80, name: "Miami", size: 0.02 },
      { lat: 49, lng: -123, name: "Vancouver", size: 0.02 },
      { lat: 43, lng: -79, name: "Toronto", size: 0.025 },
      { lat: 45, lng: -73, name: "Montreal", size: 0.02 },
      { lat: 19, lng: -99, name: "Mexico City", size: 0.03 },

      // South America - positioned on our green continent shape
      { lat: -23, lng: -46, name: "São Paulo", size: 0.03 },
      { lat: -22, lng: -43, name: "Rio de Janeiro", size: 0.025 },
      { lat: -34, lng: -58, name: "Buenos Aires", size: 0.025 },
      { lat: -12, lng: -77, name: "Lima", size: 0.02 },
      { lat: -33, lng: -70, name: "Santiago", size: 0.02 },
      { lat: 4, lng: -74, name: "Bogotá", size: 0.02 },

      // Europe - positioned on our green continent shape
      { lat: 51, lng: 0, name: "London", size: 0.03 },
      { lat: 48, lng: 2, name: "Paris", size: 0.03 },
      { lat: 52, lng: 13, name: "Berlin", size: 0.025 },
      { lat: 55, lng: 37, name: "Moscow", size: 0.03 },
      { lat: 41, lng: 12, name: "Rome", size: 0.025 },
      { lat: 40, lng: -3, name: "Madrid", size: 0.025 },
      { lat: 52, lng: 4, name: "Amsterdam", size: 0.02 },
      { lat: 55, lng: 12, name: "Copenhagen", size: 0.02 },
      { lat: 59, lng: 10, name: "Oslo", size: 0.02 },
      { lat: 60, lng: 24, name: "Helsinki", size: 0.02 },
      { lat: 53, lng: -6, name: "Dublin", size: 0.02 },

      // Asia - positioned on our green continent shape
      { lat: 35, lng: 139, name: "Tokyo", size: 0.04 },
      { lat: 22, lng: 114, name: "Hong Kong", size: 0.03 },
      { lat: 1, lng: 103, name: "Singapore", size: 0.025 },
      { lat: 37, lng: 126, name: "Seoul", size: 0.03 },
      { lat: 39, lng: 116, name: "Beijing", size: 0.03 },
      { lat: 31, lng: 121, name: "Shanghai", size: 0.03 },
      { lat: 19, lng: 72, name: "Mumbai", size: 0.03 },
      { lat: 28, lng: 77, name: "Delhi", size: 0.03 },
      { lat: 12, lng: 77, name: "Bangalore", size: 0.025 },
      { lat: 13, lng: 80, name: "Chennai", size: 0.02 },
      { lat: 22, lng: 88, name: "Kolkata", size: 0.025 },
      { lat: 25, lng: 55, name: "Dubai", size: 0.025 },
      { lat: 24, lng: 46, name: "Riyadh", size: 0.02 },
      { lat: 31, lng: 35, name: "Jerusalem", size: 0.02 },
      { lat: 33, lng: 73, name: "Islamabad", size: 0.02 },
      { lat: 24, lng: 67, name: "Karachi", size: 0.025 },

      // Africa - positioned on our green continent shape
      { lat: -26, lng: 28, name: "Johannesburg", size: 0.025 },
      { lat: -33, lng: 18, name: "Cape Town", size: 0.02 },
      { lat: 30, lng: 31, name: "Cairo", size: 0.03 },
      { lat: 6, lng: 3, name: "Lagos", size: 0.025 },
      { lat: -1, lng: 36, name: "Nairobi", size: 0.02 },
      { lat: 14, lng: -17, name: "Dakar", size: 0.02 },
      { lat: 9, lng: -13, name: "Conakry", size: 0.02 },
      { lat: 6, lng: 1, name: "Lomé", size: 0.02 },

      // Australia - positioned on our green continent shape
      { lat: -33, lng: 151, name: "Sydney", size: 0.025 },
      { lat: -37, lng: 144, name: "Melbourne", size: 0.025 },
      { lat: -27, lng: 153, name: "Brisbane", size: 0.02 },
      { lat: -31, lng: 115, name: "Perth", size: 0.02 },
      { lat: -34, lng: 138, name: "Adelaide", size: 0.02 },
      { lat: -36, lng: 174, name: "Auckland", size: 0.02 },
      { lat: -41, lng: 174, name: "Wellington", size: 0.02 },
    ];

    return cities
      .filter((city) => isOnLand(city.lat, city.lng)) // Only show cities on land
      .map((city, index) => {
        const position = latLngToVector3(city.lat, city.lng);

        return (
          <mesh key={index} position={position}>
            <sphereGeometry args={[city.size, 8, 8]} />
            <meshBasicMaterial color="#ffff88" transparent opacity={0.8} />
          </mesh>
        );
      });
  }, [showCities]);

  return <group>{cityLights}</group>;
};

export default ToggleableCityLights;
