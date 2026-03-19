import { useState, useEffect } from "react";
import HomePage from "./components/HomePage";
import Admin from "./pages/Admin";

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (path === "/admin") return <Admin />;
  return <HomePage />;
}

export default App;
