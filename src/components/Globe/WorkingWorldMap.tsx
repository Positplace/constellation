import React, { useMemo } from "react";
import * as THREE from "three";

const WorkingWorldMap: React.FC = () => {
  const { worldMapTexture, displacementMap } = useMemo(() => {
    // Create world map texture
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    if (!ctx) return { worldMapTexture: null, displacementMap: null };

    // Fill with ocean blue
    ctx.fillStyle = "#0066cc";
    ctx.fillRect(0, 0, 1024, 512);

    // Draw continents as recognizable shapes
    ctx.fillStyle = "#228B22"; // Green for land

    // North America - more realistic shape
    ctx.beginPath();
    ctx.moveTo(100, 60);
    ctx.lineTo(150, 50);
    ctx.lineTo(200, 60);
    ctx.lineTo(250, 80);
    ctx.lineTo(280, 120);
    ctx.lineTo(270, 180);
    ctx.lineTo(240, 220);
    ctx.lineTo(200, 240);
    ctx.lineTo(160, 230);
    ctx.lineTo(130, 200);
    ctx.lineTo(110, 160);
    ctx.lineTo(100, 120);
    ctx.lineTo(95, 80);
    ctx.closePath();
    ctx.fill();

    // South America - more realistic shape
    ctx.beginPath();
    ctx.moveTo(200, 220);
    ctx.lineTo(220, 240);
    ctx.lineTo(230, 280);
    ctx.lineTo(220, 320);
    ctx.lineTo(200, 360);
    ctx.lineTo(180, 400);
    ctx.lineTo(160, 420);
    ctx.lineTo(140, 400);
    ctx.lineTo(130, 360);
    ctx.lineTo(140, 320);
    ctx.lineTo(150, 280);
    ctx.lineTo(160, 240);
    ctx.lineTo(180, 220);
    ctx.closePath();
    ctx.fill();

    // Europe - more realistic shape
    ctx.beginPath();
    ctx.moveTo(480, 100);
    ctx.lineTo(500, 80);
    ctx.lineTo(530, 90);
    ctx.lineTo(560, 110);
    ctx.lineTo(580, 140);
    ctx.lineTo(570, 170);
    ctx.lineTo(550, 190);
    ctx.lineTo(520, 200);
    ctx.lineTo(490, 190);
    ctx.lineTo(470, 170);
    ctx.lineTo(460, 140);
    ctx.lineTo(470, 110);
    ctx.closePath();
    ctx.fill();

    // Asia - more realistic shape
    ctx.beginPath();
    ctx.moveTo(580, 80);
    ctx.lineTo(650, 70);
    ctx.lineTo(720, 80);
    ctx.lineTo(780, 100);
    ctx.lineTo(820, 130);
    ctx.lineTo(850, 170);
    ctx.lineTo(860, 220);
    ctx.lineTo(850, 270);
    ctx.lineTo(820, 310);
    ctx.lineTo(780, 340);
    ctx.lineTo(720, 350);
    ctx.lineTo(650, 340);
    ctx.lineTo(580, 320);
    ctx.lineTo(540, 280);
    ctx.lineTo(520, 230);
    ctx.lineTo(530, 180);
    ctx.lineTo(550, 130);
    ctx.closePath();
    ctx.fill();

    // Africa - more realistic shape
    ctx.beginPath();
    ctx.moveTo(500, 200);
    ctx.lineTo(520, 180);
    ctx.lineTo(540, 190);
    ctx.lineTo(560, 220);
    ctx.lineTo(570, 260);
    ctx.lineTo(560, 300);
    ctx.lineTo(540, 340);
    ctx.lineTo(520, 380);
    ctx.lineTo(500, 400);
    ctx.lineTo(480, 380);
    ctx.lineTo(460, 340);
    ctx.lineTo(450, 300);
    ctx.lineTo(460, 260);
    ctx.lineTo(470, 220);
    ctx.lineTo(480, 190);
    ctx.closePath();
    ctx.fill();

    // Australia - more realistic shape
    ctx.beginPath();
    ctx.moveTo(750, 350);
    ctx.lineTo(780, 340);
    ctx.lineTo(810, 350);
    ctx.lineTo(830, 370);
    ctx.lineTo(840, 400);
    ctx.lineTo(830, 430);
    ctx.lineTo(810, 450);
    ctx.lineTo(780, 460);
    ctx.lineTo(750, 450);
    ctx.lineTo(730, 430);
    ctx.lineTo(720, 400);
    ctx.lineTo(730, 370);
    ctx.closePath();
    ctx.fill();

    const worldMapTexture = new THREE.CanvasTexture(canvas);
    worldMapTexture.wrapS = THREE.RepeatWrapping;
    worldMapTexture.wrapT = THREE.ClampToEdgeWrapping;

    // Create displacement map for elevations
    const displacementCanvas = document.createElement("canvas");
    displacementCanvas.width = 1024;
    displacementCanvas.height = 512;
    const dispCtx = displacementCanvas.getContext("2d");

    if (!dispCtx) return { worldMapTexture, displacementMap: null };

    // Fill with black (no displacement)
    dispCtx.fillStyle = "#000000";
    dispCtx.fillRect(0, 0, 1024, 512);

    // Add white areas for land (elevation)
    dispCtx.fillStyle = "#ffffff";

    // North America elevation
    dispCtx.beginPath();
    dispCtx.moveTo(100, 60);
    dispCtx.lineTo(150, 50);
    dispCtx.lineTo(200, 60);
    dispCtx.lineTo(250, 80);
    dispCtx.lineTo(280, 120);
    dispCtx.lineTo(270, 180);
    dispCtx.lineTo(240, 220);
    dispCtx.lineTo(200, 240);
    dispCtx.lineTo(160, 230);
    dispCtx.lineTo(130, 200);
    dispCtx.lineTo(110, 160);
    dispCtx.lineTo(100, 120);
    dispCtx.lineTo(95, 80);
    dispCtx.closePath();
    dispCtx.fill();

    // South America elevation
    dispCtx.beginPath();
    dispCtx.moveTo(200, 220);
    dispCtx.lineTo(220, 240);
    dispCtx.lineTo(230, 280);
    dispCtx.lineTo(220, 320);
    dispCtx.lineTo(200, 360);
    dispCtx.lineTo(180, 400);
    dispCtx.lineTo(160, 420);
    dispCtx.lineTo(140, 400);
    dispCtx.lineTo(130, 360);
    dispCtx.lineTo(140, 320);
    dispCtx.lineTo(150, 280);
    dispCtx.lineTo(160, 240);
    dispCtx.lineTo(180, 220);
    dispCtx.closePath();
    dispCtx.fill();

    // Europe elevation
    dispCtx.beginPath();
    dispCtx.moveTo(480, 100);
    dispCtx.lineTo(500, 80);
    dispCtx.lineTo(530, 90);
    dispCtx.lineTo(560, 110);
    dispCtx.lineTo(580, 140);
    dispCtx.lineTo(570, 170);
    dispCtx.lineTo(550, 190);
    dispCtx.lineTo(520, 200);
    dispCtx.lineTo(490, 190);
    dispCtx.lineTo(470, 170);
    dispCtx.lineTo(460, 140);
    dispCtx.lineTo(470, 110);
    dispCtx.closePath();
    dispCtx.fill();

    // Asia elevation
    dispCtx.beginPath();
    dispCtx.moveTo(580, 80);
    dispCtx.lineTo(650, 70);
    dispCtx.lineTo(720, 80);
    dispCtx.lineTo(780, 100);
    dispCtx.lineTo(820, 130);
    dispCtx.lineTo(850, 170);
    dispCtx.lineTo(860, 220);
    dispCtx.lineTo(850, 270);
    dispCtx.lineTo(820, 310);
    dispCtx.lineTo(780, 340);
    dispCtx.lineTo(720, 350);
    dispCtx.lineTo(650, 340);
    dispCtx.lineTo(580, 320);
    dispCtx.lineTo(540, 280);
    dispCtx.lineTo(520, 230);
    dispCtx.lineTo(530, 180);
    dispCtx.lineTo(550, 130);
    dispCtx.closePath();
    dispCtx.fill();

    // Africa elevation
    dispCtx.beginPath();
    dispCtx.moveTo(500, 200);
    dispCtx.lineTo(520, 180);
    dispCtx.lineTo(540, 190);
    dispCtx.lineTo(560, 220);
    dispCtx.lineTo(570, 260);
    dispCtx.lineTo(560, 300);
    dispCtx.lineTo(540, 340);
    dispCtx.lineTo(520, 380);
    dispCtx.lineTo(500, 400);
    dispCtx.lineTo(480, 380);
    dispCtx.lineTo(460, 340);
    dispCtx.lineTo(450, 300);
    dispCtx.lineTo(460, 260);
    dispCtx.lineTo(470, 220);
    dispCtx.lineTo(480, 190);
    dispCtx.closePath();
    dispCtx.fill();

    // Australia elevation
    dispCtx.beginPath();
    dispCtx.moveTo(750, 350);
    dispCtx.lineTo(780, 340);
    dispCtx.lineTo(810, 350);
    dispCtx.lineTo(830, 370);
    dispCtx.lineTo(840, 400);
    dispCtx.lineTo(830, 430);
    dispCtx.lineTo(810, 450);
    dispCtx.lineTo(780, 460);
    dispCtx.lineTo(750, 450);
    dispCtx.lineTo(730, 430);
    dispCtx.lineTo(720, 400);
    dispCtx.lineTo(730, 370);
    dispCtx.closePath();
    dispCtx.fill();

    const displacementMap = new THREE.CanvasTexture(displacementCanvas);
    displacementMap.wrapS = THREE.RepeatWrapping;
    displacementMap.wrapT = THREE.ClampToEdgeWrapping;

    return { worldMapTexture, displacementMap };
  }, []);

  if (!worldMapTexture || !displacementMap) return null;

  return (
    <mesh>
      <sphereGeometry args={[1.01, 128, 128]} />
      <meshPhongMaterial
        map={worldMapTexture}
        displacementMap={displacementMap}
        displacementScale={0.05}
        transparent
        opacity={0.9}
        shininess={100}
        specular="#ffffff"
      />
    </mesh>
  );
};

export default WorkingWorldMap;
