import * as THREE from "three";
import { PlanetData } from "../types/planet.types";

export function generateSurfaceTextures(planet: PlanetData): {
  map: THREE.CanvasTexture;
  displacementMap: THREE.CanvasTexture;
} {
  const width = 2048;
  const height = 1024;

  // Color map canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context not available");

  // Base ocean color - force bright blue for earth-like and ocean world planets
  const isEarthLike = planet.type === "earth_like";
  const isOceanWorld = planet.type === "ocean_world";
  let oceanColor = planet.appearance.baseColor || "#1e90ff";

  // Override with bright colors for water-dominant planets
  if (isEarthLike) {
    oceanColor = "#4AA9FF";
  } else if (isOceanWorld) {
    oceanColor = "#3D9FE8"; // Bright tropical ocean blue
  }

  ctx.fillStyle = oceanColor;
  ctx.fillRect(0, 0, width, height);

  // Draw continents as soft blobs around control point centroid
  planet.surface.continents.forEach((c) => {
    // Determine color based on primary terrain
    const terrainColor = terrainToColor(
      c.terrain.primary,
      isEarthLike || isOceanWorld
    );

    // Compute centroid and approximate radius
    const centerX = ((c.shape.centerLng + 180) / 360) * width;
    const centerY = ((90 - c.shape.centerLat) / 180) * height;
    const avgRadius = Math.max(40, Math.min(220, c.shape.size * 240));

    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      5,
      centerX,
      centerY,
      avgRadius
    );
    gradient.addColorStop(0, shade(terrainColor, 0.0));
    gradient.addColorStop(0.6, shade(terrainColor, 0.05));
    gradient.addColorStop(1, shade(terrainColor, 0.12));
    ctx.fillStyle = gradient;

    // Multi-lobed shape using control points
    ctx.beginPath();
    c.shape.controlPoints.forEach((p, idx) => {
      const x = ((p.lng + 180) / 360) * width;
      const y = ((90 - p.lat) / 180) * height;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();

    // Add small coastal noise by drawing concentric faded strokes
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.08 - i * 0.02;
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  });

  const worldMapTexture = new THREE.CanvasTexture(canvas);
  worldMapTexture.wrapS = THREE.RepeatWrapping;
  worldMapTexture.wrapT = THREE.ClampToEdgeWrapping;

  // Displacement map canvas
  const dispCanvas = document.createElement("canvas");
  dispCanvas.width = width;
  dispCanvas.height = height;
  const dctx = dispCanvas.getContext("2d");
  if (!dctx) throw new Error("2D context not available");

  // Use mid-gray as neutral displacement (no elevation),
  // so oceans stay near the sphere surface and land gently rises above.
  dctx.fillStyle = "#808080";
  dctx.fillRect(0, 0, width, height);

  planet.surface.continents.forEach((c) => {
    // Compute a gentle elevation tint based on continent average elevation
    const elev = Math.max(0.3, Math.min(2.0, c.terrain.elevation));
    const t = (elev - 0.3) / (2.0 - 0.3); // 0..1
    const gray = Math.round(128 + t * 32); // 128..160 (very subtle)
    dctx.fillStyle = `rgb(${gray},${gray},${gray})`;
    dctx.beginPath();
    c.shape.controlPoints.forEach((p, idx) => {
      const x = ((p.lng + 180) / 360) * width;
      const y = ((90 - p.lat) / 180) * height;
      if (idx === 0) dctx.moveTo(x, y);
      else dctx.lineTo(x, y);
    });
    dctx.closePath();
    dctx.fill();
  });

  const displacementMap = new THREE.CanvasTexture(dispCanvas);
  displacementMap.wrapS = THREE.RepeatWrapping;
  displacementMap.wrapT = THREE.ClampToEdgeWrapping;

  return { map: worldMapTexture, displacementMap };
}

function terrainToColor(terrain: string, isEarthLike: boolean = false): string {
  // Use brighter, more vibrant colors for earth-like planets
  if (isEarthLike) {
    switch (terrain) {
      case "forest":
        return "#3CB371"; // Medium sea green - much brighter
      case "plains":
      case "grassland":
        return "#B4D95E"; // Bright yellow-green
      case "desert":
        return "#E8C99B"; // Light sandy beige
      case "mountains":
        return "#A89382"; // Light brown-gray
      case "tundra":
      case "ice":
        return "#F0F0F0"; // Very light gray/white
      case "jungle":
        return "#2E8B57"; // Sea green - much brighter than dark green
      case "volcanic":
      case "lava":
        return "#A52A2A"; // Lighter brown-red
      default:
        return "#52C672"; // Bright green
    }
  }

  // Standard colors for other planet types
  switch (terrain) {
    case "forest":
      return "#228B22";
    case "plains":
    case "grassland":
      return "#9ACD32";
    case "desert":
      return "#D2B48C";
    case "mountains":
      return "#8B7765";
    case "tundra":
    case "ice":
      return "#E0E0E0";
    case "jungle":
      return "#006400";
    case "volcanic":
    case "lava":
      return "#8B0000";
    default:
      return "#32CD32";
  }
}

function shade(hex: string, amt: number): string {
  // Simple lighten toward white by amt
  const c = hex.replace("#", "");
  const num = parseInt(c, 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.floor(255 * amt));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.floor(255 * amt));
  const b = Math.min(255, (num & 0xff) + Math.floor(255 * amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
