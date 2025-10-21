import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { useGameStore } from "./store/gameStore";

// Expose game store to window for debugging
if (typeof window !== "undefined") {
  (window as any).gameStore = useGameStore;
  console.log("🎮 Debug: Access game store via window.gameStore.getState()");
  console.log("🎮 Commands:");
  console.log("  - window.gameStore.getState().clearSavedGame()");
  console.log("  - window.gameStore.getState().regenerateAllSystems()");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
