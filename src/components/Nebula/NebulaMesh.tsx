import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NebulaData } from "../../types/nebula.types";

interface NebulaMeshProps {
  nebula: NebulaData;
  timeScale: number;
}

/**
 * Individual nebula mesh with animated volumetric fog effect
 */
const NebulaMesh: React.FC<NebulaMeshProps> = ({ nebula, timeScale }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Create custom shader material for volumetric cloud effect
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(nebula.color) },
        color2: {
          value: new THREE.Color(nebula.secondaryColor || nebula.color),
        },
        opacity: { value: nebula.opacity * 1.8 }, // Boost opacity for visibility
        density: { value: nebula.density },
        glowIntensity: { value: nebula.glowIntensity * 2.5 }, // Boost glow
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform float opacity;
        uniform float density;
        uniform float glowIntensity;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        
        // Simplex noise function (simplified)
        float noise(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
        }
        
        // Fractal Brownian Motion for cloud-like appearance
        float fbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          
          for(int i = 0; i < 4; i++) {
            value += amplitude * noise(p * frequency);
            frequency *= 2.0;
            amplitude *= 0.5;
          }
          
          return value;
        }
        
        void main() {
          // Animated position for moving clouds
          vec3 animPos = vPosition + vec3(time * 0.1, time * 0.05, time * 0.08);
          
          // Generate cloud pattern using FBM
          float cloudPattern = fbm(animPos * 0.5);
          
          // Distance from center for radial falloff
          float distFromCenter = length(vPosition) / 1.0;
          float radialFalloff = 1.0 - smoothstep(0.5, 1.0, distFromCenter);
          
          // Combine patterns
          float cloudDensity = cloudPattern * density * radialFalloff;
          
          // Mix colors based on density
          vec3 finalColor = mix(color1, color2, cloudPattern);
          
          // Add glow effect at the edges
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          finalColor += finalColor * fresnel * glowIntensity;
          
          // Final opacity
          float finalOpacity = cloudDensity * opacity;
          
          gl_FragColor = vec4(finalColor, finalOpacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [
    nebula.color,
    nebula.secondaryColor,
    nebula.opacity,
    nebula.density,
    nebula.glowIntensity,
  ]);

  // Animate the nebula
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value +=
        delta * nebula.animationSpeed * timeScale;
    }

    // Slow rotation
    if (meshRef.current) {
      meshRef.current.rotation.x +=
        delta * nebula.animationSpeed * 0.02 * timeScale;
      meshRef.current.rotation.y +=
        delta * nebula.animationSpeed * 0.03 * timeScale;
      meshRef.current.rotation.z +=
        delta * nebula.animationSpeed * 0.01 * timeScale;
    }
  });

  // Create multiple layers for complexity (reduced opacity for subtler effect)
  const layers = [
    { scale: 1.0, opacity: 0.4, offset: [0, 0, 0] },
    { scale: 0.7, opacity: 0.3, offset: [nebula.size * 0.3, 0, 0] },
    {
      scale: 0.5,
      opacity: 0.25,
      offset: [-nebula.size * 0.2, nebula.size * 0.2, 0],
    },
    {
      scale: 0.6,
      opacity: 0.2,
      offset: [0, -nebula.size * 0.25, nebula.size * 0.15],
    },
    {
      scale: 0.4,
      opacity: 0.15,
      offset: [nebula.size * 0.15, 0, -nebula.size * 0.2],
    },
  ];

  const secondaryColor = new THREE.Color(nebula.secondaryColor || nebula.color);

  // Memoize geometries to prevent recreation
  const nebulaGeometry = useMemo(
    () => new THREE.SphereGeometry(nebula.size, 32, 32),
    [nebula.size]
  );
  const coreGeometry = useMemo(
    () => new THREE.SphereGeometry(nebula.size, 16, 16),
    [nebula.size]
  );

  // Dispose shader material and geometries on cleanup
  useEffect(() => {
    return () => {
      shaderMaterial.dispose();
      nebulaGeometry.dispose();
      coreGeometry.dispose();
    };
  }, [shaderMaterial, nebulaGeometry, coreGeometry]);

  return (
    <group ref={meshRef} position={nebula.position} rotation={nebula.rotation}>
      {layers.map((layer, i) => (
        <mesh
          key={i}
          position={layer.offset as [number, number, number]}
          scale={[
            layer.scale * (0.9 + Math.sin(i * 0.5) * 0.2),
            layer.scale * (1.0 + Math.cos(i * 0.7) * 0.15),
            layer.scale * (0.95 + Math.sin(i * 0.3) * 0.1),
          ]}
        >
          <primitive object={nebulaGeometry} />
          <meshBasicMaterial
            color={i < 2 ? nebula.color : secondaryColor}
            transparent={true}
            opacity={nebula.opacity * layer.opacity * 0.3}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Subtle bright core */}
      <mesh scale={0.15}>
        <primitive object={coreGeometry} />
        <meshBasicMaterial
          color="#ffffff"
          transparent={true}
          opacity={nebula.opacity * 0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

export default NebulaMesh;
