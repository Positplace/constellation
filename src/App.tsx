import React, { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import SolarSystemView from "./components/SolarSystem/SolarSystemView";
import ConstellationView from "./components/Constellation/ConstellationView";
import ViewToggle from "./components/UI/ViewToggle";
import HUD from "./components/UI/HUD";
import CountryPanel from "./components/UI/CountryPanel";
import ConnectionDialog from "./components/UI/ConnectionDialog";
import { useGameStore } from "./store/gameStore";
import { useMultiplayerStore } from "./store/multiplayerStore";
import { useGameLoop } from "./hooks/useGameLoop";

function App() {
  const { activeView, togglePlayPause } = useGameStore();
  const { isConnected } = useMultiplayerStore();

  // Start the game loop
  useGameLoop();

  // Spacebar toggles play/pause
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      const target = e.target as HTMLElement;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isTyping) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlayPause]);

  const renderScene = () => {
    switch (activeView) {
      case "solar":
        return <SolarSystemView />;
      case "constellation":
        return <ConstellationView />;
      default:
        return <SolarSystemView />;
    }
  };

  return (
    <div className="w-full h-full relative space-gradient">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>{renderScene()}</Suspense>
      </Canvas>

      <ViewToggle />
      <HUD />
      {isConnected && <CountryPanel />}
      <ConnectionDialog />
    </div>
  );
}

export default App;
