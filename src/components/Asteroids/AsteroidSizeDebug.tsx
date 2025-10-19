import React, { useState } from "react";
import { AsteroidMesh } from "./AsteroidMesh";
import { generateAsteroid } from "../../utils/asteroidFactory";
import {
  SIMPLE_ASTEROID_SIZES,
  getSimpleRenderScale,
} from "../../utils/asteroidSizingSimple";

/**
 * Debug component to test asteroid sizing with different scales
 */
export const AsteroidSizeDebug: React.FC = () => {
  const [testScale, setTestScale] = useState(
    SIMPLE_ASTEROID_SIZES.RENDER_SCALE
  );

  // Generate a test asteroid
  const testAsteroid = generateAsteroid({
    beltType: "inner",
    orbitalDistance: 2.5,
    seed: 12345,
  });

  const scaleOptions = [
    { label: "CURRENT", value: SIMPLE_ASTEROID_SIZES.RENDER_SCALE },
    { label: "10x SMALLER", value: SIMPLE_ASTEROID_SIZES.RENDER_SCALE * 0.1 },
    { label: "100x SMALLER", value: SIMPLE_ASTEROID_SIZES.RENDER_SCALE * 0.01 },
  ];

  return (
    <div className="fixed top-20 right-4 bg-black/80 text-white p-4 rounded">
      <h3 className="text-lg font-bold mb-2">Asteroid Size Debug</h3>

      <div className="mb-4">
        <label className="block text-sm mb-2">Render Scale:</label>
        <select
          value={testScale}
          onChange={(e) => setTestScale(parseFloat(e.target.value))}
          className="bg-gray-700 text-white px-2 py-1 rounded"
        >
          {scaleOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label} ({option.value})
            </option>
          ))}
        </select>
      </div>

      <div className="text-xs space-y-1">
        <div>Asteroid Size: {testAsteroid.size.toFixed(6)} Earth radii</div>
        <div>Radius: {(testAsteroid.size * 6371).toFixed(2)} km</div>
        <div>Render Scale: {testScale}</div>
        <div>
          Final Size: {(testAsteroid.size * 6371 * testScale).toFixed(6)} units
        </div>
      </div>

      {/* Test asteroid at origin */}
      <group position={[0, 0, 0]}>
        <AsteroidMesh
          asteroid={testAsteroid}
          renderScale={testScale}
          onClick={() => console.log("Debug asteroid clicked")}
        />
      </group>
    </div>
  );
};
