import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Line } from "@react-three/drei";

interface TunnelConnectionProps {
  from: [number, number, number];
  to: [number, number, number];
  status: "planned" | "under_construction" | "active";
}

const TunnelConnection: React.FC<TunnelConnectionProps> = ({
  from,
  to,
  status,
}) => {
  const lineRef = useRef<THREE.Line>(null);

  // Determine color and opacity based on status
  const { color, opacity } = useMemo(() => {
    switch (status) {
      case "active":
        return { color: "#ffffff", opacity: 0.8 };
      case "under_construction":
        return { color: "#ffaa00", opacity: 0.5 };
      case "planned":
        return { color: "#666666", opacity: 0.3 };
      default:
        return { color: "#ffffff", opacity: 0.8 };
    }
  }, [status]);

  // Animate active tunnels with pulsing effect
  useFrame((state) => {
    if (lineRef.current && status === "active") {
      const pulse = Math.sin(state.clock.getElapsedTime() * 2) * 0.2 + 0.8;
      (lineRef.current.material as THREE.LineBasicMaterial).opacity = pulse;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={[from, to]}
      color={color}
      lineWidth={2}
      transparent
      opacity={opacity}
    />
  );
};

export default TunnelConnection;
