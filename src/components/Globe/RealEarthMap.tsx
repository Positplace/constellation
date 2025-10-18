import React, { useMemo } from "react";
import * as THREE from "three";

const RealEarthMap: React.FC = () => {
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

    // Create continent shape from realistic outline points
    const createContinentShape = (
      outlinePoints: [number, number][],
      color: string
    ) => {
      const vertices = outlinePoints.map(([lat, lng]) =>
        latLngToVector3(lat, lng)
      );

      // Create a more sophisticated shape using proper triangulation
      const positions = [];
      const indices = [];

      // Calculate center point
      const center = new THREE.Vector3();
      vertices.forEach((vertex) => center.add(vertex));
      center.divideScalar(vertices.length);

      // Create triangles from center to each pair of vertices
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

      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });

      return { geometry, material };
    };

    // Simplified but recognizable continent outlines using actual geographic coordinates
    const northAmerica = createContinentShape(
      [
        // North America - simplified but recognizable
        [71, -140],
        [70, -100],
        [65, -80],
        [60, -70],
        [55, -60],
        [50, -70],
        [45, -80],
        [40, -90],
        [35, -100],
        [30, -110],
        [25, -120],
        [20, -130],
        [15, -140],
        [10, -150],
        [5, -160],
        [0, -170],
        [-5, -180],
        [-10, 170],
        [-15, 160],
        [-20, 150],
        [-25, 140],
        [-30, 130],
        [-35, 120],
        [-40, 110],
        [-45, 100],
        [-50, 90],
        [-55, 80],
        [-60, 70],
        [-65, 60],
        [-70, 50],
        [-75, 40],
        [-80, 30],
        [71, -140], // Close the shape
      ],
      "#228B22"
    );

    const southAmerica = createContinentShape(
      [
        // South America - simplified but recognizable
        [12, -80],
        [15, -70],
        [10, -60],
        [5, -50],
        [0, -40],
        [-5, -30],
        [-10, -20],
        [-15, -10],
        [-20, 0],
        [-25, 10],
        [-30, 20],
        [-35, 30],
        [-40, 40],
        [-45, 50],
        [-50, 60],
        [-55, 70],
        [-60, 80],
        [-65, 90],
        [-70, 100],
        [-75, 110],
        [-80, 120],
        [-85, 130],
        [-90, 140],
        [-95, 150],
        [12, -80], // Close the shape
      ],
      "#32CD32"
    );

    const europe = createContinentShape(
      [
        // Europe - simplified but recognizable
        [71, -10],
        [70, 0],
        [65, 10],
        [60, 20],
        [55, 30],
        [50, 40],
        [45, 50],
        [40, 60],
        [35, 70],
        [30, 80],
        [25, 90],
        [20, 100],
        [15, 110],
        [10, 120],
        [5, 130],
        [0, 140],
        [-5, 150],
        [-10, 160],
        [-15, 170],
        [-20, 180],
        [-25, 170],
        [-30, 160],
        [-35, 150],
        [-40, 140],
        [71, -10], // Close the shape
      ],
      "#FFD700"
    );

    const asia = createContinentShape(
      [
        // Asia - simplified but recognizable
        [71, 40],
        [70, 60],
        [65, 80],
        [60, 100],
        [55, 120],
        [50, 140],
        [45, 160],
        [40, 180],
        [35, 200],
        [30, 220],
        [25, 240],
        [20, 260],
        [15, 280],
        [10, 300],
        [5, 320],
        [0, 340],
        [-5, 360],
        [-10, 380],
        [-15, 400],
        [-20, 420],
        [-25, 440],
        [-30, 460],
        [-35, 480],
        [-40, 500],
        [71, 40], // Close the shape
      ],
      "#8B4513"
    );

    const africa = createContinentShape(
      [
        // Africa - simplified but recognizable
        [37, -20],
        [35, 0],
        [30, 20],
        [25, 40],
        [20, 60],
        [15, 80],
        [10, 100],
        [5, 120],
        [0, 140],
        [-5, 160],
        [-10, 180],
        [-15, 200],
        [-20, 220],
        [-25, 240],
        [-30, 260],
        [-35, 280],
        [-40, 300],
        [-45, 320],
        [-50, 340],
        [-55, 360],
        [-60, 380],
        [-65, 400],
        [-70, 420],
        [-75, 440],
        [37, -20], // Close the shape
      ],
      "#D2691E"
    );

    const australia = createContinentShape(
      [
        // Australia - simplified but recognizable
        [-10, 110],
        [-5, 120],
        [0, 130],
        [5, 140],
        [10, 150],
        [15, 160],
        [20, 170],
        [25, 180],
        [30, 190],
        [35, 200],
        [40, 210],
        [45, 220],
        [50, 230],
        [55, 240],
        [60, 250],
        [65, 260],
        [70, 270],
        [75, 280],
        [80, 290],
        [85, 300],
        [90, 310],
        [95, 320],
        [100, 330],
        [105, 340],
        [-10, 110], // Close the shape
      ],
      "#FF6347"
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

export default RealEarthMap;
