import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { StarType } from "../../types/game.types";

// Create star textures
function createStarTexture(spiky = false): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;

  const centerX = 32;
  const centerY = 32;

  if (spiky) {
    // Draw a spiky star
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, 64, 64);

    // Create radial gradient for glow
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      32
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.1, "rgba(255, 255, 255, 0.9)");
    gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.5)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    // Add cross spikes
    ctx.fillStyle = "white";
    ctx.globalAlpha = 0.8;

    // Horizontal spike
    ctx.fillRect(0, centerY - 1, 64, 2);
    // Vertical spike
    ctx.fillRect(centerX - 1, 0, 2, 64);

    // Diagonal spikes
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-32, -0.5, 64, 1);
    ctx.fillRect(-0.5, -32, 1, 64);
    ctx.restore();
  } else {
    // Draw a round glowing star
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      32
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.4)");
    gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.1)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

interface StarfieldProps {
  starType?: StarType;
  density?: number;
}

// Color palettes for different star types - representing the ambient light from the star
const STAR_TYPE_PALETTES = {
  red_dwarf: {
    nebula: new THREE.Color(0x1a0505),
    starfield: new THREE.Color(0xffdddd),
    accent: new THREE.Color(0xff6b6b),
    fogColor: new THREE.Color(0x0a0202),
  },
  orange_star: {
    nebula: new THREE.Color(0x1a0f05),
    starfield: new THREE.Color(0xfff5dd),
    accent: new THREE.Color(0xff8c42),
    fogColor: new THREE.Color(0x0f0a05),
  },
  yellow_star: {
    nebula: new THREE.Color(0x0a0a10),
    starfield: new THREE.Color(0xffffff),
    accent: new THREE.Color(0xffd700),
    fogColor: new THREE.Color(0x050508),
  },
  white_star: {
    nebula: new THREE.Color(0x0a0a15),
    starfield: new THREE.Color(0xf0f8ff),
    accent: new THREE.Color(0xe0e8ff),
    fogColor: new THREE.Color(0x05050a),
  },
  blue_giant: {
    nebula: new THREE.Color(0x050a15),
    starfield: new THREE.Color(0xddeeff),
    accent: new THREE.Color(0x4a9eff),
    fogColor: new THREE.Color(0x02050a),
  },
  red_giant: {
    nebula: new THREE.Color(0x1f0505),
    starfield: new THREE.Color(0xffcccc),
    accent: new THREE.Color(0xff4444),
    fogColor: new THREE.Color(0x0f0202),
  },
  white_dwarf: {
    nebula: new THREE.Color(0x0a0a0a),
    starfield: new THREE.Color(0xf0f0f0),
    accent: new THREE.Color(0xe8e8e8),
    fogColor: new THREE.Color(0x050505),
  },
  binary_star: {
    nebula: new THREE.Color(0x0a0810),
    starfield: new THREE.Color(0xffeedd),
    accent: new THREE.Color(0xff9955),
    fogColor: new THREE.Color(0x050508),
  },
  black_hole: {
    nebula: new THREE.Color(0x0a0205),
    starfield: new THREE.Color(0xddddff),
    accent: new THREE.Color(0xff6b35),
    fogColor: new THREE.Color(0x000000),
  },
};

const Starfield: React.FC<StarfieldProps> = ({
  starType = "yellow_star",
  density = 8000,
}) => {
  const starsRef = useRef<THREE.Points>(null);
  const nebulaRef = useRef<THREE.Points>(null);
  const milkyWayRef = useRef<THREE.Points>(null);

  const palette =
    STAR_TYPE_PALETTES[starType] || STAR_TYPE_PALETTES.yellow_star;

  // Create star textures once
  const starTextures = useMemo(() => {
    return {
      round: createStarTexture(false),
      spiky: createStarTexture(true),
    };
  }, []);

  // Generate main starfield
  const starGeometry = useMemo(() => {
    const positions = new Float32Array(density * 3);
    const colors = new Float32Array(density * 3);
    const sizes = new Float32Array(density);

    const color = new THREE.Color();

    for (let i = 0; i < density; i++) {
      const i3 = i * 3;

      // Distribute stars in a large sphere
      const radius = 100 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Star colors - mix of white and accent color, more subtle
      const useAccent = Math.random() < 0.08;
      if (useAccent) {
        color.copy(palette.accent);
        color.multiplyScalar(0.5); // Dimmer accent stars
      } else {
        color.copy(palette.starfield);
        // Vary the brightness - much dimmer
        const brightness = 0.3 + Math.random() * 0.3;
        color.multiplyScalar(brightness);
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      // Vary star sizes - smaller overall
      sizes[i] =
        Math.random() < 0.03
          ? 1.5 + Math.random() * 1.5
          : 0.3 + Math.random() * 0.8;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    return geometry;
  }, [density, palette]);

  // Generate Milky Way band
  const milkyWayGeometry = useMemo(() => {
    const count = 4000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Create a band across the sky
      const angle = Math.random() * Math.PI * 2;
      const radius = 150 + Math.random() * 350;

      // Concentrate in a band (Milky Way disk)
      const bandWidth = 0.4;
      const bandOffset = Math.sin(angle * 3) * 0.2; // Slight warping
      const y = (Math.random() - 0.5) * bandWidth + bandOffset;

      const distance = Math.sqrt(1 - y * y);
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      positions[i3] = x * radius;
      positions[i3 + 1] = y * radius;
      positions[i3 + 2] = z * radius;

      // Milky Way colors - concentrated nebula colors, more subtle
      const nebulaDensity = 1 - Math.abs(y) / bandWidth;
      color.lerpColors(palette.starfield, palette.nebula, 1 - nebulaDensity);

      // Add some variation - dimmer
      const brightness = 0.2 + Math.random() * 0.4;
      color.multiplyScalar(brightness);

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = 0.3 + Math.random() * 0.8;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    return geometry;
  }, [palette]);

  // Generate nebula clouds
  const nebulaGeometry = useMemo(() => {
    const count = 1000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Create nebula clusters
      const clusterAngle = Math.random() * Math.PI * 2;
      const clusterDist = 200 + Math.random() * 300;
      const spread = 30 + Math.random() * 50;

      positions[i3] =
        Math.cos(clusterAngle) * clusterDist + (Math.random() - 0.5) * spread;
      positions[i3 + 1] = (Math.random() - 0.5) * spread * 0.5;
      positions[i3 + 2] =
        Math.sin(clusterAngle) * clusterDist + (Math.random() - 0.5) * spread;

      // Nebula colors - much more subtle
      color.copy(palette.nebula);
      color.lerp(palette.accent, Math.random() * 0.2);
      const brightness = 0.1 + Math.random() * 0.2;
      color.multiplyScalar(brightness);

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      // Larger, softer particles for nebula
      sizes[i] = 2 + Math.random() * 5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    return geometry;
  }, [palette]);

  // Slow rotation for parallax effect
  useFrame((_state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.002;
    }
    if (milkyWayRef.current) {
      milkyWayRef.current.rotation.y += delta * 0.001;
    }
    if (nebulaRef.current) {
      nebulaRef.current.rotation.y += delta * 0.0005;
    }
  });

  return (
    <group>
      {/* Fog for depth */}
      <fog attach="fog" args={[palette.fogColor, 50, 600]} />

      {/* Main starfield - use spiky star texture */}
      <points ref={starsRef} geometry={starGeometry}>
        <pointsMaterial
          size={1}
          map={starTextures.spiky}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Milky Way band - use round star texture */}
      <points ref={milkyWayRef} geometry={milkyWayGeometry}>
        <pointsMaterial
          size={1.2}
          map={starTextures.round}
          vertexColors
          transparent
          opacity={0.5}
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Nebula clouds - use round texture */}
      <points ref={nebulaRef} geometry={nebulaGeometry}>
        <pointsMaterial
          size={4}
          map={starTextures.round}
          vertexColors
          transparent
          opacity={0.25}
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

export default Starfield;
