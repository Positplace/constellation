import React from "react";
import { useGameStore } from "../../store/gameStore";
import { useMultiplayerStore } from "../../store/multiplayerStore";
import { useSocket } from "../../hooks/useSocket";
import { ViewType } from "../../types/game.types";

const ViewToggle: React.FC = () => {
  const {
    activeView,
    setActiveView,
    solarSystems,
    currentSystemId,
    setCurrentSystem,
    selectedObject,
    setSelectedObject,
  } = useGameStore();
  const { changeView, emitCurrentSystemChanged } = useSocket();
  const { isConnected, playerHomeSystemId, playerHomePlanetId } =
    useMultiplayerStore();
  const [isHomeFocused, setIsHomeFocused] = React.useState(false);

  // Listen for Home focus state changes
  React.useEffect(() => {
    const handleHomeFocus = () => setIsHomeFocused(true);
    const handleResetFocus = () => setIsHomeFocused(false);

    window.addEventListener("focusHomePlanet", handleHomeFocus);
    window.addEventListener("resetHomeFocus", handleResetFocus);

    return () => {
      window.removeEventListener("focusHomePlanet", handleHomeFocus);
      window.removeEventListener("resetHomeFocus", handleResetFocus);
    };
  }, []);

  const views: { key: ViewType | "home"; label: string; icon: string }[] = [
    { key: "home", label: "Home", icon: "🌍" },
    { key: "solar", label: "System", icon: "☀️" },
    { key: "constellation", label: "Constellation", icon: "🌌" },
  ];

  return (
    <div className="absolute top-4 left-4 z-50">
      <div className="glass-panel p-2 flex gap-2">
        {views.map((view) => (
          <button
            key={view.key}
            onClick={() => {
              if (view.key === "home") {
                // Switch to player's home system
                const homeSystemId = playerHomeSystemId || solarSystems[0]?.id;
                if (homeSystemId) {
                  setCurrentSystem(homeSystemId);
                  if (isConnected) {
                    emitCurrentSystemChanged(homeSystemId);
                  }
                  console.log("🏠 Navigating to home system:", homeSystemId);
                }
                // Focus on Home planet in solar system
                setActiveView("solar");
                changeView("solar");
                window.dispatchEvent(
                  new CustomEvent("focusHomePlanet", {
                    detail: { planetId: playerHomePlanetId },
                  })
                );
              } else if (view.key === "solar") {
                // Handle solar view switching
                if (activeView === "solar") {
                  // If clicking the active System tab, select the sun of the current system
                  const currentSystem = solarSystems.find(
                    (s) => s.id === currentSystemId
                  );
                  if (currentSystem) {
                    setSelectedObject({
                      id: currentSystem.star.id,
                      type: "sun",
                    });
                  }
                  setIsHomeFocused(false);
                } else {
                  // Switching to solar view
                  setActiveView("solar");
                  changeView("solar");
                  setIsHomeFocused(false);
                }
              } else {
                // Handle other views (constellation, etc.)
                // Reset home focus when switching views
                if (view.key !== "solar") {
                  setIsHomeFocused(false);
                }
                // Clear selection when switching to constellation view
                if (view.key === "constellation") {
                  setSelectedObject(null);
                }
                setActiveView(view.key);
                changeView(view.key);
              }
            }}
            className={`px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 ${
              (view.key === "home" &&
                isHomeFocused &&
                activeView === "solar") ||
              (view.key === "solar" &&
                activeView === "solar" &&
                !isHomeFocused) ||
              (view.key !== "home" &&
                view.key !== "solar" &&
                activeView === view.key)
                ? "bg-space-600 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
            }`}
          >
            <span className="text-lg">{view.icon}</span>
            <span className="text-sm font-medium">{view.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ViewToggle;
