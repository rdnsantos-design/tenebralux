import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import ArmyManagement from "./pages/ArmyManagement";
import TacticalCards from "./pages/TacticalCards";
import CharacterCards from "./pages/CharacterCards";
import Domains from "./pages/Domains";
import BattleMap from "./pages/BattleMap";
import MassCombat from "./pages/MassCombat";
import Travel from "./pages/Travel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cards" element={<Index />} />
          <Route path="/army" element={<ArmyManagement />} />
          <Route path="/tactical-cards" element={<TacticalCards />} />
          <Route path="/characters" element={<CharacterCards />} />
          <Route path="/domains" element={<Domains />} />
          <Route path="/battlemap" element={<BattleMap />} />
          <Route path="/battle-map" element={<BattleMap />} />
          <Route path="/mass-combat" element={<MassCombat />} />
          <Route path="/travel" element={<Travel />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
