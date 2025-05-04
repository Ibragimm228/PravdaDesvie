import { Achievement } from '@/types/game';
import { Trophy, Star, Zap, Heart, Flame, Crown, Medal } from 'lucide-react';

export const achievements: Achievement[] = [
  {
    id: 'beginner',
    title: 'Новичок',
    description: 'Выполните первые 5 заданий',
    icon: 'Star',
    condition: {
      type: 'tasksCompleted',
      value: 5
    }
  },
  {
    id: 'truthSeeker',
    title: 'Искатель правды',
    description: 'Ответьте на 10 вопросов правды',
    icon: 'Heart',
    condition: {
      type: 'truthsAnswered',
      value: 10
    }
  },
  {
    id: 'daredevil',
    title: 'Сорвиголова',
    description: 'Выполните 10 действий',
    icon: 'Zap',
    condition: {
      type: 'daresCompleted',
      value: 10
    }
  },
  {
    id: 'streakMaster',
    title: 'Мастер серий',
    description: 'Достигните серии из 5 заданий подряд',
    icon: 'Flame',
    condition: {
      type: 'streakReached',
      value: 5
    }
  },
  {
    id: 'pointsHunter',
    title: 'Охотник за очками',
    description: 'Наберите 1000 очков',
    icon: 'Trophy',
    condition: {
      type: 'pointsEarned',
      value: 1000
    }
  },
  {
    id: 'champion',
    title: 'Чемпион',
    description: 'Выполните 50 заданий',
    icon: 'Crown',
    condition: {
      type: 'tasksCompleted',
      value: 50
    }
  },
  {
    id: 'legend',
    title: 'Легенда',
    description: 'Наберите 5000 очков',
    icon: 'Medal',
    condition: {
      type: 'pointsEarned',
      value: 5000
    }
  }
]; 