# Server Synchronization TODO List

## Overview

This document tracks client-side game logic that should be moved to server-side for proper multiplayer synchronization. Currently, many dynamic simulations run independently on each client, which can lead to desync issues.

## Priority Levels

- 🔴 **Critical** - Causes gameplay desync or exploits
- 🟡 **High** - Noticeable visual/gameplay inconsistencies
- 🟢 **Medium** - Minor inconsistencies, quality-of-life improvement
- ⚪ **Low** - Nice-to-have, minimal impact

---

## 🔴 Critical Priority

### 1. Spaceship State Management

**Status:** ⚠️ Partially client-side  
**Location:** `src/store/gameStore.ts`, `src/hooks/useGameLoop.ts`  
**Issue:** Spaceship positions and states are calculated on each client independently

**What needs to move to server:**

- Spaceship launch calculations
- Flight path physics
- State transitions (launching → traveling → orbiting → landing)
- Position updates during flight
- Collision detection with destinations

**Why critical:**

- Players see different spaceship positions
- Arrival times can differ between clients
- Race conditions in multiplayer missions

---

### 2. Game Time & Speed Control

**Status:** ⚠️ Client-controlled  
**Location:** `src/store/gameStore.ts`  
**Issue:** Game time advances independently on each client

**What needs to move to server:**

- Master game clock
- Time scale enforcement
- Play/pause state authority
- Time synchronization between clients

**Why critical:**

- Orbital positions desync over time
- Spaceship ETAs become inaccurate
- Events trigger at different times for different players

---

## 🟡 High Priority

### 3. Comet Tail Simulation

**Status:** ⚠️ Client-side  
**Location:** `src/utils/cometFactory.ts` (`updateCometTail()`), `src/components/Comets/Comet.tsx`  
**Issue:** Tail intensity calculated per client based on local time

**What needs to move to server:**

- Tail intensity calculations based on distance from sun
- Tail visibility state
- Synchronized tail animations

**Why high priority:**

- Visual inconsistency between players
- Affects gameplay if comets are interactive
- Example of pattern that should be server-authoritative

**Current code location:**

```typescript
// src/components/Comets/Comet.tsx
useFrame((_, delta) => {
  // ... orbital updates
  const updatedTail = updateCometTail(cometDataRef.current, starPos);
  // This runs independently on each client!
});
```

---

### 4. Orbital Mechanics Simulation

**Status:** ⚠️ Client-side  
**Location:** Multiple files

- `src/components/Planets/PlanetOrbit.tsx`
- `src/components/Asteroids/AsteroidBelt.tsx`
- `src/components/Comets/Comet.tsx`

**Issue:** Each client calculates orbital positions independently using `useFrame()`

**What needs to move to server:**

- Central orbital position calculation for all celestial bodies
- Periodic position broadcasts to clients
- Delta compression for bandwidth efficiency

**Why high priority:**

- Positions drift over time between clients
- Affects collision detection
- Makes coordinated gameplay (rendezvous, etc.) impossible

---

### 5. System Generation Seed Management

**Status:** ⚠️ Mixed  
**Location:** `server/src/game/GameGalaxy.ts`, client stores  
**Issue:** Seeds might not be consistently tracked

**What needs improvement:**

- Ensure all seeds are server-generated and stored
- Prevent client-side seed manipulation
- Seed-based regeneration should be server-controlled
- Version control for generation algorithms

**Why high priority:**

- Prevents cheating/exploits
- Ensures all players see identical systems
- Critical for save/load functionality

---

## 🟢 Medium Priority

### 6. Asteroid Belt Dynamics

**Status:** ⚠️ Client-side  
**Location:** `src/components/Asteroids/AsteroidBelt.tsx`  
**Issue:** Asteroid orbital phases tracked in `useRef`, not synced

```typescript
const orbitalPhasesRef = useRef<number[]>(
  belt.asteroids.map((a) => a.orbital.angle)
);
```

**What needs to move to server:**

- Asteroid position updates
- Orbital phase tracking
- Shadow calculations (if gameplay-relevant)

---

### 7. Planet Rotation State

**Status:** ⚠️ Client-side  
**Location:** `src/components/Planets/PlanetRotation.tsx`  
**Issue:** Rotation angles calculated per client

**What needs to move to server:**

- Rotation angles based on server time
- Synchronized day/night cycles (if gameplay-relevant)
- City lights synchronization

**Why medium:**

- Mainly visual, but affects immersion
- Important if day/night has gameplay implications

---

### 8. Moon Orbital Positions

**Status:** ⚠️ Client-side  
**Location:** `src/components/Planets/MoonOrbit.tsx`  
**Issue:** Moon positions calculated independently

**What needs to move to server:**

- Moon orbital positions
- Eclipse calculations (if implemented)
- Tidal effects (if implemented)

---

### 9. Nebula Animation State

**Status:** ⚠️ Client-side  
**Location:** `src/components/Nebula/Nebula.tsx`  
**Issue:** Nebula animations likely use local time

**What needs to move to server:**

- Animation phase synchronization
- Visibility state changes
- Any nebula-related effects

---

## ⚪ Low Priority

### 10. Camera Positions

**Status:** ✅ Should stay client-side  
**Note:** Each player should control their own camera  
**Exception:** Consider syncing for "spectator mode" or "follow player" features

---

### 11. UI State

**Status:** ✅ Should stay client-side  
**Note:** Most UI state (open panels, selections) is personal to each player  
**Exception:** Shared UI elements (chat, player lists) need server sync

---

### 12. Particle Effects

**Status:** ✅ Can stay client-side  
**Note:** Purely cosmetic effects don't need sync  
**Exception:** If particles indicate gameplay state (damage, resources)

---

## Implementation Strategy

### Phase 1: Foundation (Recommended order)

1. ✅ **Establish Server Authority** - Already done for generation
2. 🔲 **Implement Server Game Clock** - Single source of truth for time
3. 🔲 **Add Position Broadcast System** - Server sends positions to clients
4. 🔲 **Client Interpolation** - Smooth rendering between server updates

### Phase 2: Core Systems

5. 🔲 **Move Spaceship Logic to Server** - Critical for gameplay
6. 🔲 **Server-Side Orbital Calculations** - Calculate once, broadcast to all
7. 🔲 **Synchronize Comet Tails** - Example implementation for other dynamic effects

### Phase 3: Polish

8. 🔲 **Moon Positions**
9. 🔲 **Planet Rotations**
10. 🔲 **Nebula Animations**

---

## Technical Approach

### Server Tick System

```typescript
// Pseudo-code for server game loop
class GameGalaxy {
  private gameLoop() {
    setInterval(() => {
      // 1. Update game time
      this.gameState.gameTime += deltaTime;

      // 2. Calculate all positions (planets, moons, asteroids, comets)
      this.updateOrbitalPositions();

      // 3. Update dynamic effects (comet tails, etc.)
      this.updateDynamicEffects();

      // 4. Update spaceships
      this.updateSpaceships();

      // 5. Broadcast state to clients (with delta compression)
      this.broadcastGameState();
    }, SERVER_TICK_RATE); // e.g., 20 ticks/second
  }
}
```

### Client Interpolation

```typescript
// Pseudo-code for client rendering
useFrame((_, delta) => {
  // Interpolate between last two server positions
  const interpolatedPosition = lerp(
    lastServerPosition,
    nextServerPosition,
    timeSinceLastUpdate / timeBetweenUpdates
  );

  // Smooth rendering even with low server tick rate
  mesh.position.copy(interpolatedPosition);
});
```

---

## Performance Considerations

### Bandwidth Optimization

- **Delta Compression**: Only send changed values
- **Position Quantization**: Reduce precision for distant objects
- **Update Frequency Tiers**:
  - Spaceships: 20 Hz
  - Nearby planets: 10 Hz
  - Distant objects: 1 Hz
  - Comets: 5 Hz (only when tail active)

### Server Load

- **Spatial Partitioning**: Only calculate positions for "active" systems
- **Player Proximity**: Higher update rates for objects near players
- **Lazy Evaluation**: Calculate on-demand for rarely viewed objects

---

## Migration Path

### For Each System to Migrate:

1. **Audit Current Behavior**

   - Document what client calculates
   - Identify sync points
   - Measure current performance

2. **Design Server Logic**

   - Create server-side calculation
   - Add state to GameGalaxy
   - Define socket events

3. **Implement Server Authority**

   ```typescript
   // Server
   socket.on("request-positions", () => {
     socket.emit("positions-update", this.getPositions());
   });
   ```

4. **Update Client to Receive**

   ```typescript
   // Client
   socket.on("positions-update", (positions) => {
     gameStore.updatePositions(positions);
   });
   ```

5. **Remove Client Calculation**

   - Mark old code as deprecated
   - Keep as fallback during migration
   - Remove after testing

6. **Test Synchronization**
   - Multi-client testing
   - Latency simulation
   - Reconnection scenarios

---

## Testing Checklist

For each migrated system:

- [ ] Multiple clients see identical state
- [ ] Positions don't drift over time
- [ ] Smooth rendering (interpolation working)
- [ ] Reconnect syncs properly
- [ ] Performance acceptable (FPS, bandwidth)
- [ ] No regression in single-player experience

---

## Notes

- Keep client-side **prediction** for player actions (responsive feel)
- Server **validation** for all game state changes
- Client **interpolation** for smooth rendering
- **Rollback** mechanisms for mispredictions

## Related Documents

- `README_GENERATION.md` - Server generation authority (already implemented)
- `CLEANUP_SUMMARY.md` - Recent cleanup work
- Future: `MULTIPLAYER_ARCHITECTURE.md` - Overall design doc

---

**Last Updated:** October 24, 2025  
**Status:** Planning phase - implementation pending
