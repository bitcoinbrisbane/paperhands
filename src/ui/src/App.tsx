import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import { PortalLayout } from "./components/PortalLayout";
import { Dashboard } from "./components/Dashboard";
import { Loans } from "./components/Loans";
import { Capital } from "./components/Capital";
import { Transactions } from "./components/Transactions";
import { TransactionsAUD } from "./components/TransactionsAUD";
import { TransactionsStablecoins } from "./components/TransactionsStablecoins";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<PortalLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/capital" element={<Capital />} />
          <Route path="/transactions" element={<Navigate to="/transactions/bitcoin" replace />} />
          <Route path="/transactions/bitcoin" element={<Transactions />} />
          <Route path="/transactions/aud" element={<TransactionsAUD />} />
          <Route path="/transactions/stablecoins" element={<TransactionsStablecoins />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
