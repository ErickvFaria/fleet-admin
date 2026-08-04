import { Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Vehicles } from "./pages/Vehicles";
import { Drivers } from "./pages/Drivers";
import { Financial } from "./pages/Financial";
import { Contracts } from "./pages/Contracts";
import { Financings } from "./pages/Financings";
import { ProtectedRoute } from "./pages/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Inspections } from "./pages/Inspections";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/financial" element={<Financial />} />
          <Route path="/financings" element={<Financings />} />
          <Route path="/inspections" element={<Inspections />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;