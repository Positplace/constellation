import React, { useMemo } from "react";
import * as THREE from "three";

interface ToggleableWorkingWorldMapProps {
  showContinents: boolean;
}

const ToggleableWorkingWorldMap: React.FC<ToggleableWorkingWorldMapProps> = ({
  showContinents,
}) => {
  const { worldMapTexture, displacementMap } = useMemo(() => {
    if (!showContinents) {
      // Return a simple ocean texture when continents are hidden
      const canvas = document.createElement("canvas");
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");

      if (!ctx) return { worldMapTexture: null, displacementMap: null };

      // Fill with beautiful ocean blue only
      ctx.fillStyle = "#1e90ff";
      ctx.fillRect(0, 0, 2048, 1024);

      const worldMapTexture = new THREE.CanvasTexture(canvas);
      worldMapTexture.wrapS = THREE.RepeatWrapping;
      worldMapTexture.wrapT = THREE.ClampToEdgeWrapping;

      // No displacement when continents are hidden
      const displacementCanvas = document.createElement("canvas");
      displacementCanvas.width = 2048;
      displacementCanvas.height = 1024;
      const dispCtx = displacementCanvas.getContext("2d");

      if (!dispCtx) return { worldMapTexture, displacementMap: null };

      // Fill with black (no displacement)
      dispCtx.fillStyle = "#000000";
      dispCtx.fillRect(0, 0, 2048, 1024);

      const displacementMap = new THREE.CanvasTexture(displacementCanvas);
      displacementMap.wrapS = THREE.RepeatWrapping;
      displacementMap.wrapT = THREE.ClampToEdgeWrapping;

      return { worldMapTexture, displacementMap };
    }

    // Create world map texture with doubled resolution
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");

    if (!ctx) return { worldMapTexture: null, displacementMap: null };

    // Fill with beautiful ocean blue
    ctx.fillStyle = "#1e90ff";
    ctx.fillRect(0, 0, 2048, 1024);

    // Draw continents as recognizable shapes with varied terrain
    // We'll use different colors for different terrain types

    // Function to create gradient-filled continent
    const drawContinentWithGradient = (
      path: () => void,
      centerX: number,
      centerY: number,
      terrainType: "forest" | "grassland" | "desert" | "tundra" | "tropical"
    ) => {
      // Create gradient based on terrain type
      let gradient;
      if (terrainType === "forest") {
        gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          200
        );
        gradient.addColorStop(0, "#228B22"); // Forest green center
        gradient.addColorStop(0.7, "#32CD32"); // Lime green
        gradient.addColorStop(1, "#90EE90"); // Light green edges
      } else if (terrainType === "grassland") {
        gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          200
        );
        gradient.addColorStop(0, "#9ACD32"); // Yellow green center
        gradient.addColorStop(0.7, "#ADFF2F"); // Green yellow
        gradient.addColorStop(1, "#F0E68C"); // Khaki edges
      } else if (terrainType === "desert") {
        gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          200
        );
        gradient.addColorStop(0, "#D2B48C"); // Tan center
        gradient.addColorStop(0.7, "#F4A460"); // Sandy brown
        gradient.addColorStop(1, "#DEB887"); // Burlywood edges
      } else if (terrainType === "tundra") {
        gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          200
        );
        gradient.addColorStop(0, "#8FBC8F"); // Dark sea green center
        gradient.addColorStop(0.7, "#98FB98"); // Pale green
        gradient.addColorStop(1, "#F0FFF0"); // Honeydew edges
      } else {
        // tropical
        gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          200
        );
        gradient.addColorStop(0, "#006400"); // Dark green center
        gradient.addColorStop(0.7, "#228B22"); // Forest green
        gradient.addColorStop(1, "#32CD32"); // Lime green edges
      }

      ctx.fillStyle = gradient;
      path();
      ctx.fill();
    };

    // North America - highly detailed realistic shape with forest/grassland gradient
    drawContinentWithGradient(
      () => {
        ctx.beginPath();
        ctx.moveTo(200, 120);
        ctx.lineTo(300, 100);
        ctx.lineTo(400, 120);
        ctx.lineTo(500, 160);
        ctx.lineTo(560, 240);
        ctx.lineTo(540, 360);
        ctx.lineTo(480, 440);
        ctx.lineTo(400, 480);
        ctx.lineTo(320, 460);
        ctx.lineTo(260, 400);
        ctx.lineTo(220, 320);
        ctx.lineTo(200, 240);
        ctx.lineTo(190, 180);
        ctx.closePath();
      },
      380,
      300,
      "forest"
    );

    // Alaska - tundra terrain
    drawContinentWithGradient(
      () => {
        ctx.beginPath();
        ctx.moveTo(100, 80);
        ctx.lineTo(200, 60);
        ctx.lineTo(250, 100);
        ctx.lineTo(240, 140);
        ctx.lineTo(180, 160);
        ctx.lineTo(120, 140);
        ctx.closePath();
      },
      175,
      110,
      "tundra"
    );

    // South America - tropical terrain
    drawContinentWithGradient(
      () => {
        ctx.beginPath();
        ctx.moveTo(400, 440);
        ctx.lineTo(440, 480);
        ctx.lineTo(460, 560);
        ctx.lineTo(440, 640);
        ctx.lineTo(400, 720);
        ctx.lineTo(360, 800);
        ctx.lineTo(320, 820);
        ctx.lineTo(280, 800);
        ctx.lineTo(260, 720);
        ctx.lineTo(280, 640);
        ctx.lineTo(300, 560);
        ctx.lineTo(320, 480);
        ctx.lineTo(360, 440);
        ctx.closePath();
      },
      360,
      630,
      "tropical"
    );

    // Europe - grassland terrain
    drawContinentWithGradient(
      () => {
        ctx.beginPath();
        ctx.moveTo(960, 200);
        ctx.lineTo(1000, 160);
        ctx.lineTo(1060, 180);
        ctx.lineTo(1120, 220);
        ctx.lineTo(1160, 280);
        ctx.lineTo(1140, 340);
        ctx.lineTo(1100, 380);
        ctx.lineTo(1040, 400);
        ctx.lineTo(980, 380);
        ctx.lineTo(940, 340);
        ctx.lineTo(920, 280);
        ctx.lineTo(940, 220);
        ctx.closePath();
      },
      1040,
      280,
      "grassland"
    );

    // British Isles - grassland terrain
    drawContinentWithGradient(
      () => {
        ctx.beginPath();
        ctx.moveTo(920, 240);
        ctx.lineTo(940, 220);
        ctx.lineTo(960, 240);
        ctx.lineTo(960, 260);
        ctx.lineTo(940, 280);
        ctx.lineTo(920, 260);
        ctx.closePath();
      },
      940,
      250,
      "grassland"
    );

    // Ireland - grassland terrain
    drawContinentWithGradient(
      () => {
        ctx.beginPath();
        ctx.moveTo(900, 260);
        ctx.lineTo(920, 240);
        ctx.lineTo(920, 280);
        ctx.lineTo(900, 300);
        ctx.closePath();
      },
      910,
      270,
      "grassland"
    );

    // Asia - mixed terrain (forest/grassland)
    drawContinentWithGradient(
      () => {
        ctx.beginPath();
        ctx.moveTo(1160, 160);
        ctx.lineTo(1300, 140);
        ctx.lineTo(1440, 160);
        ctx.lineTo(1560, 200);
        ctx.lineTo(1640, 260);
        ctx.lineTo(1720, 340);
        ctx.lineTo(1740, 440);
        ctx.lineTo(1720, 540);
        ctx.lineTo(1640, 620);
        ctx.lineTo(1560, 680);
        ctx.lineTo(1440, 700);
        ctx.lineTo(1300, 680);
        ctx.lineTo(1160, 640);
        ctx.lineTo(1080, 560);
        ctx.lineTo(1040, 460);
        ctx.lineTo(1060, 360);
        ctx.lineTo(1100, 260);
        ctx.closePath();
      },
      1400,
      420,
      "forest"
    );

    // India subcontinent - tropical terrain
    drawContinentWithGradient(
      () => {
        ctx.beginPath();
        ctx.moveTo(1300, 400);
        ctx.lineTo(1400, 380);
        ctx.lineTo(1500, 400);
        ctx.lineTo(1560, 460);
        ctx.lineTo(1540, 520);
        ctx.lineTo(1480, 560);
        ctx.lineTo(1400, 540);
        ctx.lineTo(1320, 500);
        ctx.lineTo(1280, 440);
        ctx.closePath();
      },
      1420,
      470,
      "tropical"
    );

    // Africa - mixed terrain (desert/grassland)
    drawContinentWithGradient(
      () => {
        ctx.beginPath();
        ctx.moveTo(1000, 400);
        ctx.lineTo(1040, 360);
        ctx.lineTo(1080, 380);
        ctx.lineTo(1120, 440);
        ctx.lineTo(1140, 520);
        ctx.lineTo(1120, 600);
        ctx.lineTo(1080, 680);
        ctx.lineTo(1040, 760);
        ctx.lineTo(1000, 800);
        ctx.lineTo(960, 760);
        ctx.lineTo(920, 680);
        ctx.lineTo(900, 600);
        ctx.lineTo(920, 520);
        ctx.lineTo(940, 440);
        ctx.lineTo(960, 380);
        ctx.closePath();
      },
      1020,
      580,
      "desert"
    );

    // Madagascar - tropical terrain
    drawContinentWithGradient(
      () => {
        ctx.beginPath();
        ctx.moveTo(1200, 600);
        ctx.lineTo(1240, 580);
        ctx.lineTo(1280, 600);
        ctx.lineTo(1300, 660);
        ctx.lineTo(1280, 720);
        ctx.lineTo(1240, 740);
        ctx.lineTo(1200, 720);
        ctx.lineTo(1180, 660);
        ctx.closePath();
      },
      1240,
      660,
      "tropical"
    );

    // Australia - desert/grassland terrain
    drawContinentWithGradient(
      () => {
        ctx.beginPath();
        ctx.moveTo(1500, 700);
        ctx.lineTo(1560, 680);
        ctx.lineTo(1620, 700);
        ctx.lineTo(1660, 740);
        ctx.lineTo(1680, 800);
        ctx.lineTo(1660, 860);
        ctx.lineTo(1620, 900);
        ctx.lineTo(1560, 920);
        ctx.lineTo(1500, 900);
        ctx.lineTo(1460, 860);
        ctx.lineTo(1440, 800);
        ctx.lineTo(1460, 740);
        ctx.closePath();
      },
      1560,
      800,
      "desert"
    );

    // New Zealand North Island - grassland terrain
    drawContinentWithGradient(
      () => {
        ctx.beginPath();
        ctx.moveTo(1800, 800);
        ctx.lineTo(1840, 780);
        ctx.lineTo(1880, 800);
        ctx.lineTo(1880, 840);
        ctx.lineTo(1840, 860);
        ctx.lineTo(1800, 840);
        ctx.closePath();
      },
      1840,
      820,
      "grassland"
    );

    // New Zealand South Island - grassland terrain
    drawContinentWithGradient(
      () => {
        ctx.beginPath();
        ctx.moveTo(1820, 860);
        ctx.lineTo(1860, 840);
        ctx.lineTo(1900, 860);
        ctx.lineTo(1920, 920);
        ctx.lineTo(1900, 980);
        ctx.lineTo(1860, 1000);
        ctx.lineTo(1820, 980);
        ctx.lineTo(1800, 920);
        ctx.closePath();
      },
      1860,
      920,
      "grassland"
    );

    // Japan - forest terrain
    drawContinentWithGradient(
      () => {
        ctx.beginPath();
        ctx.moveTo(1700, 300);
        ctx.lineTo(1740, 280);
        ctx.lineTo(1780, 300);
        ctx.lineTo(1800, 340);
        ctx.lineTo(1780, 380);
        ctx.lineTo(1740, 400);
        ctx.lineTo(1700, 380);
        ctx.lineTo(1680, 340);
        ctx.closePath();
      },
      1740,
      340,
      "forest"
    );

    // Philippines - tropical terrain
    drawContinentWithGradient(
      () => {
        ctx.beginPath();
        ctx.moveTo(1600, 500);
        ctx.lineTo(1640, 480);
        ctx.lineTo(1680, 500);
        ctx.lineTo(1700, 540);
        ctx.lineTo(1680, 580);
        ctx.lineTo(1640, 600);
        ctx.lineTo(1600, 580);
        ctx.lineTo(1580, 540);
        ctx.closePath();
      },
      1640,
      540,
      "tropical"
    );

    // Add snow caps at North and South poles (smaller to avoid overlapping with British Isles)
    ctx.fillStyle = "#FFFFFF"; // Pure white for snow

    // North Pole snow cap (smaller radius)
    ctx.beginPath();
    ctx.arc(1024, 50, 50, 0, Math.PI * 2);
    ctx.fill();

    // South Pole snow cap (smaller radius)
    ctx.beginPath();
    ctx.arc(1024, 974, 50, 0, Math.PI * 2);
    ctx.fill();

    const worldMapTexture = new THREE.CanvasTexture(canvas);
    worldMapTexture.wrapS = THREE.RepeatWrapping;
    worldMapTexture.wrapT = THREE.ClampToEdgeWrapping;

    // Create displacement map for elevations
    const displacementCanvas = document.createElement("canvas");
    displacementCanvas.width = 2048;
    displacementCanvas.height = 1024;
    const dispCtx = displacementCanvas.getContext("2d");

    if (!dispCtx) return { worldMapTexture, displacementMap: null };

    // Fill with black (no displacement)
    dispCtx.fillStyle = "#000000";
    dispCtx.fillRect(0, 0, 2048, 1024);

    // Add white areas for land (elevation)
    dispCtx.fillStyle = "#ffffff";

    // North America elevation
    dispCtx.beginPath();
    dispCtx.moveTo(200, 120);
    dispCtx.lineTo(300, 100);
    dispCtx.lineTo(400, 120);
    dispCtx.lineTo(500, 160);
    dispCtx.lineTo(560, 240);
    dispCtx.lineTo(540, 360);
    dispCtx.lineTo(480, 440);
    dispCtx.lineTo(400, 480);
    dispCtx.lineTo(320, 460);
    dispCtx.lineTo(260, 400);
    dispCtx.lineTo(220, 320);
    dispCtx.lineTo(200, 240);
    dispCtx.lineTo(190, 180);
    dispCtx.closePath();
    dispCtx.fill();

    // Alaska elevation
    dispCtx.beginPath();
    dispCtx.moveTo(100, 80);
    dispCtx.lineTo(200, 60);
    dispCtx.lineTo(250, 100);
    dispCtx.lineTo(240, 140);
    dispCtx.lineTo(180, 160);
    dispCtx.lineTo(120, 140);
    dispCtx.closePath();
    dispCtx.fill();

    // South America elevation
    dispCtx.beginPath();
    dispCtx.moveTo(400, 440);
    dispCtx.lineTo(440, 480);
    dispCtx.lineTo(460, 560);
    dispCtx.lineTo(440, 640);
    dispCtx.lineTo(400, 720);
    dispCtx.lineTo(360, 800);
    dispCtx.lineTo(320, 820);
    dispCtx.lineTo(280, 800);
    dispCtx.lineTo(260, 720);
    dispCtx.lineTo(280, 640);
    dispCtx.lineTo(300, 560);
    dispCtx.lineTo(320, 480);
    dispCtx.lineTo(360, 440);
    dispCtx.closePath();
    dispCtx.fill();

    // Europe elevation
    dispCtx.beginPath();
    dispCtx.moveTo(960, 200);
    dispCtx.lineTo(1000, 160);
    dispCtx.lineTo(1060, 180);
    dispCtx.lineTo(1120, 220);
    dispCtx.lineTo(1160, 280);
    dispCtx.lineTo(1140, 340);
    dispCtx.lineTo(1100, 380);
    dispCtx.lineTo(1040, 400);
    dispCtx.lineTo(980, 380);
    dispCtx.lineTo(940, 340);
    dispCtx.lineTo(920, 280);
    dispCtx.lineTo(940, 220);
    dispCtx.closePath();
    dispCtx.fill();

    // British Isles elevation
    dispCtx.beginPath();
    dispCtx.moveTo(920, 240);
    dispCtx.lineTo(940, 220);
    dispCtx.lineTo(960, 240);
    dispCtx.lineTo(960, 260);
    dispCtx.lineTo(940, 280);
    dispCtx.lineTo(920, 260);
    dispCtx.closePath();
    dispCtx.fill();

    // Ireland elevation
    dispCtx.beginPath();
    dispCtx.moveTo(900, 260);
    dispCtx.lineTo(920, 240);
    dispCtx.lineTo(920, 280);
    dispCtx.lineTo(900, 300);
    dispCtx.closePath();
    dispCtx.fill();

    // Asia elevation
    dispCtx.beginPath();
    dispCtx.moveTo(1160, 160);
    dispCtx.lineTo(1300, 140);
    dispCtx.lineTo(1440, 160);
    dispCtx.lineTo(1560, 200);
    dispCtx.lineTo(1640, 260);
    dispCtx.lineTo(1720, 340);
    dispCtx.lineTo(1740, 440);
    dispCtx.lineTo(1720, 540);
    dispCtx.lineTo(1640, 620);
    dispCtx.lineTo(1560, 680);
    dispCtx.lineTo(1440, 700);
    dispCtx.lineTo(1300, 680);
    dispCtx.lineTo(1160, 640);
    dispCtx.lineTo(1080, 560);
    dispCtx.lineTo(1040, 460);
    dispCtx.lineTo(1060, 360);
    dispCtx.lineTo(1100, 260);
    dispCtx.closePath();
    dispCtx.fill();

    // India subcontinent elevation
    dispCtx.beginPath();
    dispCtx.moveTo(1300, 400);
    dispCtx.lineTo(1400, 380);
    dispCtx.lineTo(1500, 400);
    dispCtx.lineTo(1560, 460);
    dispCtx.lineTo(1540, 520);
    dispCtx.lineTo(1480, 560);
    dispCtx.lineTo(1400, 540);
    dispCtx.lineTo(1320, 500);
    dispCtx.lineTo(1280, 440);
    dispCtx.closePath();
    dispCtx.fill();

    // Africa elevation
    dispCtx.beginPath();
    dispCtx.moveTo(1000, 400);
    dispCtx.lineTo(1040, 360);
    dispCtx.lineTo(1080, 380);
    dispCtx.lineTo(1120, 440);
    dispCtx.lineTo(1140, 520);
    dispCtx.lineTo(1120, 600);
    dispCtx.lineTo(1080, 680);
    dispCtx.lineTo(1040, 760);
    dispCtx.lineTo(1000, 800);
    dispCtx.lineTo(960, 760);
    dispCtx.lineTo(920, 680);
    dispCtx.lineTo(900, 600);
    dispCtx.lineTo(920, 520);
    dispCtx.lineTo(940, 440);
    dispCtx.lineTo(960, 380);
    dispCtx.closePath();
    dispCtx.fill();

    // Madagascar elevation
    dispCtx.beginPath();
    dispCtx.moveTo(1200, 600);
    dispCtx.lineTo(1240, 580);
    dispCtx.lineTo(1280, 600);
    dispCtx.lineTo(1300, 660);
    dispCtx.lineTo(1280, 720);
    dispCtx.lineTo(1240, 740);
    dispCtx.lineTo(1200, 720);
    dispCtx.lineTo(1180, 660);
    dispCtx.closePath();
    dispCtx.fill();

    // Australia elevation
    dispCtx.beginPath();
    dispCtx.moveTo(1500, 700);
    dispCtx.lineTo(1560, 680);
    dispCtx.lineTo(1620, 700);
    dispCtx.lineTo(1660, 740);
    dispCtx.lineTo(1680, 800);
    dispCtx.lineTo(1660, 860);
    dispCtx.lineTo(1620, 900);
    dispCtx.lineTo(1560, 920);
    dispCtx.lineTo(1500, 900);
    dispCtx.lineTo(1460, 860);
    dispCtx.lineTo(1440, 800);
    dispCtx.lineTo(1460, 740);
    dispCtx.closePath();
    dispCtx.fill();

    // New Zealand North Island elevation
    dispCtx.beginPath();
    dispCtx.moveTo(1800, 800);
    dispCtx.lineTo(1840, 780);
    dispCtx.lineTo(1880, 800);
    dispCtx.lineTo(1880, 840);
    dispCtx.lineTo(1840, 860);
    dispCtx.lineTo(1800, 840);
    dispCtx.closePath();
    dispCtx.fill();

    // New Zealand South Island elevation
    dispCtx.beginPath();
    dispCtx.moveTo(1820, 860);
    dispCtx.lineTo(1860, 840);
    dispCtx.lineTo(1900, 860);
    dispCtx.lineTo(1920, 920);
    dispCtx.lineTo(1900, 980);
    dispCtx.lineTo(1860, 1000);
    dispCtx.lineTo(1820, 980);
    dispCtx.lineTo(1800, 920);
    dispCtx.closePath();
    dispCtx.fill();

    // Japan elevation
    dispCtx.beginPath();
    dispCtx.moveTo(1700, 300);
    dispCtx.lineTo(1740, 280);
    dispCtx.lineTo(1780, 300);
    dispCtx.lineTo(1800, 340);
    dispCtx.lineTo(1780, 380);
    dispCtx.lineTo(1740, 400);
    dispCtx.lineTo(1700, 380);
    dispCtx.lineTo(1680, 340);
    dispCtx.closePath();
    dispCtx.fill();

    // Philippines elevation
    dispCtx.beginPath();
    dispCtx.moveTo(1600, 500);
    dispCtx.lineTo(1640, 480);
    dispCtx.lineTo(1680, 500);
    dispCtx.lineTo(1700, 540);
    dispCtx.lineTo(1680, 580);
    dispCtx.lineTo(1640, 600);
    dispCtx.lineTo(1600, 580);
    dispCtx.lineTo(1580, 540);
    dispCtx.closePath();
    dispCtx.fill();

    // Add snow caps elevation at North and South poles (smaller to match texture)
    // North Pole snow cap elevation
    dispCtx.beginPath();
    dispCtx.arc(1024, 50, 50, 0, Math.PI * 2);
    dispCtx.fill();

    // South Pole snow cap elevation
    dispCtx.beginPath();
    dispCtx.arc(1024, 974, 50, 0, Math.PI * 2);
    dispCtx.fill();

    const displacementMap = new THREE.CanvasTexture(displacementCanvas);
    displacementMap.wrapS = THREE.RepeatWrapping;
    displacementMap.wrapT = THREE.ClampToEdgeWrapping;

    return { worldMapTexture, displacementMap };
  }, [showContinents]);

  if (!worldMapTexture || !displacementMap) return null;

  return (
    <mesh>
      <sphereGeometry args={[1.01, 128, 128]} />
      <meshPhongMaterial
        map={worldMapTexture}
        displacementMap={displacementMap}
        displacementScale={showContinents ? 0.015 : 0}
        transparent
        opacity={0.9}
        shininess={0}
        specular="#000000"
      />
    </mesh>
  );
};

export default ToggleableWorkingWorldMap;
