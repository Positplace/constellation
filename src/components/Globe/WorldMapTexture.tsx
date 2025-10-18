import React, { useMemo } from "react";
import * as THREE from "three";

const WorldMapTexture: React.FC = () => {
  const worldMapTexture = useMemo(() => {
    // Create a simple world map texture using canvas
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    // Fill with ocean blue
    ctx.fillStyle = "#0066cc";
    ctx.fillRect(0, 0, 1024, 512);

    // Draw continents as simple shapes
    ctx.fillStyle = "#228B22"; // Green for land

    // North America
    ctx.beginPath();
    ctx.moveTo(150, 100);
    ctx.lineTo(200, 80);
    ctx.lineTo(250, 100);
    ctx.lineTo(280, 150);
    ctx.lineTo(250, 200);
    ctx.lineTo(200, 220);
    ctx.lineTo(150, 200);
    ctx.lineTo(120, 150);
    ctx.closePath();
    ctx.fill();

    // South America
    ctx.beginPath();
    ctx.moveTo(200, 250);
    ctx.lineTo(220, 280);
    ctx.lineTo(200, 350);
    ctx.lineTo(180, 400);
    ctx.lineTo(160, 350);
    ctx.lineTo(180, 280);
    ctx.closePath();
    ctx.fill();

    // Europe
    ctx.beginPath();
    ctx.moveTo(500, 120);
    ctx.lineTo(520, 100);
    ctx.lineTo(550, 120);
    ctx.lineTo(560, 150);
    ctx.lineTo(550, 180);
    ctx.lineTo(520, 200);
    ctx.lineTo(500, 180);
    ctx.lineTo(490, 150);
    ctx.closePath();
    ctx.fill();

    // Asia
    ctx.beginPath();
    ctx.moveTo(600, 100);
    ctx.lineTo(700, 80);
    ctx.lineTo(800, 100);
    ctx.lineTo(850, 150);
    ctx.lineTo(800, 200);
    ctx.lineTo(700, 220);
    ctx.lineTo(600, 200);
    ctx.lineTo(550, 150);
    ctx.closePath();
    ctx.fill();

    // Africa
    ctx.beginPath();
    ctx.moveTo(520, 200);
    ctx.lineTo(540, 180);
    ctx.lineTo(560, 200);
    ctx.lineTo(570, 250);
    ctx.lineTo(560, 300);
    ctx.lineTo(540, 320);
    ctx.lineTo(520, 300);
    ctx.lineTo(510, 250);
    ctx.closePath();
    ctx.fill();

    // Australia
    ctx.beginPath();
    ctx.moveTo(750, 350);
    ctx.lineTo(800, 340);
    ctx.lineTo(850, 350);
    ctx.lineTo(860, 380);
    ctx.lineTo(850, 410);
    ctx.lineTo(800, 420);
    ctx.lineTo(750, 410);
    ctx.lineTo(740, 380);
    ctx.closePath();
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    return texture;
  }, []);

  if (!worldMapTexture) return null;

  return (
    <mesh>
      <sphereGeometry args={[1.01, 64, 64]} />
      <meshBasicMaterial map={worldMapTexture} transparent opacity={0.9} />
    </mesh>
  );
};

export default WorldMapTexture;
