import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { gameData } from "@/data/game-data";
import confetti from 'canvas-confetti';
import { Share, Settings, ArrowRight, Send, Trophy, Timer, Star, Flame, Plus, X, Gift } from "lucide-react";
import { Difficulty, PlayerStats, GameState, Quest } from "@/types/game";
import { calculateLevel, calculateProgress, calculateXpForNextLevel, getXpReward } from "@/utils/level-utils";
import { generateDailyQuests, generateWeeklyQuests, generateCommunityQuest } from "@/data/quest-data";
import QuestsPanel from "@/components/QuestsPanel";

interface CustomTask {
  type: "ПРАВДА" | "ДЕЙСТВИЕ";
  text: string;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  action: (gameState: GameState) => GameState;
}

const INITIAL_PLAYER_STATS: PlayerStats = {
  points: 0,
  tasksCompleted: 0,
  truthsAnswered: 0,
  daresCompleted: 0,
  achievements: [],
  currentStreak: 0,
  maxStreak: 0,
  level: 1,
  xp: 0,
  activeQuests: [],
  completedQuests: [],
  badges: [],
  hardTasksCompleted: 0,
  sharedTasks: 0,
  skipTokens: 0,
  xpBoostEndTime: null
};

const INITIAL_GAME_STATE: GameState = {
  difficulty: 'medium',
  playerStats: INITIAL_PLAYER_STATS,
  lastTaskTimestamp: null,
  selectedCategory: gameData.categories[0].id,
  availableQuests: [...generateDailyQuests(), ...generateWeeklyQuests()],
  communityQuests: [generateCommunityQuest()]
};

const DIFFICULTY_POINTS = {
  easy: 10,
  medium: 25,
  hard: 50,
};

interface CustomTaskFormProps {
  onClose: () => void;
  customTask: CustomTask;
  setCustomTask: (task: CustomTask | ((prev: CustomTask) => CustomTask)) => void;
}

const CustomTaskForm = ({ onClose, customTask, setCustomTask }: CustomTaskFormProps) => {
  const { toast } = useToast();

  const handleShare = async () => {
    const taskText = `${customTask.type}: ${customTask.text}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Правда или Действие - Новое задание',
          text: taskText,
        });
        toast({
          title: "Успешно!",
          description: "Задание отправлено",
        });
      } catch (error) {
        console.error('Ошибка при отправке:', error);
      }
    } else {
      navigator.clipboard.writeText(taskText);
      toast({
        title: "Скопировано!",
        description: "Задание скопировано в буфер обмена",
      });
    }
  };

  const shareToTelegram = () => {
    const encodedResult = encodeURIComponent(customTask.type);
    const encodedTask = encodeURIComponent(customTask.text);
    const shareUrl = `${window.location.href.split('?')[0]}?result=${encodedResult}&task=${encodedTask}`;
    
    const shareText = encodeURIComponent(`Правда или Действие: Я создал новое задание "${customTask.type}" - ${customTask.text}. Нажми на ссылку, чтобы ответить на вопрос или выполнить действие вместе со мной!`);
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${shareText}`;
    
    window.open(telegramUrl, '_blank');
    
    toast({
      title: "Telegram",
      description: "Открываем Telegram для отправки",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card/90 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md border border-white/20 relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-accent/10 blur-2xl"></div>
        <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-primary/10 blur-2xl"></div>
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h2 className="text-2xl font-bold text-foreground">Создать задание</h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 hover:bg-foreground/10 rounded-full"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
        
        <div className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm text-foreground/60 mb-3">Тип задания</label>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCustomTask(prev => ({ ...prev, type: "ПРАВДА" }))}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  customTask.type === "ПРАВДА"
                    ? "bg-blue-500 text-white shadow-lg"
                    : "bg-foreground/10 hover:bg-foreground/20"
                }`}
              >
                Правда
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCustomTask(prev => ({ ...prev, type: "ДЕЙСТВИЕ" }))}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  customTask.type === "ДЕЙСТВИЕ"
                    ? "bg-red-500 text-white shadow-lg"
                    : "bg-foreground/10 hover:bg-foreground/20"
                }`}
              >
                Действие
              </motion.button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-foreground/60 mb-3">Текст задания</label>
            <textarea
              value={customTask.text}
              onChange={(e) => setCustomTask(prev => ({ ...prev, text: e.target.value }))}
              className="w-full p-4 rounded-xl bg-foreground/10 border border-foreground/10 focus:border-foreground/20 focus:outline-none focus:ring-0 placeholder:text-foreground/40 resize-none transition-all"
              rows={4}
              placeholder={customTask.type === "ПРАВДА" ? "Например: Расскажи о своем самом неловком моменте..." : "Например: Изобрази животное, а остальные пусть угадывают..."}
            />
          </div>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShare}
              disabled={!customTask.text.trim()}
              className="flex-1 py-3 px-4 bg-foreground text-primary rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:opacity-90 transition-all"
            >
              <Share className="w-5 h-5 inline-block mr-2" />
              Поделиться
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={shareToTelegram}
              disabled={!customTask.text.trim()}
              className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:opacity-90 transition-all"
            >
              <Send className="w-5 h-5 inline-block mr-2" />
              Telegram
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'theme',
    name: 'Новая тема',
    description: 'Измените внешний вид игры',
    icon: '🎨',
    price: 500,
    action: (state) => ({
      ...state,
      playerStats: {
        ...state.playerStats,
        points: state.playerStats.points - 500
      }
    })
  },
  {
    id: 'xp_boost',
    name: 'Буст опыта',
    description: 'x2 опыт на 1 час',
    icon: '⚡️',
    price: 300,
    action: (state) => ({
      ...state,
      playerStats: {
        ...state.playerStats,
        points: state.playerStats.points - 300,
        xpBoostEndTime: Date.now() + 3600000
      }
    })
  },
  {
    id: 'skip',
    name: 'Пропуск',
    description: 'Пропустить задание без штрафа',
    icon: '🎲',
    price: 200,
    action: (state) => ({
      ...state,
      playerStats: {
        ...state.playerStats,
        points: state.playerStats.points - 200,
        skipTokens: (state.playerStats.skipTokens || 0) + 1
      }
    })
  },
  {
    id: 'surprise',
    name: 'Сюрприз',
    description: 'Случайный бонус',
    icon: '🎁',
    price: 100,
    action: (state) => {
      const surprises = [
        { xp: 100, message: '+100 XP' },
        { points: 200, message: '+200 очков' },
        { skipTokens: 1, message: '+1 пропуск' },
        { xpBoost: 1800000, message: '30 минут x2 опыта' }
      ];
      const surprise = surprises[Math.floor(Math.random() * surprises.length)];
      return {
        ...state,
        playerStats: {
          ...state.playerStats,
          points: state.playerStats.points - 100 + (surprise.points || 0),
          xp: state.playerStats.xp + (surprise.xp || 0),
          skipTokens: (state.playerStats.skipTokens || 0) + (surprise.skipTokens || 0),
          xpBoostEndTime: surprise.xpBoost ? Date.now() + surprise.xpBoost : state.playerStats.xpBoostEndTime
        },
        surpriseMessage: surprise.message
      };
    }
  }
];

const Index = () => {
  const [result, setResult] = useState<"ПРАВДА" | "ДЕЙСТВИЕ" | null>(null);
  const [task, setTask] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<"default" | "dark" | "party">("default");
  const [history, setHistory] = useState<Array<{result: string, task: string}>>([]);
  const [sharedContent, setSharedContent] = useState<{result: string, task: string} | null>(null);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCustomTaskForm, setShowCustomTaskForm] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [customTask, setCustomTask] = useState<CustomTask>({
    type: "ПРАВДА",
    text: ""
  });
  const { toast } = useToast();
  const [xpGainedNotification, setXpGainedNotification] = useState<number | null>(null);
  const [shopError, setShopError] = useState<string | null>(null);
  const [showQuests, setShowQuests] = useState(false);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedResult = urlParams.get('result');
    const sharedTask = urlParams.get('task');
    
    if (sharedResult && sharedTask) {
      setSharedContent({
        result: decodeURIComponent(sharedResult),
        task: decodeURIComponent(sharedTask)
      });
      return;
    }
    
    const storedSharedContent = localStorage.getItem('truthOrDareShared');
    if (storedSharedContent) {
      try {
        const parsed = JSON.parse(storedSharedContent);
        setSharedContent(parsed);
        localStorage.removeItem('truthOrDareShared');
      } catch (e) {
        console.error("Error parsing shared content", e);
        localStorage.removeItem('truthOrDareShared');
      }
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    const savedState = localStorage.getItem('truthOrDareGameState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setGameState({ 
          ...INITIAL_GAME_STATE,
          ...parsed,
          selectedCategory: parsed.selectedCategory || gameData.categories[0].id 
        });
      } catch (e) {
        console.error("Error parsing game state", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('truthOrDareGameState', JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    if (timeLeft === null) return;
    
    if (timeLeft > 0) {
      const timerId = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timerId);
    } else {
      toast({
        title: "Время вышло!",
        description: "Задание не выполнено вовремя",
      });
      setTimeLeft(null);
    }
  }, [timeLeft]);

  useEffect(() => {
    const savedCompletedTasks = localStorage.getItem('truthOrDareCompletedTasks');
    if (savedCompletedTasks) {
      try {
        const parsed = JSON.parse(savedCompletedTasks);
        setCompletedTasks(new Set(parsed));
      } catch (e) {
        console.error("Error parsing completed tasks", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('truthOrDareCompletedTasks', 
      JSON.stringify(Array.from(completedTasks)));
  }, [completedTasks]);

  useEffect(() => {
    const now = Date.now();
    const dailyQuests = gameState.availableQuests.filter(q => q.type === "DAILY_PERSONAL");
    const weeklyQuests = gameState.availableQuests.filter(q => q.type === "WEEKLY_PERSONAL");
    
    let needsUpdate = false;
    if (dailyQuests.length === 0 || dailyQuests.some(q => q.endDate && q.endDate < now)) {
      needsUpdate = true;
    }
    if (weeklyQuests.length === 0 || weeklyQuests.some(q => q.endDate && q.endDate < now)) {
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      setGameState(prev => ({
        ...prev,
        availableQuests: [
          ...prev.availableQuests.filter(q => q.endDate && q.endDate >= now),
          ...generateDailyQuests(),
          ...generateWeeklyQuests()
        ]
      }));
    }
  }, [gameState.lastTaskTimestamp]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: theme === "party" ? ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'] : undefined
    });
  };

  const getBackgroundClass = () => {
    switch(theme) {
      case "dark":
        return "bg-gradient-to-br from-gray-900 to-gray-800";
      case "party":
        return "bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500";
      default:
        return "bg-gradient-to-br from-accent to-primary";
    }
  };

  const dismissSharedContent = () => {
    setSharedContent(null);
  };

  const updatePlayerStats = (isCompleted: boolean, taskType: "ПРАВДА" | "ДЕЙСТВИЕ") => {
    setGameState(prev => {
      const newStreak = isCompleted ? prev.playerStats.currentStreak + 1 : 0;
      const points = isCompleted ? DIFFICULTY_POINTS[prev.difficulty] : 0;
      const xpGained = isCompleted ? getXpReward(prev.difficulty) : 0;
      const currentXp = prev.playerStats.xp || 0;
      const newXp = currentXp + xpGained;
      
      if (isCompleted && xpGained > 0) {
        setXpGainedNotification(xpGained);
      } 
      const updatedQuests = prev.availableQuests.map(quest => {
        if (quest.isCompleted) return quest;

        let shouldUpdate = false;
        let newProgress = quest.currentProgress;

        switch (quest.type) {
          case "DAILY_PERSONAL":
          case "WEEKLY_PERSONAL":
            if (taskType === "ПРАВДА" && quest.title === "Мастер Правды") {
              shouldUpdate = true;
              newProgress = quest.currentProgress + 1;
            } else if (taskType === "ДЕЙСТВИЕ" && quest.title === "Смельчак") {
              shouldUpdate = true;
              newProgress = quest.currentProgress + 1;
            } else if (quest.title === "Серийный Игрок") {
              shouldUpdate = true;
              newProgress = newStreak;
            }
            break;
          case "COMMUNITY_GOAL":
            if (isCompleted) {
              shouldUpdate = true;
              newProgress = quest.currentProgress + 1;
            }
            break;
        }

        if (!shouldUpdate) return quest;

        const isNowCompleted = newProgress >= quest.targetValue;
        return {
          ...quest,
          currentProgress: newProgress,
          isCompleted: isNowCompleted
        };
      });
      const updatedCommunityQuests = prev.communityQuests.map(quest => {
        if (quest.isCompleted || !isCompleted) return quest;

        const newProgress = quest.currentProgress + 1;
        const isNowCompleted = newProgress >= quest.targetValue;
        
        return {
          ...quest,
          currentProgress: newProgress,
          isCompleted: isNowCompleted
        };
      });

      const newStats: PlayerStats = {
        ...prev.playerStats,
        points: (prev.playerStats.points || 0) + points,
        xp: newXp,
        tasksCompleted: isCompleted ? (prev.playerStats.tasksCompleted || 0) + 1 : prev.playerStats.tasksCompleted || 0,
        truthsAnswered: isCompleted && taskType === "ПРАВДА" ? (prev.playerStats.truthsAnswered || 0) + 1 : prev.playerStats.truthsAnswered || 0,
        daresCompleted: isCompleted && taskType === "ДЕЙСТВИЕ" ? (prev.playerStats.daresCompleted || 0) + 1 : prev.playerStats.daresCompleted || 0,
        currentStreak: newStreak,
        maxStreak: Math.max(newStreak, prev.playerStats.maxStreak || 0),
        level: calculateLevel(newXp),
        hardTasksCompleted: isCompleted && prev.difficulty === "hard" ? (prev.playerStats.hardTasksCompleted || 0) + 1 : prev.playerStats.hardTasksCompleted || 0
      };

      return {
        ...prev,
        playerStats: newStats,
        lastTaskTimestamp: Date.now(),
        availableQuests: updatedQuests,
        communityQuests: updatedCommunityQuests
      };
    });
  };

  const generateTaskId = (result: string, task: string) => {
    return `${result}-${task}-${Date.now()}`;
  };

  const playGame = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setResult(null);
    setTask(null);
    setTimeLeft(null);
    setCurrentTaskId(null);
    
    const timeoutId = setTimeout(() => {
      const random = Math.random();
      const newResult = random < 0.8 ? "ПРАВДА" : "ДЕЙСТВИЕ";
      
      const selectedCategoryData = gameData.categories.find(cat => cat.id === gameState.selectedCategory);
      const tasksPool = selectedCategoryData ? (newResult === "ПРАВДА" ? selectedCategoryData.truths : selectedCategoryData.actions) : [];

      if (tasksPool.length === 0) {
        toast({
          title: "Нет заданий",
          description: `В категории "${selectedCategoryData?.name || 'выбранной категории'}" нет заданий для "${newResult}"`, 
        });
        setIsAnimating(false);
        return;
      }

      const randomTask = tasksPool[Math.floor(Math.random() * tasksPool.length)];
      const newTaskId = generateTaskId(newResult, randomTask);
      
      setResult(newResult);
      setTask(randomTask);
      setCurrentTaskId(newTaskId);
      setHistory(prev => [...prev, {result: newResult, task: randomTask}]);
      setIsAnimating(false);
      
      if (newResult === "ДЕЙСТВИЕ") {
        setTimeLeft(60);
      }
      
      triggerConfetti();
      
      toast({
        title: "Результат",
        description: `Вам выпало: ${newResult}`,
      });
    }, 1500);
    
    return () => clearTimeout(timeoutId);
  };

  const selectManually = (choice: "ПРАВДА" | "ДЕЙСТВИЕ") => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setResult(null);
    setTask(null);
    setTimeLeft(null);
    setCurrentTaskId(null);
    
    const timeoutId = setTimeout(() => {
      const selectedCategoryData = gameData.categories.find(cat => cat.id === gameState.selectedCategory);
      const tasksPool = selectedCategoryData ? (choice === "ПРАВДА" ? selectedCategoryData.truths : selectedCategoryData.actions) : [];

       if (tasksPool.length === 0) {
        toast({
          title: "Нет заданий",
          description: `В категории "${selectedCategoryData?.name || 'выбранной категории'}" нет заданий для "${choice}"`, 
        });
        setIsAnimating(false);
        return;
      }

      const randomTask = tasksPool[Math.floor(Math.random() * tasksPool.length)];
      const newTaskId = generateTaskId(choice, randomTask);
      
      setResult(choice);
      setTask(randomTask);
      setCurrentTaskId(newTaskId);
      setHistory(prev => [...prev, {result: choice, task: randomTask}]);
      setIsAnimating(false);
      
      if (choice === "ДЕЙСТВИЕ") {
        setTimeLeft(60);
      }
      
      triggerConfetti();
      
      toast({
        title: "Результат",
        description: `Вы выбрали: ${choice}`,
      });
    }, 1500);
    
    return () => clearTimeout(timeoutId);
  };

  const completeTask = (completed: boolean) => {
    if (!result || !task || !currentTaskId) return;
    
    if (completedTasks.has(currentTaskId)) {
      toast({
        title: "Ошибка",
        description: "Это задание уже было выполнено!",
      });
      return;
    }
    
    const newCompletedTasks = new Set(completedTasks);
    newCompletedTasks.add(currentTaskId);
    setCompletedTasks(newCompletedTasks);
    
    if (!completed && gameState.playerStats.skipTokens && gameState.playerStats.skipTokens > 0) {
      setGameState(prev => ({
        ...prev,
        playerStats: {
          ...prev.playerStats,
          skipTokens: (prev.playerStats.skipTokens || 1) - 1,
          points: prev.playerStats.points + DIFFICULTY_POINTS[prev.difficulty],
          tasksCompleted: prev.playerStats.tasksCompleted + 1,
          xp: prev.playerStats.xp + getXpReward(prev.difficulty),
        }
      }));
      
      toast({
        title: "Использован пропуск",
        description: `Осталось пропусков: ${(gameState.playerStats.skipTokens || 1) - 1}`,
      });
    } else {
      updatePlayerStats(completed, result);
    }
    
    setTimeLeft(null);
    
    toast({
      title: completed ? "Задание выполнено!" : "Задание пропущено",
      description: completed 
        ? `+${DIFFICULTY_POINTS[gameState.difficulty]} очков` 
        : gameState.playerStats.skipTokens && gameState.playerStats.skipTokens > 0 
          ? "Использован пропуск без штрафа"
          : "Серия прервана",
    });

    setTimeout(() => {
      setResult(null);
      setTask(null);
    }, 500);
  };

  const shareResult = () => {
    if (!result || !task) return;
    
    const shareText = `Правда или Действие: Мне выпало "${result}" - ${task}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Правда или Действие',
        text: shareText,
      }).then(() => {
        completeTask(true);
        setGameState(prev => ({
          ...prev,
          playerStats: {
            ...prev.playerStats,
            sharedTasks: (prev.playerStats.sharedTasks || 0) + 1
          }
        }));
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        completeTask(true);
        setGameState(prev => ({
          ...prev,
          playerStats: {
            ...prev.playerStats,
            sharedTasks: (prev.playerStats.sharedTasks || 0) + 1
          }
        }));
        toast({
          title: "Скопировано",
          description: "Текст скопирован в буфер обмена",
        });
      });
    }
  };

  const shareToTelegram = () => {
    if (!result || !task) return;
    
    const encodedResult = encodeURIComponent(result);
    const encodedTask = encodeURIComponent(task);
    const shareUrl = `${window.location.href.split('?')[0]}?result=${encodedResult}&task=${encodedTask}`;
    
    const shareText = encodeURIComponent(`Правда или Действие: Мне выпало "${result}" - ${task}. Нажми на ссылку, чтобы ответить на вопрос или выполнить действие вместе со мной!`);
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${shareText}`;
    
    window.open(telegramUrl, '_blank');
    completeTask(true);
    setGameState(prev => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        sharedTasks: (prev.playerStats.sharedTasks || 0) + 1
      }
    }));
    
    toast({
      title: "Telegram",
      description: "Открываем Telegram для отправки",
    });
  };

  const shareHistoryItemToTelegram = (item: {result: string, task: string}) => {
    const encodedResult = encodeURIComponent(item.result);
    const encodedTask = encodeURIComponent(item.task);
    const shareUrl = `${window.location.href.split('?')[0]}?result=${encodedResult}&task=${encodedTask}`;
    
    const shareText = encodeURIComponent(`Правда или Действие: Мне выпало "${item.result}" - ${item.task}. Нажми на ссылку, чтобы ответить на вопрос или выполнить действие вместе со мной!`);
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${shareText}`;
    
    window.open(telegramUrl, '_blank');
    
    setGameState(prev => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        sharedTasks: (prev.playerStats.sharedTasks || 0) + 1
      }
    }));
    
    toast({
      title: "Telegram",
      description: "Открываем Telegram для отправки",
    });
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const resetProgress = () => {
    setGameState(INITIAL_GAME_STATE);
    setCompletedTasks(new Set());
    setHistory([]);
    
    localStorage.removeItem('truthOrDareGameState');
    localStorage.removeItem('truthOrDareCompletedTasks');
    
    toast({
      title: "Прогресс сброшен",
      description: "Все достижения и очки обнулены",
    });
    
    setShowResetConfirm(false);
    setShowSettings(false);
  };

  const purchaseItem = (item: ShopItem) => {
    if (gameState.playerStats.points < item.price) {
      setShopError('Недостаточно очков для покупки!');
      return;
    }

    setGameState(prev => {
      const newState = item.action(prev);
      
      toast({
        title: "Покупка успешна!",
        description: item.name + (newState.surpriseMessage ? ` (${newState.surpriseMessage})` : ''),
      });

      if (newState.surpriseMessage) {
        delete newState.surpriseMessage;
      }

      return newState;
    });

    setShopError(null);
  };

  const handleClaimQuestReward = (quest: Quest) => {
    if (!quest.isCompleted || quest.reward.claimed) return;

    setGameState(prev => {
      const newState = { ...prev };
      if (quest.reward.points) {
        newState.playerStats.points += quest.reward.points;
      }
      if (quest.reward.xp) {
        newState.playerStats.xp += quest.reward.xp;
      }
      if (quest.reward.badgeId && !newState.playerStats.badges.includes(quest.reward.badgeId)) {
        newState.playerStats.badges.push(quest.reward.badgeId);
      }
      if (quest.reward.items) {
        quest.reward.items.forEach(item => {
          if (item.itemId === "skip") {
            newState.playerStats.skipTokens = (newState.playerStats.skipTokens || 0) + item.quantity;
          }
        });
      }
      if (quest.reward.tempBoost) {
        if (quest.reward.tempBoost.type === "XP_BOOST") {
          newState.playerStats.xpBoostEndTime = Date.now() + quest.reward.tempBoost.durationHours * 60 * 60 * 1000;
        }
      }
      const questIndex = newState.availableQuests.findIndex(q => q.id === quest.id);
      if (questIndex !== -1) {
        newState.availableQuests[questIndex].reward.claimed = true;
      }
      newState.playerStats.completedQuests.push(quest.id);
      newState.playerStats.activeQuests = newState.playerStats.activeQuests.filter(id => id !== quest.id);

      toast({
        title: "Награда получена!",
        description: `Вы получили награду за квест "${quest.title}"`,
      });

      return newState;
    });
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${getBackgroundClass()} p-4 transition-colors duration-500`}>
      <div className="w-full max-w-md relative">
        {sharedContent && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }}
            exit={{ opacity: 0, y: -30, transition: { duration: 0.2 } }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md" 
          >
            <div
              className="absolute inset-0"
              onClick={dismissSharedContent}
            ></div>
            <motion.div
              className="bg-gradient-to-br from-gray-900 to-gray-800 w-full max-w-md mx-auto p-8 rounded-3xl shadow-2xl border border-gray-700 relative z-10 overflow-hidden"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            >
              <h3 className="text-2xl font-semibold text-white mb-6 text-center">👋 Привет!</h3>
              <p className="text-gray-300 mb-6 text-center">Твоему другу/подруге выпало:</p>

              <div
                className={`px-6 py-4 rounded-xl mb-6 font-semibold text-lg flex items-center justify-center ${
                  sharedContent.result === "ПРАВДА"
                    ? "bg-blue-600/20 text-blue-300 border border-blue-600/30"
                    : "bg-red-600/20 text-red-300 border border-red-600/30"
                }`}
              >
                <span className="mr-3">{sharedContent.result}</span>
                <span>{sharedContent.task}</span>
              </div>

              <p className="text-gray-300 mb-8 text-center">Ответьте на вопрос или выполните действие вдвоем!</p>

              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)" }} 
                  whileTap={{ scale: 0.95 }}
                  onClick={dismissSharedContent}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Понятно, играем!
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Правда или Действие</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCustomTaskForm(true)}
              className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              title="Создать своё задание"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card/90 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md border border-white/20 relative overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-accent/10 blur-2xl"></div>
                <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-primary/10 blur-2xl"></div>
                
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <h2 className="text-2xl font-bold text-foreground">Настройки</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-foreground/10 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10">
                    <h3 className="font-semibold mb-3">Статистика</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Всего очков:</span>
                        <span className="font-medium">{gameState.playerStats.points}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Уровень:</span>
                        <span className="font-medium">{gameState.playerStats.level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Опыт:</span>
                        <span className="font-medium">{gameState.playerStats.xp} / {calculateXpForNextLevel(gameState.playerStats.level)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Заданий выполнено:</span>
                        <span className="font-medium">{gameState.playerStats.tasksCompleted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Правда:</span>
                        <span className="font-medium">{gameState.playerStats.truthsAnswered}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Действие:</span>
                        <span className="font-medium">{gameState.playerStats.daresCompleted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Лучшая серия:</span>
                        <span className="font-medium">{gameState.playerStats.maxStreak}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Тема оформления</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["default", "dark", "party"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`py-2 px-3 rounded-lg text-sm transition ${theme === t ? "bg-foreground text-primary" : "bg-foreground/20 hover:bg-foreground/30"}`}
                        >
                          {t === "default" ? "Стандарт" : t === "dark" ? "Темная" : "Вечеринка"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Категория заданий</label>
                    <div className="grid grid-cols-2 gap-2">
                      {gameData.categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setGameState(prev => ({ ...prev, selectedCategory: category.id }))}
                          className={`py-2 px-3 rounded-lg text-sm transition ${gameState.selectedCategory === category.id ? "bg-foreground text-primary" : "bg-foreground/20 hover:bg-foreground/30"}`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Сложность</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => (
                        <button
                          key={diff}
                          onClick={() => setGameState(prev => ({ ...prev, difficulty: diff }))}
                          className={`py-2 px-3 rounded-lg text-sm transition ${gameState.difficulty === diff ? "bg-foreground text-primary" : "bg-foreground/20 hover:bg-foreground/30"}`}
                        >
                          {diff === "easy" ? "Легко" : diff === "medium" ? "Средне" : "Сложно"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-foreground/10">
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="w-full py-3 px-4 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      Сбросить прогресс
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          layout
          className="bg-card/90 backdrop-blur-lg rounded-2xl p-8 shadow-lg mb-8 border border-white/20 relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-accent/10 blur-2xl"></div>
          <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-primary/10 blur-2xl"></div>
          
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-center relative z-10"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                  className="inline-block bg-gradient-to-br from-foreground to-foreground/80 text-primary px-6 py-3 rounded-xl mb-6"
                >
                  <h2 className="text-4xl md:text-5xl font-bold break-words">
                    {result}
                  </h2>
                </motion.div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-foreground/90 text-base md:text-lg font-medium leading-relaxed">
                    {task}
                  </p>
                  <div className="mt-6 flex justify-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={shareResult}
                      className="inline-flex items-center text-sm text-foreground/60 hover:text-foreground bg-foreground/10 hover:bg-foreground/20 rounded-full px-3 py-1"
                    >
                      <Share size={14} className="mr-1" />
                      Поделиться
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={shareToTelegram}
                      className="inline-flex items-center text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-full px-3 py-1"
                    >
                      <Send size={14} className="mr-1" />
                      Telegram
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="waiting"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="h-[180px] flex flex-col items-center justify-center"
              >
                {isAnimating ? (
                  <>
                    <motion.div
                      className="w-20 h-20 rounded-full border-4 border-t-transparent border-foreground/30"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.p 
                      className="text-base md:text-lg text-foreground/60 mt-4"
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Выбираем...
                    </motion.p>
                  </>
                ) : (
                  <>
                    <motion.div
                      className="bg-foreground/10 p-6 rounded-full mb-4"
                      whileHover={{ scale: 1.05, rotate: 5 }}
                    >
                      <ArrowRight className="w-8 h-8 text-foreground/60" />
                    </motion.div>
                    <p className="text-base md:text-lg text-foreground/60">
                      Нажмите кнопку, чтобы начать
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <div className="mt-8">
          <motion.button
            onClick={playGame}
            className="w-full bg-gradient-to-r from-foreground to-foreground/90 text-primary rounded-xl py-4 px-8 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            disabled={isAnimating}
          >
            {isAnimating ? (
              <span className="flex items-center justify-center">
                <motion.span 
                  className="w-5 h-5 bg-primary/80 rounded-full inline-block mr-2"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                Выбираем...
              </span>
            ) : result ? "Играть снова" : "Случайный выбор"}
          </motion.button>

          <div className="w-full grid grid-cols-2 gap-4 mt-4">
            <motion.button
              onClick={() => selectManually("ПРАВДА")}
              className="bg-foreground/80 text-primary rounded-xl py-4 px-8 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={isAnimating}
            >
              Правда
            </motion.button>
            <motion.button
              onClick={() => selectManually("ДЕЙСТВИЕ")}
              className="bg-foreground/80 text-primary rounded-xl py-4 px-8 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={isAnimating}
            >
              Действие
            </motion.button>
          </div>
        </div>
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8"
          >
            <details className="group">
              <summary className="flex items-center cursor-pointer text-sm text-foreground/60 hover:text-foreground/80">
                <span>История ({history.length})</span>
                <motion.span 
                  animate={{ rotate: 0 }}
                  className="ml-2 transition-transform group-open:rotate-180"
                >▼</motion.span>
              </summary>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                className="mt-2 space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-foreground/20 scrollbar-track-transparent"
              >
                {history.slice().reverse().map((item, i) => (
                  <div 
                    key={i} 
                    className="bg-card/50 backdrop-blur-sm p-3 rounded-lg border border-white/10 text-sm flex justify-between items-center"
                  >
                    <div>
                      <span className={`font-semibold ${item.result === "ПРАВДА" ? "text-blue-400" : "text-red-400"}`}>
                        {item.result}:
                      </span> {item.task}
                    </div>
                    <button 
                      onClick={() => shareHistoryItemToTelegram(item)}
                      className="ml-2 p-1 text-blue-400 hover:text-blue-600 rounded-full hover:bg-white/10"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                ))}
              </motion.div>
            </details>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/90 backdrop-blur-lg rounded-xl p-4 mt-6 mb-12 flex justify-between items-center"
        >
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            <span className="font-semibold">{gameState.playerStats.points}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="font-semibold">Ур. {gameState.playerStats.level}</span>
              <div className="w-20 h-1 bg-foreground/20 rounded-full mt-1">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ 
                    width: `${calculateProgress(
                      gameState.playerStats.xp,
                      gameState.playerStats.level
                    )}%` 
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5" />
            <span className="font-semibold">{gameState.playerStats.currentStreak}</span>
          </div>
        </motion.div>
        <div className="grid grid-cols-1 gap-4 mb-8">
          {timeLeft !== null && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed top-4 right-4 bg-card/90 backdrop-blur-lg rounded-full p-3 flex items-center gap-2"
            >
              <Timer className="w-5 h-5" />
              <span className="font-semibold">{timeLeft}s</span>
            </motion.div>
          )}

          {result && currentTaskId && !completedTasks.has(currentTaskId) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 grid grid-cols-2 gap-4"
            >
              <motion.button
                onClick={() => completeTask(true)}
                className="bg-green-500 text-white rounded-xl py-3 px-6 font-semibold shadow-lg hover:bg-green-600"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Выполнено
              </motion.button>
              <motion.button
                onClick={() => completeTask(false)}
                className="bg-red-500 text-white rounded-xl py-3 px-6 font-semibold shadow-lg hover:bg-red-600"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Пропустить
              </motion.button>
            </motion.div>
          )}

          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowShop(true)}
              className="flex-1 flex flex-col items-center p-3 rounded-xl bg-card/90 backdrop-blur-lg border border-white/20"
            >
              <Gift className="w-6 h-6 mb-1" />
              <span className="text-xs">Магазин</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowQuests(true)}
              className="flex-1 flex flex-col items-center p-3 rounded-xl bg-card/90 backdrop-blur-lg border border-white/20"
            >
              <Trophy className="w-6 h-6 mb-1" />
              <span className="text-xs">Квесты</span>
            </motion.button>
          </div>
        </div>
        <AnimatePresence>
          {showResetConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card/90 backdrop-blur-lg rounded-xl p-6 m-4 max-w-md w-full"
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-4">Сбросить прогресс?</h2>
                <p className="text-foreground/60 mb-6">
                  Это действие удалит все ваши достижения, очки и историю игр. Это действие нельзя отменить.
                </p>
                <div className="flex gap-4">
                  <motion.button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-foreground/20 text-foreground hover:bg-foreground/30 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Отмена
                  </motion.button>
                  <motion.button
                    onClick={resetProgress}
                    className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Сбросить
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showCustomTaskForm && (
            <CustomTaskForm 
              onClose={() => setShowCustomTaskForm(false)}
              customTask={customTask}
              setCustomTask={setCustomTask}
            />
          )}
        </AnimatePresence>
        {showShop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowShop(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card/90 backdrop-blur-lg rounded-xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Магазин</h2>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  <span className="font-semibold">{gameState.playerStats.points}</span>
                </div>
              </div>
              {shopError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                  {shopError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {SHOP_ITEMS.map(item => (
                  <div key={item.id} className="p-4 rounded-lg bg-foreground/10">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-foreground/60 mb-2">{item.description}</p>
                    <button
                      onClick={() => purchaseItem(item)}
                      className={`w-full py-2 px-3 rounded-lg text-sm transition-colors ${
                        gameState.playerStats.points >= item.price
                          ? "bg-primary text-white hover:bg-primary/90"
                          : "bg-foreground/20 text-foreground/40 cursor-not-allowed"
                      }`}
                      disabled={gameState.playerStats.points < item.price}
                    >
                      {item.price} очков
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
        <AnimatePresence>
          {showQuests && (
            <QuestsPanel
              quests={gameState.availableQuests}
              playerStats={gameState.playerStats}
              onClaimReward={handleClaimQuestReward}
              onClose={() => setShowQuests(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;