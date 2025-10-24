import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PlanetData } from "../../types/planet.types";
import { generateSurfaceTextures } from "../../utils/textureGenerators";

interface CityLightsProps {
  planet: PlanetData;
  renderScale?: number;
  sunPosition: THREE.Vector3;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Renders cities on planets as glowing lights on the dark side
 * and bright visible markers on the lit side
 */
export const CityLights: React.FC<CityLightsProps> = ({
  planet,
  renderScale = 0.16,
  sunPosition,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Only render cities if they exist
  const cities = planet.surface?.cities || [];

  if (cities.length === 0) {
    return null;
  }

  const radiusUnits = (planet.radius / EARTH_RADIUS_KM) * renderScale;

  // Get the same displacement map used by the planet mesh
  const { displacementMap } = useMemo(
    () => generateSurfaceTextures(planet),
    [planet.id]
  );

  // Cleanup displacement map
  useEffect(() => {
    return () => {
      displacementMap.dispose();
    };
  }, [displacementMap]);

  // Create city lights texture
  const cityLightsTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Fill with black (transparent areas)
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Helper to convert hex color to rgba
    const hexToRgba = (hex: string, alpha: number): string => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Draw each city as a glowing point
    cities.forEach((city) => {
      // Convert lat/lng to texture coordinates
      // lng: -180 to 180 -> 0 to 1
      // lat: -90 to 90 -> 0 to 1 (inverted for texture space)
      const u = (city.lng + 180) / 360;
      const v = 1 - (city.lat + 90) / 180; // Invert Y for texture

      const x = u * canvas.width;
      const y = v * canvas.height;

      // Size based on city size and population (increased for better visibility)
      const radius = Math.max(3, city.size * 80);

      // Create gradient for glow effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

      // Use city's glow color or default to warm yellow
      const color = city.glowColor || "#ffdd88";
      const intensity = city.glowIntensity || 1.0;

      gradient.addColorStop(0, `rgba(255, 255, 200, ${intensity})`);
      gradient.addColorStop(0.3, hexToRgba(color, intensity * 0.8));
      gradient.addColorStop(0.6, hexToRgba(color, intensity * 0.5));
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

      // Add extra bright core for larger cities
      if (city.type === "metropolis" || city.type === "city") {
        const coreGradient = ctx.createRadialGradient(
          x,
          y,
          0,
          x,
          y,
          radius * 0.3
        );
        coreGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        coreGradient.addColorStop(1, "rgba(255, 255, 200, 0)");

        ctx.fillStyle = coreGradient;
        ctx.fillRect(
          x - radius * 0.3,
          y - radius * 0.3,
          radius * 0.6,
          radius * 0.6
        );
      }
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [cities, planet.id, planet.name]);

  // Cleanup texture
  useEffect(() => {
    return () => {
      cityLightsTexture.dispose();
    };
  }, [cityLightsTexture]);

  // Custom shader to show cities on both lit and dark sides
  // Dark side: Glowing warm lights
  // Lit side: Bright visible markers
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        cityLights: { value: cityLightsTexture },
        sunPosition: { value: sunPosition.clone() },
        displacementMap: { value: displacementMap },
        displacementScale: { value: 0.015 }, // Match the planet mesh
      },
      vertexShader: `
        uniform sampler2D displacementMap;
        uniform float displacementScale;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          
          // Sample displacement map to get elevation
          float displacement = texture2D(displacementMap, uv).r;
          
          // Apply displacement along the normal
          vec3 displacedPosition = position + normal * displacement * displacementScale;
          
          // Transform normal to WORLD SPACE (not view space) so lighting is independent of camera
          vNormal = normalize(mat3(modelMatrix) * normal);
          vPosition = (modelMatrix * vec4(displacedPosition, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D cityLights;
        uniform vec3 sunPosition;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          // Calculate light direction
          vec3 lightDir = normalize(sunPosition - vPosition);
          
          // Calculate how much the surface faces the sun (-1 to 1)
          float sunAlignment = dot(vNormal, lightDir);
          
          // Sample city lights texture
          vec4 lights = texture2D(cityLights, vUv);
          
          // If no city here, discard early
          if (lights.a < 0.01) discard;
          
          // Dark side: Show warm glowing lights
          // Starts glowing at dusk (sunAlignment ~0.2) and fully bright at night
          float darknessFactor = smoothstep(0.2, -0.15, sunAlignment);
          vec3 nightLights = lights.rgb * darknessFactor;
          
          // Lit side: Barely visible, only in the transition zone (twilight)
          // Very subtle so cities blend into the surface during day
          float twilightFactor = smoothstep(-0.15, 0.05, sunAlignment) * 
                                 (1.0 - smoothstep(0.05, 0.25, sunAlignment));
          vec3 dayMarkers = lights.rgb * twilightFactor * 0.15; // Very subtle
          
          // Combine both renderings
          vec3 finalColor = nightLights + dayMarkers;
          
          // Alpha: Strong on dark side, very weak on lit side
          float finalAlpha = lights.a * (darknessFactor + twilightFactor * 0.1);
          
          // Discard if too faint
          if (finalAlpha < 0.02) discard;
          
          gl_FragColor = vec4(finalColor, finalAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });
  }, [cityLightsTexture, sunPosition, displacementMap]);

  // Update sun position uniform every frame
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.sunPosition.value.copy(sunPosition);
    }
  });

  // Cleanup shader material
  useEffect(() => {
    return () => {
      shaderMaterial.dispose();
    };
  }, [shaderMaterial]);

  return (
    <mesh
      ref={meshRef}
      raycast={() => null} // Non-interactive
    >
      <sphereGeometry args={[radiusUnits * 1.002, 128, 128]} />
      <primitive ref={materialRef} object={shaderMaterial} attach="material" />
    </mesh>
  );
};
