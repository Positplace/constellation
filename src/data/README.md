# Data-Driven Configuration

This directory contains all configuration files for procedural generation in the Constellation game. All probabilities, weights, and generation parameters are now data-driven and can be easily modified without changing code.

## Directory Structure

```
data/
├── generationConfig.json      # Main generation probabilities and weights
├── nebulaConfigs.json         # Nebula type configurations
├── planetConfigs.json         # Planet type configurations
├── starConfigs.json           # Star type configurations
└── names/                     # Name generation configs
    ├── asteroidNames.json     # Asteroid naming components
    ├── cometNames.json        # Comet naming components
    └── planetNames.json       # Planet name lists
```

## Configuration Files

### `generationConfig.json`

Main configuration file for generation probabilities and weights.

#### Star Type Weights

Controls the relative probability of each star type appearing:

```json
"starTypeWeights": {
  "red_dwarf": 40,      // Most common (40%)
  "orange_star": 20,
  "yellow_star": 15,
  "white_star": 10,
  "blue_giant": 5,
  "red_giant": 5,
  "white_dwarf": 3,
  "binary_star": 2,
  "black_hole": 0.5     // Rarest (0.5%)
}
```

#### Comet Generation

Per-star-type configuration for comet counts and types:

```json
"cometGeneration": {
  "yellow_star": {
    "count": { "min": 0, "max": 1 },
    "typeWeights": {
      "short_period": 0.4,
      "halley_type": 0.35,
      "long_period": 0.25
    }
  },
  "globalRarityMultiplier": 0.5  // Makes comets twice as rare overall
}
```

#### Asteroid Materials

Material distribution for inner and outer asteroid belts:

```json
"asteroidMaterials": {
  "inner": {
    "silicate": 70,
    "iron": 25,
    "nickel": 3,
    ...
  },
  "outer": {
    "carbonaceous": 40,
    "ice": 35,
    ...
  }
}
```

#### Dyson Sphere Generation

Base chance and per-star-type multipliers:

```json
"dysonSphere": {
  "baseChance": 0.03,  // 3% base chance
  "starTypeMultipliers": {
    "white_star": 1.67,    // 5% chance
    "blue_giant": 1.67,    // 5% chance
    "yellow_star": 1.33,   // 4% chance
    "black_hole": 0.0      // Never for black holes
  },
  "completion": {
    "min": 5,    // 5% minimum completion
    "max": 90    // 90% maximum completion
  }
}
```

#### Nebula Generation

Multipliers for preferred vs non-preferred star types:

```json
"nebulaGeneration": {
  "rarityMultipliers": {
    "preferredStarType": 2.0,      // 2x chance
    "nonPreferredStarType": 0.5    // 0.5x chance
  }
}
```

### `nebulaConfigs.json`

Configuration for each nebula type including visual properties and rarity.

### `planetConfigs.json`

Configuration for planet types (already existed).

### `starConfigs.json`

Configuration for star types including visual properties (already existed).

### `names/asteroidNames.json`

Name generation for asteroids and rare metal types:

```json
{
  "prefixes": ["Alpha", "Beta", "Gamma", ...],
  "suffixes": ["Rock", "Stone", "Boulder", ...],
  "rareMetals": {
    "platinum": ["Platinum", "Palladium", "Iridium", "Rhodium"],
    "gold": ["Gold", "Silver"],
    "rare_earth": ["Neodymium", "Dysprosium", "Terbium", "Yttrium"]
  }
}
```

### `names/cometNames.json`

Name generation for comets:

```json
{
  "prefixes": ["Halley's", "Swift", "Tuttle's", ...],
  "suffixes": ["Comet", "Wanderer", "Visitor", ...]
}
```

### `names/planetNames.json`

Names for procedurally generated planets (already existed).

## Usage

All factory files now import and use these configurations:

- `systemFactory.ts` - Uses star type weights and Dyson sphere config
- `cometFactory.ts` - Uses comet generation config and names
- `asteroidFactory.ts` - Uses asteroid materials and names
- `nebulaFactory.ts` - Uses nebula multipliers
- `planetFactory.ts` - Uses planet configs (already data-driven)

## Modifying Generation

To adjust game generation:

1. Edit the relevant JSON file
2. Save the changes
3. Refresh the game (changes apply immediately, no code changes needed)

### Examples

**Make black holes more common:**

```json
"starTypeWeights": {
  "black_hole": 5.0  // Changed from 0.5
}
```

**Make comets more common:**

```json
"globalRarityMultiplier": 1.0  // Changed from 0.5
```

**Increase Dyson Sphere chance:**

```json
"dysonSphere": {
  "baseChance": 0.1  // Changed from 0.03 (10% base chance)
}
```

**More ice in inner asteroid belts:**

```json
"asteroidMaterials": {
  "inner": {
    "ice": 10  // Changed from 0
  }
}
```
