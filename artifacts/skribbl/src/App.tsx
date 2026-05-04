import { Switch, Route, Router as WouterRouter } from "wouter";
import { GameProvider } from "@/context/GameContext";
import Home from "@/pages/Home";
import Lobby from "@/pages/Lobby";
import Game from "@/pages/Game";
import Results from "@/pages/Results";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/lobby/:roomId" component={Lobby} />
      <Route path="/game/:roomId" component={Game} />
      <Route path="/results/:roomId" component={Results} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <GameProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </GameProvider>
  );
}

export default App;
