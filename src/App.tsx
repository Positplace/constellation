import React from "react";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import EarthGlobe from "./components/Globe/EarthGlobe";
import SolarSystemView from "./components/SolarSystem/SolarSystemView";
import ConstellationView from "./components/Constellation/ConstellationView";
import ViewToggle from "./components/UI/ViewToggle";
import HUD from "./components/UI/HUD";
import CountryPanel from "./components/UI/CountryPanel";
import ConnectionDialog from "./components/UI/ConnectionDialog";
import { useGameStore } from "./store/gameStore";
import { useMultiplayerStore } from "./store/multiplayerStore";

function App() {
  const { activeView } = useGameStore();
  const { isConnected } = useMultiplayerStore();

  const renderScene = () => {
    switch (activeView) {
      case "earth":
        return <EarthGlobe />;
      case "solar":
        return <SolarSystemView />;
      case "constellation":
        return <ConstellationView />;
      default:
        return <EarthGlobe />;
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

      {isConnected && <ViewToggle />}
      {isConnected && <HUD />}
      {isConnected && <CountryPanel />}
      <ConnectionDialog />
    </div>
  );
}

export default App;
