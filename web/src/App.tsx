import { Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Vehicles } from "./pages/Vehicles";
import { Drivers } from "./pages/Drivers";
import { Financial } from "./pages/Financial";
import { ProtectedRoute } from "./pages/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Contracts } from "./pages/Contracts";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/financial" element={<Financial />} />
          <Route path="/contracts" element={<Contracts />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;