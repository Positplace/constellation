import React, { useMemo } from "react";
import * as THREE from "three";

const ContinentShapes: React.FC = () => {
  const continentData = useMemo(() => {
    const createContinentShape = (
      points: [number, number][],
      color: string
    ) => {
      const latLngToVector3 = (
        lat: number,
        lng: number,
        radius: number = 1.005
      ) => {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);

        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);

        return new THREE.Vector3(x, y, z);
      };

      // Create vertices for the continent
      const vertices = points.map(([lat, lng]) => latLngToVector3(lat, lng));

      // Create a simple triangle fan from the center of the continent
      const center = new THREE.Vector3();
      vertices.forEach((vertex) => center.add(vertex));
      center.divideScalar(vertices.length);

      // Create triangles from center to each pair of vertices
      const positions = [];
      const indices = [];

      for (let i = 0; i < vertices.length; i++) {
        const nextIndex = (i + 1) % vertices.length;

        // Add center vertex
        positions.push(center.x, center.y, center.z);

        // Add current vertex
        positions.push(vertices[i].x, vertices[i].y, vertices[i].z);

        // Add next vertex
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

      // Create material
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });

      return { geometry, material };
    };

    // More detailed continent shapes
    const northAmerica = createContinentShape(
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
      ],
      "#4a90e2"
    );

    const southAmerica = createContinentShape(
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
      ],
      "#7ed321"
    );

    const europe = createContinentShape(
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
      ],
      "#f5a623"
    );

    const asia = createContinentShape(
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
      ],
      "#d0021b"
    );

    const africa = createContinentShape(
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
      ],
      "#9013fe"
    );

    const australia = createContinentShape(
      [
        [-10, 110],
        [-10, 140],
        [-20, 155],
        [-35, 150],
        [-45, 130],
        [-45, 110],
        [-30, 105],
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
        <mesh
          key={continent.name}
          geometry={continent.geometry}
          material={continent.material}
        />
      ))}
    </group>
  );
};

export default ContinentShapes;
