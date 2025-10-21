import { NebulaData } from "../../types/nebula.types";
import NebulaMesh from "./NebulaMesh";

interface NebulaProps {
  nebula: NebulaData;
  timeScale: number;
}

/**
 * Wrapper component for a single nebula
 */
const Nebula: React.FC<NebulaProps> = ({ nebula, timeScale }) => {
  return <NebulaMesh nebula={nebula} timeScale={timeScale} />;
};

export default Nebula;
