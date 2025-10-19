import React, { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "../../store/gameStore";
import Spaceship from "./Spaceship";
import SpaceshipTrail from "./SpaceshipTrail";

const SpaceshipManager: React.FC = () => {
  const { spaceships, updateSpaceships, isPlaying } = useGameStore();

  // Update spaceships every frame when playing
  useFrame(() => {
    if (isPlaying && spaceships.length > 0) {
      updateSpaceships();
    }
  });

  // Don't render anything if no spaceships
  if (spaceships.length === 0) {
    return null;
  }

  return (
    <group>
      {spaceships.map((spaceship) => (
        <group key={spaceship.id}>
          <Spaceship spaceship={spaceship} />
          <SpaceshipTrail spaceship={spaceship} />
        </group>
      ))}
    </group>
  );
};

export default SpaceshipManager;
