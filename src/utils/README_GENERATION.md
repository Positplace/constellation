# Client-Side Generation Utilities - DEPRECATED

## ⚠️ Important Notice

The generation utilities in this directory (`planetFactory.ts`, `moonFactory.ts`, `systemFactory.ts`, `asteroidFactory.ts`, `cometFactory.ts`, `nebulaFactory.ts`) are **DEPRECATED** for normal gameplay.

## Current Status

- **Server-Side Generation**: All game content generation happens on the server (`/server/src/utils/`)
- **Client-Side**: These utilities are kept only for:
  - Debug/test components (currently commented out)
  - Potential offline/single-player mode (future)
  - Development testing

## What to Use Instead

For multiplayer gameplay, **always** request generation from the server:

```typescript
// ❌ DON'T DO THIS (client-side generation)
const system = generateSolarSystem(starType, seed);

// ✅ DO THIS (server-side generation via socket)
socket.emit("generate-system", { fromSystemId, starType });
```

## Utilities That Are Safe to Use

These are **not** generation functions and are safe to use on the client:

- `calculateConnectedSystemPosition()` - Pure math utility for positioning
- `updateCometTail()` - Runtime tail intensity calculation
- `*SizingSimple.ts` - Rendering/sizing utilities
- `noiseUtils.ts` - Procedural noise functions

## Why This Separation?

1. **Multiplayer Sync**: Server is authoritative source
2. **Consistency**: All players see the same generated content
3. **Security**: Prevents client-side cheating/manipulation
4. **Performance**: Server can handle complex generation without blocking UI

## Maintaining This Code

If you need to update generation logic:

1. Update the **server** version: `/server/src/utils/`
2. Only update client version if needed for debug tools
3. Keep both in sync if maintained

## Future Cleanup

Consider removing client-side generation entirely if:

- Debug components are no longer needed
- Offline mode is not planned
- Maintenance burden is too high
