import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";

function Dashboard() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
        <h3 className="font-semibold leading-none tracking-tight mb-2">Welcome to DevSecOps Sentinel</h3>
        <p className="text-sm text-muted-foreground">Frontend architecture scaffolded successfully with security and modern practices.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          {/* Future secure route wrappers can be added here */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
