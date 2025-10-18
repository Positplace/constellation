import React from "react";
import { useGameStore } from "../../store/gameStore";

interface PlanetLayerControlsProps {
  onToggleContinents: (enabled: boolean) => void;
  onToggleCities: (enabled: boolean) => void;
  onToggleAtmosphere: (enabled: boolean) => void;
  onToggleClouds: (enabled: boolean) => void;
}

const PlanetLayerControls: React.FC<PlanetLayerControlsProps> = ({
  onToggleContinents,
  onToggleCities,
  onToggleAtmosphere,
  onToggleClouds,
}) => {
  const { layers } = useGameStore();

  const toggleLayer = (layer: keyof typeof layers) => {
    const newState = !layers[layer];
    
    // Call the appropriate callback
    switch (layer) {
      case 'continents':
        onToggleContinents(newState);
        break;
      case 'cities':
        onToggleCities(newState);
        break;
      case 'atmosphere':
        onToggleAtmosphere(newState);
        break;
      case 'clouds':
        onToggleClouds(newState);
        break;
    }
  };

  return (
    <div className="bg-black bg-opacity-70 text-white p-4 rounded-lg backdrop-blur-sm">
      <h3 className="text-sm font-semibold mb-3 text-center">Planet Layers</h3>
      <div className="space-y-2">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={layers.continents}
            onChange={() => toggleLayer('continents')}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm">🌍 Continents</span>
        </label>
        
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={layers.cities}
            onChange={() => toggleLayer('cities')}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm">🏙️ Cities</span>
        </label>
        
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={layers.atmosphere}
            onChange={() => toggleLayer('atmosphere')}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm">🌫️ Atmosphere</span>
        </label>
        
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={layers.clouds}
            onChange={() => toggleLayer('clouds')}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm">☁️ Clouds</span>
        </label>
      </div>
    </div>
  );
};

export default PlanetLayerControls;
