import React, { useMemo } from "react";
import * as THREE from "three";

const WorldMap: React.FC = () => {
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

    // Create a more detailed world map with recognizable shapes
    const createContinentMesh = (points: [number, number][], color: string) => {
      const vertices = points.map(([lat, lng]) => latLngToVector3(lat, lng));

      // Create a more complex shape using multiple triangles
      const positions = [];
      const indices = [];

      // Create triangles between consecutive points and a center point
      const center = new THREE.Vector3();
      vertices.forEach((vertex) => center.add(vertex));
      center.divideScalar(vertices.length);

      for (let i = 0; i < vertices.length; i++) {
        const nextIndex = (i + 1) % vertices.length;

        // Add vertices
        positions.push(center.x, center.y, center.z);
        positions.push(vertices[i].x, vertices[i].y, vertices[i].z);
        positions.push(
          vertices[nextIndex].x,
          vertices[nextIndex].y,
          vertices[nextIndex].z
        );

        // Add triangle indices
        const baseIndex = i * 3;
        indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
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
        opacity: 0.6,
        side: THREE.DoubleSide,
      });

      return { geometry, material };
    };

    // Much more detailed and comprehensive continent shapes
    const northAmerica = createContinentMesh(
      [
        [70, -140],
        [70, -60],
        [60, -50],
        [50, -60],
        [30, -80],
        [25, -100],
        [30, -120],
        [50, -140],
        [70, -140],
        // Add more points for better coverage
        [60, -130],
        [55, -120],
        [50, -110],
        [45, -100],
        [40, -90],
        [35, -80],
        [30, -70],
        [25, -60],
        [20, -50],
        [15, -40],
        [10, -30],
        [5, -20],
        [0, -10],
        [-5, 0],
        [-10, 10],
        [-15, 20],
        [-20, 30],
        [-25, 40],
        [70, -140], // Close the shape
      ],
      "#228B22"
    ); // Forest Green

    const southAmerica = createContinentMesh(
      [
        [10, -80],
        [15, -60],
        [10, -40],
        [0, -35],
        [-20, -40],
        [-40, -50],
        [-55, -70],
        [-50, -80],
        [10, -80],
        // Add more points for better coverage
        [5, -75],
        [0, -70],
        [-5, -65],
        [-10, -60],
        [-15, -55],
        [-20, -50],
        [-25, -45],
        [-30, -40],
        [-35, -35],
        [-40, -30],
        [-45, -25],
        [-50, -20],
        [-55, -15],
        [-60, -10],
        [-65, -5],
        [-70, 0],
        [-75, 5],
        [-80, 10],
        [10, -80], // Close the shape
      ],
      "#32CD32"
    ); // Lime Green

    const europe = createContinentMesh(
      [
        [70, -10],
        [70, 20],
        [60, 30],
        [50, 40],
        [40, 35],
        [35, 20],
        [35, -10],
        [50, -15],
        [70, -10],
        // Add more points for better coverage
        [65, -5],
        [60, 0],
        [55, 5],
        [50, 10],
        [45, 15],
        [40, 20],
        [35, 25],
        [30, 30],
        [25, 35],
        [20, 40],
        [15, 45],
        [10, 50],
        [5, 55],
        [0, 60],
        [-5, 65],
        [-10, 70],
        [-15, 75],
        [-20, 80],
        [70, -10], // Close the shape
      ],
      "#FFD700"
    ); // Gold

    const asia = createContinentMesh(
      [
        [70, 40],
        [70, 120],
        [60, 140],
        [50, 160],
        [30, 180],
        [20, 160],
        [10, 120],
        [10, 60],
        [70, 40],
        // Add more points for better coverage
        [65, 50],
        [60, 60],
        [55, 70],
        [50, 80],
        [45, 90],
        [40, 100],
        [35, 110],
        [30, 120],
        [25, 130],
        [20, 140],
        [15, 150],
        [10, 160],
        [5, 170],
        [0, 180],
        [-5, 190],
        [-10, 200],
        [-15, 210],
        [-20, 220],
        [70, 40], // Close the shape
      ],
      "#8B4513"
    ); // Saddle Brown

    const africa = createContinentMesh(
      [
        [35, -20],
        [35, 20],
        [30, 40],
        [20, 50],
        [0, 45],
        [-20, 30],
        [-35, 10],
        [-35, -20],
        [35, -20],
        // Add more points for better coverage
        [30, -15],
        [25, -10],
        [20, -5],
        [15, 0],
        [10, 5],
        [5, 10],
        [0, 15],
        [-5, 20],
        [-10, 25],
        [-15, 30],
        [-20, 35],
        [-25, 40],
        [-30, 45],
        [-35, 50],
        [-40, 55],
        [-45, 60],
        [-50, 65],
        [-55, 70],
        [35, -20], // Close the shape
      ],
      "#D2691E"
    ); // Chocolate

    const australia = createContinentMesh(
      [
        [-10, 110],
        [-10, 140],
        [-20, 155],
        [-35, 150],
        [-45, 130],
        [-45, 110],
        [-30, 105],
        [-10, 110],
        // Add more points for better coverage
        [-15, 115],
        [-20, 120],
        [-25, 125],
        [-30, 130],
        [-35, 135],
        [-40, 140],
        [-45, 145],
        [-50, 150],
        [-55, 155],
        [-60, 160],
        [-65, 165],
        [-70, 170],
        [-75, 175],
        [-80, 180],
        [-85, 185],
        [-90, 190],
        [-10, 110], // Close the shape
      ],
      "#FF6347"
    ); // Tomato

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

export default WorldMap;
