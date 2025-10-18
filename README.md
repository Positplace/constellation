# Constellation - Space Exploration Game

A multiplayer space exploration game where players colonize countries on Earth and expand through the solar system using PV-tunnel networks.

## Features

- **Interactive 3D Earth Globe**: Click on countries to view information and colonize them
- **Solar System View**: Explore the solar system with animated planets and orbital paths
- **Constellation Network**: Visualize PV-tunnel connections between solar systems
- **Multiplayer Support**: Real-time multiplayer with Socket.io
- **Modern UI**: Stylized interface with glass panels and smooth animations

## Tech Stack

### Frontend

- React 18 + TypeScript
- Vite for fast development
- Three.js with React Three Fiber for 3D graphics
- Tailwind CSS for styling
- Zustand for state management
- Socket.io client for multiplayer

### Backend

- Node.js + Express
- Socket.io for real-time communication
- TypeScript for type safety

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd constellation
```

2. Install frontend dependencies:

```bash
npm install
```

3. Install backend dependencies:

```bash
cd server
npm install
```

### Development

1. Start the backend server:

```bash
cd server
npm run dev
```

2. Start the frontend development server:

```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

### Building for Production

1. Build the frontend:

```bash
npm run build
```

2. Build the backend:

```bash
cd server
npm run build
```

3. Start the production server:

```bash
cd server
npm start
```

## Game Mechanics

### Earth View

- Click on countries to view detailed information
- Colonize countries to gain research points and territory
- Each country has different stats: population, GDP, tech level, research output

### Solar System View

- View all planets in our solar system
- Planets orbit the sun with realistic speeds
- Hover over planets to see their names

### Constellation View

- See the network of PV-tunnels connecting solar systems
- Green nodes: Colonized systems
- Yellow nodes: Discovered but not colonized
- Gray nodes: Undiscovered systems
- Tunnel colors indicate status: green (active), orange (under construction), gray (planned)

### Multiplayer

- Join rooms with other players
- Real-time synchronization of game state
- See other players' actions and country selections

## Project Structure

```
constellation/
├── src/
│   ├── components/
│   │   ├── Globe/           # Earth globe components
│   │   ├── SolarSystem/     # Solar system components
│   │   ├── Constellation/   # Constellation network components
│   │   └── UI/             # UI components
│   ├── store/              # Zustand stores
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   └── data/               # Game data (countries, etc.)
├── server/
│   ├── src/
│   │   ├── game/           # Game logic
│   │   ├── socket/         # Socket.io handlers
│   │   └── types/          # Shared type definitions
└── public/                 # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Future Features

- Real GeoJSON country boundaries
- More detailed planet information
- Research trees and technology progression
- Resource management
- Turn-based gameplay mechanics
- Advanced tunnel construction
- Multiple solar systems to explore
- AI opponents
- Sound effects and music
