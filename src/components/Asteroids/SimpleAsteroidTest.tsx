import React from "react";
import { AsteroidMesh } from "./AsteroidMesh";
import { generateAsteroid } from "../../utils/asteroidFactory";
import { getSimpleAsteroidSize } from "../../utils/asteroidSizingSimple";

/**
 * Simple test component to verify asteroid sizing
 */
export const SimpleAsteroidTest: React.FC = () => {
  // Generate a test asteroid
  const testAsteroid = generateAsteroid({
    beltType: "inner",
    orbitalDistance: 2.5,
    seed: 12345,
  });

  const finalSize = getSimpleAsteroidSize(testAsteroid.size);

  return (
    <div className="fixed top-4 left-4 bg-black/90 text-white p-3 rounded text-xs">
      <h3 className="font-bold mb-2">Asteroid Size Test</h3>
      <div className="space-y-1">
        <div>Size (Earth radii): {testAsteroid.size.toFixed(8)}</div>
        <div>Size (km): {(testAsteroid.size * 6371).toFixed(2)}</div>
        <div>Final render size: {finalSize.toFixed(10)}</div>
        <div>Expected: ~0.0000001 or smaller</div>
      </div>

      {/* Test asteroid at origin */}
      <group position={[0, 0, 0]}>
        <AsteroidMesh
          asteroid={testAsteroid}
          onClick={() => console.log("Test asteroid clicked")}
        />
      </group>
    </div>
  );
};
