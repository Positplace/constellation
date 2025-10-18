import React from "react";
import { useGameStore } from "../../store/gameStore";
import { useSocket } from "../../hooks/useSocket";
import { ViewType } from "../../types/game.types";

const ViewToggle: React.FC = () => {
  const { activeView, setActiveView } = useGameStore();
  const { changeView } = useSocket();

  const views: { key: ViewType; label: string; icon: string }[] = [
    { key: "earth", label: "Home", icon: "🌍" },
    { key: "solar", label: "System", icon: "☀️" },
    { key: "constellation", label: "Constellation", icon: "🌌" },
  ];

  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="glass-panel p-2 flex gap-2">
        {views.map((view) => (
          <button
            key={view.key}
            onClick={() => {
              // If clicking the active System tab, emit reset event
              if (view.key === "solar" && activeView === "solar") {
                window.dispatchEvent(new CustomEvent("resetSolarView"));
              }
              setActiveView(view.key);
              changeView(view.key);
            }}
            className={`px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 ${
              activeView === view.key
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
