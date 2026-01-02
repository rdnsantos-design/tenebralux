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
import MassCombatCards from "./pages/MassCombatCards";
import Travel from "./pages/Travel";
import TacticalGame from "./pages/TacticalGame";
import TacticalHome from "./pages/TacticalHome";
import StrategicGame from "./pages/StrategicGame";
import FieldCommanders from "./pages/FieldCommanders";
import GameRoom from "./pages/GameRoom";
import NotFound from "./pages/NotFound";

// Tactical Battle Pages
import TacticalHomePage from "./pages/TacticalHomePage";
import CreateTacticalMatchPage from "./pages/CreateTacticalMatchPage";
import JoinTacticalMatchPage from "./pages/JoinTacticalMatchPage";
import TacticalLobbyPage from "./pages/TacticalLobbyPage";
import MyTacticalMatchesPage from "./pages/MyTacticalMatchesPage";

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
          <Route path="/mass-combat-cards" element={<MassCombatCards />} />
          <Route path="/travel" element={<Travel />} />
          <Route path="/tactical-game" element={<TacticalGame />} />
          <Route path="/tactical-home" element={<TacticalHome />} />
          <Route path="/strategic-game" element={<StrategicGame />} />
          <Route path="/field-commanders" element={<FieldCommanders />} />
          <Route path="/game" element={<GameRoom />} />
          <Route path="/game/:roomCode" element={<GameRoom />} />
          
          {/* Tactical Battle Routes */}
          <Route path="/tactical" element={<TacticalHomePage />} />
          <Route path="/tactical/create" element={<CreateTacticalMatchPage />} />
          <Route path="/tactical/join" element={<JoinTacticalMatchPage />} />
          <Route path="/tactical/lobby/:matchId" element={<TacticalLobbyPage />} />
          <Route path="/tactical/my-matches" element={<MyTacticalMatchesPage />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
