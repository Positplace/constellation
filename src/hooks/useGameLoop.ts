import { useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { useSocket } from "./useSocket";

export const useGameLoop = () => {
  const { isPlaying, gameTime, updateGameTime } = useGameStore();
  const { updateGameTimeSocket } = useSocket();
  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  const lastSyncTimeRef = useRef<number>(0);

  useEffect(() => {
    const gameLoop = (currentTime: number) => {
      if (isPlaying) {
        const deltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
        lastTimeRef.current = currentTime;

        // Update game time
        const newGameTime = gameTime + deltaTime;
        updateGameTime(newGameTime);

        // Sync with server every 5 seconds
        if (currentTime - lastSyncTimeRef.current > 5000) {
          updateGameTimeSocket(newGameTime);
          lastSyncTimeRef.current = currentTime;
        }
      } else {
        lastTimeRef.current = currentTime;
      }

      // Continue the loop
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    // Start the game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, gameTime, updateGameTime, updateGameTimeSocket]);

  // Reset lastTime when play state changes
  useEffect(() => {
    lastTimeRef.current = performance.now();
    lastSyncTimeRef.current = performance.now();
  }, [isPlaying]);
};
