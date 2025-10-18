import { useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { useSocket } from "./useSocket";

export const useGameLoop = () => {
  const { isPlaying, gameTime, updateGameTime, timeScale, setTimeScale } = useGameStore();
  const { updateGameTimeSocket } = useSocket();
  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  const lastSyncTimeRef = useRef<number>(0);

  useEffect(() => {
    const gameLoop = (currentTime: number) => {
      // Smoothly ease timeScale toward target (1 when playing, 0 when paused)
      const target = isPlaying ? 1 : 0;
      const easeSpeed = 3; // higher = snappier
      const dt = (currentTime - lastTimeRef.current) / 1000;
      const newScale =
        target + (timeScale - target) * Math.exp(-easeSpeed * Math.max(0, dt));
      setTimeScale(newScale);

      if (isPlaying || newScale > 0.0001) {
        const deltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
        lastTimeRef.current = currentTime;

        // Update game time
        const newGameTime = gameTime + deltaTime * newScale;
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
