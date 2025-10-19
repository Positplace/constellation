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
  const isVolcanic =
    planet.type === "lava_world" || planet.type === "volcanic_world";

  // Always use proper ocean colors for water planets, ignore baseColor
  let oceanColor: string;
  if (isEarthLike) {
    oceanColor = "#1E90FF"; // Deep blue ocean like Earth
  } else if (isOceanWorld) {
    oceanColor = "#0077BE"; // Slightly deeper blue for ocean worlds
  } else if (isVolcanic) {
    oceanColor = "#2B1410"; // Very dark reddish-brown for lava/volcanic base
  } else {
    // For other planets, use baseColor or default
    oceanColor = planet.appearance.baseColor || "#4A90E2";
  }

  ctx.fillStyle = oceanColor;
  ctx.fillRect(0, 0, width, height);

  // Check if this is an icy planet for special decorations
  const isIcyPlanet =
    planet.type === "ice_world" ||
    planet.type === "frozen_world" ||
    planet.type === "arctic_world";

  // Draw continents as soft blobs around control point centroid
  planet.surface.continents.forEach((c) => {
    // Determine color based on primary terrain
    // For volcanic planets, override with red/volcanic colors
    let terrainColor: string;
    if (isVolcanic) {
      terrainColor = "#B8321F"; // Deep red-orange for volcanic continents
    } else {
      terrainColor = terrainToColor(
        c.terrain.primary,
        isEarthLike || isOceanWorld
      );
    }

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

  // Add surface cracks for volcanic and ice worlds
  if (isVolcanic || isIcyPlanet) {
    drawSurfaceCracks(ctx, planet, width, height, isVolcanic);
  }

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

/**
 * Draws procedural surface cracks for volcanic and ice worlds
 */
function drawSurfaceCracks(
  ctx: CanvasRenderingContext2D,
  planet: PlanetData,
  width: number,
  height: number,
  isVolcanic: boolean
): void {
  const seed = planet.seed;

  // Simple seeded random function
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  // Crack parameters
  const crackColor = isVolcanic
    ? "rgba(20, 10, 10, 0.7)"
    : "rgba(10, 10, 20, 0.6)";
  const glowColor = isVolcanic ? "rgba(255, 100, 20, 0.6)" : null; // Bright orange glow for volcanic
  const numCrackSystems = 15 + Math.floor(seededRandom(seed) * 20); // 15-35 crack systems

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Draw crack systems - each is a branching network
  for (let i = 0; i < numCrackSystems; i++) {
    const startX = seededRandom(seed + i * 123) * width;
    const startY = seededRandom(seed + i * 456) * height;

    // Each crack system has multiple branches
    const numBranches = 2 + Math.floor(seededRandom(seed + i * 789) * 4); // 2-6 branches

    for (let b = 0; b < numBranches; b++) {
      const branchSeed = seed + i * 1000 + b * 100;

      // Random initial direction
      let angle = seededRandom(branchSeed) * Math.PI * 2;
      let x = startX;
      let y = startY;

      // Number of segments in this branch
      const segments = 8 + Math.floor(seededRandom(branchSeed + 1) * 15); // 8-23 segments
      const segmentLength = 3 + seededRandom(branchSeed + 2) * 8; // 3-11 pixels

      // Store path for reuse (glow + dark crack)
      const path: Array<{ x: number; y: number; widthFactor: number }> = [
        { x, y, widthFactor: 1 },
      ];

      // Build crack path
      for (let s = 0; s < segments; s++) {
        // Add some randomness to the angle for natural-looking cracks
        angle += (seededRandom(branchSeed + s * 7) - 0.5) * 0.6;

        x += Math.cos(angle) * segmentLength;
        y += Math.sin(angle) * segmentLength;

        // Wrap around the texture edges (for longitude wrapping)
        if (x < 0) x += width;
        if (x > width) x -= width;

        // Stop if we go off the top/bottom
        if (y < 0 || y > height) break;

        const widthFactor = 1 - s / segments;
        path.push({ x, y, widthFactor });
      }

      // Draw glowing lava first (for volcanic planets)
      if (glowColor && path.length > 1) {
        ctx.strokeStyle = glowColor;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let p = 1; p < path.length; p++) {
          ctx.lineTo(path[p].x, path[p].y);
          ctx.lineWidth = 4.5 * path[p].widthFactor + 1.0;
        }
        ctx.stroke();
      }

      // Draw dark crack on top
      ctx.strokeStyle = crackColor;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let p = 1; p < path.length; p++) {
        ctx.lineTo(path[p].x, path[p].y);
        ctx.lineWidth = (isVolcanic ? 2.5 : 2.0) * path[p].widthFactor + 0.5;
      }
      ctx.stroke();

      // Add occasional sub-branches
      if (seededRandom(branchSeed + 999) > 0.6 && path.length > 5) {
        const subBranchAngle =
          angle + (seededRandom(branchSeed + 888) - 0.5) * Math.PI * 0.5;
        const subSegments = 3 + Math.floor(seededRandom(branchSeed + 777) * 6);

        let subX = path[path.length - 1].x;
        let subY = path[path.length - 1].y;
        const subPath: Array<{ x: number; y: number; widthFactor: number }> = [
          { x: subX, y: subY, widthFactor: 1 },
        ];

        for (let ss = 0; ss < subSegments; ss++) {
          subX += Math.cos(subBranchAngle) * segmentLength * 0.7;
          subY += Math.sin(subBranchAngle) * segmentLength * 0.7;

          if (subX < 0) subX += width;
          if (subX > width) subX -= width;
          if (subY < 0 || subY > height) break;

          const widthFactor = 1 - ss / subSegments;
          subPath.push({ x: subX, y: subY, widthFactor });
        }

        // Draw glow for sub-branch
        if (glowColor && subPath.length > 1) {
          ctx.strokeStyle = glowColor;
          ctx.beginPath();
          ctx.moveTo(subPath[0].x, subPath[0].y);
          for (let p = 1; p < subPath.length; p++) {
            ctx.lineTo(subPath[p].x, subPath[p].y);
            ctx.lineWidth = 3.0 * subPath[p].widthFactor + 0.8;
          }
          ctx.stroke();
        }

        // Draw dark crack for sub-branch
        ctx.strokeStyle = crackColor;
        ctx.beginPath();
        ctx.moveTo(subPath[0].x, subPath[0].y);
        for (let p = 1; p < subPath.length; p++) {
          ctx.lineTo(subPath[p].x, subPath[p].y);
          ctx.lineWidth = 1.0 * subPath[p].widthFactor + 0.3;
        }
        ctx.stroke();
      }
    }
  }

  // Add some fine, short cracks for more detail
  const numFineCracks = 30 + Math.floor(seededRandom(seed + 9999) * 40); // 30-70 fine cracks

  for (let i = 0; i < numFineCracks; i++) {
    const fx = seededRandom(seed + i * 234 + 5000) * width;
    const fy = seededRandom(seed + i * 567 + 5000) * height;
    const fAngle = seededRandom(seed + i * 890 + 5000) * Math.PI * 2;
    const fLength = 10 + seededRandom(seed + i * 111 + 5000) * 25; // 10-35 pixels

    const endX = fx + Math.cos(fAngle) * fLength;
    const endY = fy + Math.sin(fAngle) * fLength;

    // Draw glow first for volcanic planets
    if (glowColor) {
      ctx.strokeStyle = glowColor;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(endX, endY);
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }

    // Draw dark crack on top
    ctx.strokeStyle = crackColor;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(endX, endY);
    ctx.lineWidth = isVolcanic ? 1.5 : 1.0;
    ctx.stroke();
  }
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
