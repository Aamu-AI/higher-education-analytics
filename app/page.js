import Dashboard from "./dashboard";
import dataset from "../data/degrees.json";

export default function Home() {
  return <Dashboard dataset={dataset} />;
}
