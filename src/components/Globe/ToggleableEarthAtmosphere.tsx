import React, { useMemo } from "react";
import * as THREE from "three";

interface ToggleableEarthAtmosphereProps {
  showAtmosphere: boolean;
  showClouds: boolean;
}

const ToggleableEarthAtmosphere: React.FC<ToggleableEarthAtmosphereProps> = ({
  showAtmosphere,
  showClouds,
}) => {
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
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)"; // More visible white clouds
    
    // Create realistic fluffy cloud shapes
    const createRealisticCloud = (x: number, y: number, baseSize: number, cloudType: 'cumulus' | 'stratus' | 'cirrus' = 'cumulus') => {
      ctx.beginPath();
      
      let circles: Array<{x: number, y: number, r: number}>;
      
      if (cloudType === 'cumulus') {
        // Puffy, cotton-like clouds
        circles = [
          { x: x - baseSize * 0.3, y: y, r: baseSize * 0.8 },
          { x: x + baseSize * 0.2, y: y - baseSize * 0.2, r: baseSize * 0.6 },
          { x: x + baseSize * 0.4, y: y + baseSize * 0.1, r: baseSize * 0.7 },
          { x: x - baseSize * 0.1, y: y + baseSize * 0.3, r: baseSize * 0.5 },
          { x: x + baseSize * 0.1, y: y - baseSize * 0.4, r: baseSize * 0.4 },
          { x: x - baseSize * 0.4, y: y - baseSize * 0.1, r: baseSize * 0.6 },
        ];
      } else if (cloudType === 'stratus') {
        // Layered, flat clouds
        circles = [
          { x: x - baseSize * 0.4, y: y, r: baseSize * 0.6 },
          { x: x, y: y, r: baseSize * 0.8 },
          { x: x + baseSize * 0.4, y: y, r: baseSize * 0.6 },
          { x: x - baseSize * 0.2, y: y + baseSize * 0.2, r: baseSize * 0.4 },
          { x: x + baseSize * 0.2, y: y + baseSize * 0.2, r: baseSize * 0.4 },
        ];
      } else {
        // Cirrus - wispy, elongated clouds
        circles = [
          { x: x - baseSize * 0.5, y: y, r: baseSize * 0.3 },
          { x: x - baseSize * 0.2, y: y - baseSize * 0.1, r: baseSize * 0.4 },
          { x: x + baseSize * 0.1, y: y, r: baseSize * 0.5 },
          { x: x + baseSize * 0.4, y: y + baseSize * 0.1, r: baseSize * 0.3 },
          { x: x + baseSize * 0.6, y: y - baseSize * 0.1, r: baseSize * 0.2 },
        ];
      }
      
      // Draw each circle part of the cloud
      circles.forEach(circle => {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // Add realistic clouds over continents
    // North America clouds
    createRealisticCloud(300, 200, 50);
    createRealisticCloud(400, 180, 40);
    createRealisticCloud(350, 250, 45);
    createRealisticCloud(450, 220, 35);
    createRealisticCloud(250, 300, 40);

    // South America clouds
    createRealisticCloud(500, 500, 45);
    createRealisticCloud(450, 600, 40);
    createRealisticCloud(400, 700, 50);
    createRealisticCloud(350, 750, 35);

    // Europe clouds
    createRealisticCloud(1000, 200, 40);
    createRealisticCloud(1100, 180, 35);
    createRealisticCloud(1050, 250, 45);
    createRealisticCloud(950, 300, 30);

    // Asia clouds
    createRealisticCloud(1300, 200, 50);
    createRealisticCloud(1400, 180, 45);
    createRealisticCloud(1500, 250, 40);
    createRealisticCloud(1600, 300, 35);
    createRealisticCloud(1350, 350, 40);
    createRealisticCloud(1450, 400, 45);

    // Africa clouds
    createRealisticCloud(1000, 500, 40);
    createRealisticCloud(1100, 550, 45);
    createRealisticCloud(1050, 650, 35);
    createRealisticCloud(950, 700, 40);

    // Australia clouds
    createRealisticCloud(1600, 800, 40);
    createRealisticCloud(1700, 850, 35);
    createRealisticCloud(1650, 900, 45);

    const atmosphereTexture = new THREE.CanvasTexture(atmosphereCanvas);
    atmosphereTexture.wrapS = THREE.RepeatWrapping;
    atmosphereTexture.wrapT = THREE.ClampToEdgeWrapping;

    return atmosphereTexture;
  }, []);

  if (!atmosphereData) return null;

  return (
    <group>
      {/* Atmosphere layer - doubled size */}
      {showAtmosphere && (
        <mesh>
          <sphereGeometry args={[1.14, 64, 64]} />
          <meshBasicMaterial 
            color="#87ceeb"
            transparent
            opacity={0.15}
            side={THREE.BackSide}
          />
        </mesh>
      )}
      
      {/* Orange glow on dark side - doubled size */}
      {showAtmosphere && (
        <mesh>
          <sphereGeometry args={[1.12, 64, 64]} />
          <meshBasicMaterial 
            color="#ff8c00"
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Cloud layer - above atmosphere */}
      {showClouds && (
        <mesh>
          <sphereGeometry args={[1.16, 64, 64]} />
          <meshBasicMaterial 
            map={atmosphereData}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

export default ToggleableEarthAtmosphere;
