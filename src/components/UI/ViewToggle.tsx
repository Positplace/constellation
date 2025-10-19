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
    setCurrentSystem,
    setSelectedPlanet,
  } = useGameStore();
  const { changeView, emitCurrentSystemChanged } = useSocket();
  const { isConnected } = useMultiplayerStore();
  const [isHomeFocused, setIsHomeFocused] = React.useState(false);

  // Listen for Home focus state changes
  React.useEffect(() => {
    const handleHomeFocus = () => setIsHomeFocused(true);
    const handleResetFocus = () => setIsHomeFocused(false);

    window.addEventListener("focusHomePlanet", handleHomeFocus);
    window.addEventListener("resetSolarView", handleResetFocus);
    window.addEventListener("resetHomeFocus", handleResetFocus);

    return () => {
      window.removeEventListener("focusHomePlanet", handleHomeFocus);
      window.removeEventListener("resetSolarView", handleResetFocus);
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
                // Always switch to first solar system (home system)
                if (solarSystems.length > 0) {
                  const homeSystem = solarSystems[0];
                  setCurrentSystem(homeSystem.id);
                  if (isConnected) {
                    emitCurrentSystemChanged(homeSystem.id);
                  }
                }
                // Focus on Home planet in solar system
                setActiveView("solar");
                changeView("solar");
                window.dispatchEvent(new CustomEvent("focusHomePlanet"));
              } else if (view.key === "solar") {
                // Handle solar view switching
                if (activeView === "solar") {
                  // If clicking the active System tab, emit reset event
                  window.dispatchEvent(new CustomEvent("resetSolarView"));
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
                // Clear planet selection when switching to constellation view
                if (view.key === "constellation") {
                  setSelectedPlanet(null);
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
