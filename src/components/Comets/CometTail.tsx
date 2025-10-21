import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CometData } from "../../types/comet.types";

interface CometTailProps {
  comet: CometData;
  position: THREE.Vector3;
  starPosition: THREE.Vector3;
}

/**
 * Renders a single beautiful tail for a comet
 * Simplified from dual tails to a single elegant plume
 */
const CometTail: React.FC<CometTailProps> = ({
  comet,
  position,
  starPosition,
}) => {
  const tailRef = useRef<THREE.Mesh>(null);

  // Calculate direction away from star
  const directionFromStar = useMemo(() => {
    const dir = new THREE.Vector3()
      .subVectors(position, starPosition)
      .normalize();
    return dir;
  }, [position, starPosition]);

  // Only render tail if intensity is significant
  const shouldRenderTail = comet.tail.intensity > 0.05;

  // Create single tail geometry (slightly curved cone)
  const tailGeometry = useMemo(() => {
    if (!shouldRenderTail) return null;

    const length = comet.tail.length * 1.3;
    const baseWidth = 0.1;
    const segments = 32;

    const geometry = new THREE.ConeGeometry(
      baseWidth,
      length,
      segments,
      8,
      true
    );

    // Apply subtle curve to tail
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const normalizedY = (y + length / 2) / length; // 0 to 1 from base to tip

      // Very gentle curve
      const curveAmount = normalizedY * normalizedY * 0.15;
      positions.setX(i, positions.getX(i) + curveAmount);
    }
    positions.needsUpdate = true;

    return geometry;
  }, [comet.tail.length, shouldRenderTail]);

  // Create beautiful gradient texture blending blue and white/yellow
  const tailTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    // Create radial gradient with mixed colors
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);

    // Blend of cyan-white-yellow for a single beautiful tail
    gradient.addColorStop(0, "rgba(200, 230, 255, 1)"); // Bright cyan-white at center
    gradient.addColorStop(0.3, "rgba(150, 200, 255, 0.8)"); // Light blue
    gradient.addColorStop(0.6, "rgba(255, 240, 200, 0.4)"); // Yellowish tint
    gradient.addColorStop(1, "rgba(200, 220, 255, 0)"); // Fade to transparent

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  useFrame(() => {
    if (!shouldRenderTail || !tailRef.current) return;

    // Orient tail away from star
    // The cone's default orientation points along -Y axis after initial rotation
    // We want it to point in the directionFromStar direction
    const coneDirection = new THREE.Vector3(0, -1, 0); // Cone points down by default
    const targetQuaternion = new THREE.Quaternion();
    targetQuaternion.setFromUnitVectors(coneDirection, directionFromStar);

    tailRef.current.quaternion.copy(targetQuaternion);

    // Very subtle wobble around the direction axis
    const wobbleAxis = directionFromStar.clone();
    const wobbleAngle = Math.sin(Date.now() * 0.0008) * 0.03;
    const wobbleQuat = new THREE.Quaternion();
    wobbleQuat.setFromAxisAngle(wobbleAxis, wobbleAngle);
    tailRef.current.quaternion.multiply(wobbleQuat);
  });

  if (!shouldRenderTail || !tailGeometry) {
    return null;
  }

  return (
    <group position={position}>
      {/* Single beautiful tail */}
      <mesh ref={tailRef} geometry={tailGeometry} position={[0, 0, 0]}>
        <meshBasicMaterial
          color="#c8e6ff"
          transparent
          opacity={comet.tail.intensity * 0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          map={tailTexture}
        />
      </mesh>
    </group>
  );
};

export default CometTail;
