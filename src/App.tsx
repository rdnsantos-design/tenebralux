import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import ArmyManagement from "./pages/ArmyManagement";
import TacticalCards from "./pages/TacticalCards";
import CharacterCards from "./pages/CharacterCards";
import Domains from "./pages/Domains";
import BattleMap from "./pages/BattleMap";
import MassCombat from "./pages/MassCombat";
import MassCombatCards from "./pages/MassCombatCards";
import Travel from "./pages/Travel";
import TacticalGame from "./pages/TacticalGame";
import StrategicGame from "./pages/StrategicGame";
import FieldCommanders from "./pages/FieldCommanders";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/cards" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/army" element={<ProtectedRoute><ArmyManagement /></ProtectedRoute>} />
          <Route path="/tactical-cards" element={<ProtectedRoute><TacticalCards /></ProtectedRoute>} />
          <Route path="/characters" element={<ProtectedRoute><CharacterCards /></ProtectedRoute>} />
          <Route path="/domains" element={<ProtectedRoute><Domains /></ProtectedRoute>} />
          <Route path="/battlemap" element={<ProtectedRoute><BattleMap /></ProtectedRoute>} />
          <Route path="/battle-map" element={<ProtectedRoute><BattleMap /></ProtectedRoute>} />
          <Route path="/mass-combat" element={<ProtectedRoute><MassCombat /></ProtectedRoute>} />
          <Route path="/mass-combat-cards" element={<ProtectedRoute><MassCombatCards /></ProtectedRoute>} />
          <Route path="/travel" element={<ProtectedRoute><Travel /></ProtectedRoute>} />
          <Route path="/tactical-game" element={<ProtectedRoute><TacticalGame /></ProtectedRoute>} />
          <Route path="/strategic-game" element={<ProtectedRoute><StrategicGame /></ProtectedRoute>} />
          <Route path="/field-commanders" element={<ProtectedRoute><FieldCommanders /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
