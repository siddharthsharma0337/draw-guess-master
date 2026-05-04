import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getSocket } from "@/lib/socket";
import type { ChatMessage, Player, StrokeData } from "@/lib/types";

interface GameState {
  connected: boolean;
  myId: string | null;
  myName: string;
  setMyName: (n: string) => void;
  roomId: string | null;
  hostId: string | null;
  players: Player[];
  rounds: number;
  drawTime: number;
  gameState: "lobby" | "playing" | "round-end" | "ended";
  drawerId: string | null;
  drawerName: string | null;
  currentRound: number;
  totalRounds: number;
  maskedWord: string;
  wordLength: number;
  secretWord: string | null;
  roundEndsAt: number | null;
  revealedWord: string | null;
  finalScores: Player[];
  chat: ChatMessage[];
  strokes: StrokeData[];
  iGuessed: boolean;

  joinOrCreate: (
    playerName: string,
    roomId: string | null,
    create: boolean,
  ) => Promise<{ ok: boolean; error?: string; roomId?: string }>;
  startGame: (rounds: number, drawTime: number) => void;
  updateSettings: (rounds: number, drawTime: number) => void;
  sendStroke: (s: StrokeData) => void;
  clearCanvas: () => void;
  submitGuess: (g: string) => void;
  playAgain: () => void;
  resetClient: () => void;
  addBot: () => void;
  removeBot: (botId: string) => void;
}

const Ctx = createContext<GameState | null>(null);

let chatIdCounter = 0;
function nextChatId() {
  chatIdCounter += 1;
  return `m-${Date.now()}-${chatIdCounter}`;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>(() => {
    return localStorage.getItem("skribbl-name") || "";
  });
  const [roomId, setRoomId] = useState<string | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(80);
  const [gameState, setGameState] = useState<
    "lobby" | "playing" | "round-end" | "ended"
  >("lobby");
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerName, setDrawerName] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(3);
  const [maskedWord, setMaskedWord] = useState("");
  const [wordLength, setWordLength] = useState(0);
  const [secretWord, setSecretWord] = useState<string | null>(null);
  const [roundEndsAt, setRoundEndsAt] = useState<number | null>(null);
  const [revealedWord, setRevealedWord] = useState<string | null>(null);
  const [finalScores, setFinalScores] = useState<Player[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [strokes, setStrokes] = useState<StrokeData[]>([]);
  const [iGuessed, setIGuessed] = useState(false);

  const myIdRef = useRef<string | null>(null);

  const pushChat = useCallback((m: Omit<ChatMessage, "id">) => {
    setChat((prev) => [...prev, { ...m, id: nextChatId() }]);
  }, []);

  useEffect(() => {
    if (myName) localStorage.setItem("skribbl-name", myName);
  }, [myName]);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setConnected(true);
    };
    const onDisconnect = () => {
      setConnected(false);
    };

    const onPlayerJoined = (data: {
      players: Player[];
      hostId: string;
      rounds: number;
      drawTime: number;
    }) => {
      setPlayers(data.players);
      setHostId(data.hostId);
      setRounds(data.rounds);
      setDrawTime(data.drawTime);
    };

    const onPlayerLeft = (data: {
      playerId: string;
      players: Player[];
      hostId: string;
    }) => {
      setPlayers((prev) => {
        const left = prev.find((p) => p.id === data.playerId);
        pushChat({
          message: `${left?.name || "A player"} left the room`,
          type: "system",
        });
        return data.players;
      });
      setHostId(data.hostId);
    };

    const onSettingsUpdated = (data: { rounds: number; drawTime: number }) => {
      setRounds(data.rounds);
      setDrawTime(data.drawTime);
    };

    const onGameStart = (data: { rounds: number; drawTime: number }) => {
      setRounds(data.rounds);
      setDrawTime(data.drawTime);
      setGameState("playing");
      setChat([]);
      setStrokes([]);
      setRevealedWord(null);
      setFinalScores([]);
    };

    const onNewRound = (data: {
      drawerId: string;
      drawerName: string;
      wordLength: number;
      maskedWord: string;
      roundNumber: number;
      totalRounds: number;
      drawTime: number;
      roundEndsAt: number;
    }) => {
      setDrawerId(data.drawerId);
      setDrawerName(data.drawerName);
      setWordLength(data.wordLength);
      setMaskedWord(data.maskedWord);
      setCurrentRound(data.roundNumber);
      setTotalRounds(data.totalRounds);
      setDrawTime(data.drawTime);
      setRoundEndsAt(data.roundEndsAt);
      setSecretWord(null);
      setRevealedWord(null);
      setStrokes([]);
      setIGuessed(false);
      setGameState("playing");
      pushChat({
        message: `Round ${data.roundNumber} • ${data.drawerName} is drawing`,
        type: "system",
      });
    };

    const onSecretWord = (data: { word: string }) => {
      setSecretWord(data.word);
    };

    const onStrokeBroadcast = (s: StrokeData) => {
      setStrokes((prev) => [...prev, s]);
    };

    const onCanvasCleared = () => {
      setStrokes([]);
    };

    const onGuessResult = (data: {
      playerId: string;
      playerName: string;
      correct: boolean;
      message: string;
      scores: Record<string, number>;
    }) => {
      setPlayers((prev) =>
        prev.map((p) => ({ ...p, score: data.scores[p.id] ?? p.score })),
      );
      if (data.correct) {
        pushChat({
          playerId: data.playerId,
          playerName: data.playerName,
          message: data.message,
          type: "correct",
        });
        if (data.playerId === myIdRef.current) {
          setIGuessed(true);
        }
      } else {
        pushChat({
          playerId: data.playerId,
          playerName: data.playerName,
          message: data.message,
          type: "guess",
        });
      }
    };

    const onRoundEnd = (data: {
      word: string;
      scores: Record<string, number>;
      players: Player[];
    }) => {
      setRevealedWord(data.word);
      setPlayers(data.players);
      setGameState("round-end");
      pushChat({
        message: `The word was "${data.word}"`,
        type: "system",
      });
    };

    const onGameEnd = (data: { finalScores: Player[] }) => {
      setFinalScores(data.finalScores);
      setGameState("ended");
    };

    const onReturnedToLobby = (data: {
      players: Player[];
      hostId: string;
      rounds: number;
      drawTime: number;
    }) => {
      setPlayers(data.players);
      setHostId(data.hostId);
      setRounds(data.rounds);
      setDrawTime(data.drawTime);
      setGameState("lobby");
      setChat([]);
      setStrokes([]);
      setRevealedWord(null);
      setFinalScores([]);
      setDrawerId(null);
      setDrawerName(null);
      setSecretWord(null);
      setMaskedWord("");
      setCurrentRound(0);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("player-joined", onPlayerJoined);
    socket.on("player-left", onPlayerLeft);
    socket.on("settings-updated", onSettingsUpdated);
    socket.on("game-start", onGameStart);
    socket.on("new-round", onNewRound);
    socket.on("secret-word", onSecretWord);
    socket.on("stroke-broadcast", onStrokeBroadcast);
    socket.on("canvas-cleared", onCanvasCleared);
    socket.on("guess-result", onGuessResult);
    socket.on("round-end", onRoundEnd);
    socket.on("game-end", onGameEnd);
    socket.on("returned-to-lobby", onReturnedToLobby);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("player-joined", onPlayerJoined);
      socket.off("player-left", onPlayerLeft);
      socket.off("settings-updated", onSettingsUpdated);
      socket.off("game-start", onGameStart);
      socket.off("new-round", onNewRound);
      socket.off("secret-word", onSecretWord);
      socket.off("stroke-broadcast", onStrokeBroadcast);
      socket.off("canvas-cleared", onCanvasCleared);
      socket.off("guess-result", onGuessResult);
      socket.off("round-end", onRoundEnd);
      socket.off("game-end", onGameEnd);
      socket.off("returned-to-lobby", onReturnedToLobby);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const joinOrCreate = useCallback(
    (
      playerName: string,
      reqRoomId: string | null,
      create: boolean,
    ): Promise<{ ok: boolean; error?: string; roomId?: string }> => {
      return new Promise((resolve) => {
        const socket = getSocket();
        socket.emit(
          "join-room",
          { roomId: reqRoomId, playerName, create },
          (res: { ok: boolean; error?: string; roomId?: string; playerId?: string }) => {
            if (res?.ok && res.roomId && res.playerId) {
              setMyId(res.playerId);
              myIdRef.current = res.playerId;
              setRoomId(res.roomId);
              setMyName(playerName);
            }
            resolve(res);
          },
        );
      });
    },
    [],
  );

  const startGame = useCallback((r: number, d: number) => {
    getSocket().emit("game-start", { rounds: r, drawTime: d });
  }, []);

  const updateSettings = useCallback((r: number, d: number) => {
    getSocket().emit("update-settings", { rounds: r, drawTime: d });
  }, []);

  const sendStroke = useCallback((s: StrokeData) => {
    setStrokes((prev) => [...prev, s]);
    getSocket().emit("draw-stroke", s);
  }, []);

  const clearCanvas = useCallback(() => {
    setStrokes([]);
    getSocket().emit("canvas-clear");
  }, []);

  const submitGuess = useCallback((g: string) => {
    getSocket().emit("submit-guess", { guess: g });
  }, []);

  const playAgain = useCallback(() => {
    getSocket().emit("play-again");
  }, []);

  const addBot = useCallback(() => {
    getSocket().emit("add-bot");
  }, []);

  const removeBot = useCallback((botId: string) => {
    getSocket().emit("remove-bot", { botId });
  }, []);

  const resetClient = useCallback(() => {
    setRoomId(null);
    setHostId(null);
    setPlayers([]);
    setGameState("lobby");
    setChat([]);
    setStrokes([]);
    setRevealedWord(null);
    setFinalScores([]);
    setDrawerId(null);
    setDrawerName(null);
    setSecretWord(null);
    setMaskedWord("");
    setCurrentRound(0);
  }, []);

  const value = useMemo<GameState>(
    () => ({
      connected,
      myId,
      myName,
      setMyName,
      roomId,
      hostId,
      players,
      rounds,
      drawTime,
      gameState,
      drawerId,
      drawerName,
      currentRound,
      totalRounds,
      maskedWord,
      wordLength,
      secretWord,
      roundEndsAt,
      revealedWord,
      finalScores,
      chat,
      strokes,
      iGuessed,
      joinOrCreate,
      startGame,
      updateSettings,
      sendStroke,
      clearCanvas,
      submitGuess,
      playAgain,
      resetClient,
      addBot,
      removeBot,
    }),
    [
      connected,
      myId,
      myName,
      roomId,
      hostId,
      players,
      rounds,
      drawTime,
      gameState,
      drawerId,
      drawerName,
      currentRound,
      totalRounds,
      maskedWord,
      wordLength,
      secretWord,
      roundEndsAt,
      revealedWord,
      finalScores,
      chat,
      strokes,
      iGuessed,
      joinOrCreate,
      startGame,
      updateSettings,
      sendStroke,
      clearCanvas,
      submitGuess,
      playAgain,
      resetClient,
      addBot,
      removeBot,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
