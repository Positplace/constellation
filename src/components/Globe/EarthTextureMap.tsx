import React, { useMemo } from "react";
import * as THREE from "three";

const EarthTextureMap: React.FC = () => {
  const worldMapData = useMemo(() => {
    const latLngToVector3 = (
      lat: number,
      lng: number,
      radius: number = 1.01
    ) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);

      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);

      return new THREE.Vector3(x, y, z);
    };

    // Create a simple continent using a grid-based approach
    const createSimpleContinent = (
      latRange: [number, number],
      lngRange: [number, number],
      color: string
    ) => {
      const [minLat, maxLat] = latRange;
      const [minLng, maxLng] = lngRange;

      const positions = [];
      const indices = [];

      // Create a simple grid
      const latStep = (maxLat - minLat) / 5;
      const lngStep = (maxLng - minLng) / 5;

      for (let i = 0; i <= 5; i++) {
        for (let j = 0; j <= 5; j++) {
          const lat = minLat + i * latStep;
          const lng = minLng + j * lngStep;
          const vertex = latLngToVector3(lat, lng);
          positions.push(vertex.x, vertex.y, vertex.z);
        }
      }

      // Create triangles
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          const a = i * 6 + j;
          const b = a + 1;
          const c = (i + 1) * 6 + j;
          const d = c + 1;

          // First triangle
          indices.push(a, b, c);
          // Second triangle
          indices.push(b, d, c);
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
      );
      geometry.setIndex(indices);
      geometry.computeVertexNormals();

      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });

      return { geometry, material };
    };

    // Define continent regions with realistic lat/lng ranges
    const northAmerica = createSimpleContinent(
      [15, 70],
      [-140, -50],
      "#228B22"
    );
    const southAmerica = createSimpleContinent(
      [-55, 15],
      [-80, -35],
      "#32CD32"
    );
    const europe = createSimpleContinent([35, 70], [-10, 40], "#FFD700");
    const asia = createSimpleContinent([10, 70], [40, 180], "#8B4513");
    const africa = createSimpleContinent([-35, 35], [-20, 50], "#D2691E");
    const australia = createSimpleContinent([-45, -10], [110, 155], "#FF6347");

    return [
      { ...northAmerica, name: "North America" },
      { ...southAmerica, name: "South America" },
      { ...europe, name: "Europe" },
      { ...asia, name: "Asia" },
      { ...africa, name: "Africa" },
      { ...australia, name: "Australia" },
    ];
  }, []);

  return (
    <group>
      {worldMapData.map((continent) => (
        <mesh
          key={continent.name}
          geometry={continent.geometry}
          material={continent.material}
        />
      ))}
    </group>
  );
};

export default EarthTextureMap;
