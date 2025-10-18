import React, { useMemo } from "react";
import * as THREE from "three";

const ContinentOutlines: React.FC = () => {
  // Simple continent outline data (simplified shapes)
  const continentData = useMemo(() => {
    const createContinentOutline = (
      points: [number, number][],
      color: string
    ) => {
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

      const vertices = points.map(([lat, lng]) => latLngToVector3(lat, lng));
      vertices.push(vertices[0]); // Close the loop

      const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
      const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        linewidth: 3,
      });

      return { geometry, material };
    };

    // Simplified continent outlines (very basic shapes)
    const northAmerica = createContinentOutline(
      [
        [70, -140],
        [70, -60],
        [25, -60],
        [25, -100],
        [50, -140],
        [70, -140],
      ],
      "#4a90e2"
    );

    const southAmerica = createContinentOutline(
      [
        [10, -80],
        [10, -35],
        [-55, -35],
        [-55, -70],
        [10, -80],
      ],
      "#7ed321"
    );

    const europe = createContinentOutline(
      [
        [70, -10],
        [70, 40],
        [35, 40],
        [35, -10],
        [70, -10],
      ],
      "#f5a623"
    );

    const asia = createContinentOutline(
      [
        [70, 40],
        [70, 180],
        [10, 180],
        [10, 60],
        [70, 40],
      ],
      "#d0021b"
    );

    const africa = createContinentOutline(
      [
        [35, -20],
        [35, 50],
        [-35, 50],
        [-35, -20],
        [35, -20],
      ],
      "#9013fe"
    );

    const australia = createContinentOutline(
      [
        [-10, 110],
        [-10, 155],
        [-45, 155],
        [-45, 110],
        [-10, 110],
      ],
      "#50e3c2"
    );

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
      {continentData.map((continent, index) => (
        <line
          key={continent.name}
          geometry={continent.geometry}
          material={continent.material}
          renderOrder={1}
        />
      ))}
    </group>
  );
};

export default ContinentOutlines;
