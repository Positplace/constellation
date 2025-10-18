import React from "react";
import { useGameStore } from "../../store/gameStore";
import { useSocket } from "../../hooks/useSocket";

const CountryPanel: React.FC = () => {
  const { selectedCountry, setSelectedCountry } = useGameStore();
  const { colonizeCountry } = useSocket();

  if (!selectedCountry) return null;

  const formatNumber = (num: number): string => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 w-80">
      <div className="glass-panel p-6 space-y-4 animate-slide-in">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white">
              {selectedCountry.name}
            </h2>
            <p className="text-sm text-white/70">{selectedCountry.code}</p>
          </div>
          <button
            onClick={() => setSelectedCountry(null)}
            className="text-white/70 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-white/70">Population:</span>
            <span className="text-white font-medium">
              {formatNumber(selectedCountry.population)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-white/70">GDP:</span>
            <span className="text-white font-medium">
              ${formatNumber(selectedCountry.gdp)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-white/70">Tech Level:</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-space-400 to-space-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${(selectedCountry.techLevel / 10) * 100}%`,
                  }}
                />
              </div>
              <span className="text-white font-medium">
                {selectedCountry.techLevel}/10
              </span>
            </div>
          </div>

          <div className="flex justify-between">
            <span className="text-white/70">Research Output:</span>
            <span className="text-white font-medium">
              {selectedCountry.researchOutput}/turn
            </span>
          </div>
        </div>

        {selectedCountry.controlledBy && (
          <div className="border-t border-white/20 pt-3">
            <div className="text-sm text-white/70">Controlled by:</div>
            <div className="text-sm font-medium text-space-400">
              Player {selectedCountry.controlledBy}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => colonizeCountry(selectedCountry.id)}
            className="flex-1 bg-space-600 hover:bg-space-700 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium"
          >
            Colonize
          </button>
          <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium">
            Research
          </button>
        </div>
      </div>
    </div>
  );
};

export default CountryPanel;
