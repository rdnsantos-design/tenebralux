import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/themes";
import { AuthProvider } from "@/contexts/AuthContext";
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
import CharacterBuilder from "./pages/CharacterBuilder";
import RPGRules from "./pages/RPGRules";
import AuthCallback from "./pages/AuthCallback";
import GalaxyLore from "./pages/GalaxyLore";
import GalaxyMap from "./pages/GalaxyMap";

// Tactical Battle Pages
import TacticalHomePage from "./pages/TacticalHomePage";
import CreateTacticalMatchPage from "./pages/CreateTacticalMatchPage";
import JoinTacticalMatchPage from "./pages/JoinTacticalMatchPage";
import TacticalLobbyPage from "./pages/TacticalLobbyPage";
import MyTacticalMatchesPage from "./pages/MyTacticalMatchesPage";
import TacticalBattleTestPage from "./pages/TacticalBattleTestPage";
import TacticalBattlePage from "./pages/TacticalBattlePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
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
              
              {/* Character Builder Routes */}
              <Route path="/character-builder" element={<CharacterBuilder />} />
              <Route path="/character-builder/create" element={<CharacterBuilder />} />
              
              {/* RPG Rules Routes */}
              <Route path="/rpg-rules" element={<RPGRules />} />
              
              {/* Auth Routes */}
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Lore Routes */}
              <Route path="/galaxy-lore" element={<GalaxyLore />} />
              <Route path="/lore" element={<GalaxyLore />} />
              <Route path="/galaxy-map" element={<GalaxyMap />} />
              
              {/* Tactical Battle Routes */}
              <Route path="/tactical" element={<TacticalHomePage />} />
              <Route path="/tactical/create" element={<CreateTacticalMatchPage />} />
              <Route path="/tactical/join" element={<JoinTacticalMatchPage />} />
              <Route path="/tactical/lobby/:matchId" element={<TacticalLobbyPage />} />
              <Route path="/tactical/my-matches" element={<MyTacticalMatchesPage />} />
              <Route path="/tactical/battle-test" element={<TacticalBattleTestPage />} />
              <Route path="/tactical/battle/:matchId" element={<TacticalBattlePage />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
