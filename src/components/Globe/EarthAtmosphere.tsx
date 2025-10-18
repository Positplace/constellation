import React, { useMemo } from "react";
import * as THREE from "three";

const EarthAtmosphere: React.FC = () => {
  const atmosphereData = useMemo(() => {
    // Create atmosphere texture
    const atmosphereCanvas = document.createElement("canvas");
    atmosphereCanvas.width = 2048;
    atmosphereCanvas.height = 1024;
    const ctx = atmosphereCanvas.getContext("2d");

    if (!ctx) return null;

    // Fill with transparent
    ctx.clearRect(0, 0, 2048, 1024);

    // Create cloud patterns
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; // More visible white clouds

    // Create cloud patterns across the globe
    const createCloud = (x: number, y: number, size: number) => {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    };

    // Add clouds over continents
    // North America clouds
    createCloud(300, 200, 40);
    createCloud(400, 180, 30);
    createCloud(350, 250, 35);
    createCloud(450, 220, 25);
    createCloud(250, 300, 30);

    // South America clouds
    createCloud(500, 500, 35);
    createCloud(450, 600, 30);
    createCloud(400, 700, 40);
    createCloud(350, 750, 25);

    // Europe clouds
    createCloud(1000, 200, 30);
    createCloud(1100, 180, 25);
    createCloud(1050, 250, 35);
    createCloud(950, 300, 20);

    // Asia clouds
    createCloud(1300, 200, 40);
    createCloud(1400, 180, 35);
    createCloud(1500, 250, 30);
    createCloud(1600, 300, 25);
    createCloud(1350, 350, 30);
    createCloud(1450, 400, 35);

    // Africa clouds
    createCloud(1000, 500, 30);
    createCloud(1100, 550, 35);
    createCloud(1050, 650, 25);
    createCloud(950, 700, 30);

    // Australia clouds
    createCloud(1600, 800, 30);
    createCloud(1700, 850, 25);
    createCloud(1650, 900, 35);

    const atmosphereTexture = new THREE.CanvasTexture(atmosphereCanvas);
    atmosphereTexture.wrapS = THREE.RepeatWrapping;
    atmosphereTexture.wrapT = THREE.ClampToEdgeWrapping;

    return atmosphereTexture;
  }, []);

  if (!atmosphereData) return null;

  return (
    <group>
      {/* Atmosphere layer - doubled size */}
      <mesh>
        <sphereGeometry args={[1.14, 64, 64]} />
        <meshBasicMaterial
          color="#87ceeb"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Orange glow on dark side - doubled size */}
      <mesh>
        <sphereGeometry args={[1.12, 64, 64]} />
        <meshBasicMaterial
          color="#ff8c00"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh>
        <sphereGeometry args={[1.03, 64, 64]} />
        <meshBasicMaterial
          map={atmosphereData}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

export default EarthAtmosphere;
