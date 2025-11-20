import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, RotateCcw, Clock, Check, X } from 'lucide-react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import WordCard from '@/components/WordCard';
import { useTiltActions } from '@/hooks/useTiltActions';
import { useRoundTimer } from '@/hooks/useRoundTimer';

const ROUND_DURATION = 60; // total round time in seconds
const ACTION_DISPLAY_TIME = 500; // milliseconds to show action feedback

export default function GameScreen() {
  const { category, words } = useLocalSearchParams();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [showingAction, setShowingAction] = useState<'correct' | 'pass' | null>(null);
  const [countdown, setCountdown] = useState<number | null>(3);
  const tiltActionsDisabled = useRef(false);
  const actionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const originalWordList = typeof words === 'string' ? JSON.parse(words) : [];
  const [wordList, setWordList] = useState<string[]>([]);
  const usedIndices = useRef<Set<number>>(new Set());

  // Fisher-Yates shuffle for better randomization
  const shuffleArray = (array: string[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Initialize shuffled word list
  useEffect(() => {
    const shuffled = shuffleArray(originalWordList);
    setWordList(shuffled);
    // Start with a random word
    const randomStart = Math.floor(Math.random() * shuffled.length);
    setCurrentIndex(randomStart);
    usedIndices.current.add(randomStart);
  }, []);

  // Round timer - end game when round is over
  const roundTimer = useRoundTimer(ROUND_DURATION, () => {
    handleRoundEnd();
  });

  useEffect(() => {
    // Lock orientation to landscape when game screen mounts
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

    // Start countdown
    startCountdown();

    // Restore to portrait when component unmounts
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
      if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
    };
  }, []);

  const startCountdown = () => {
    tiltActionsDisabled.current = true;
    setCountdown(3);

    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(countdownInterval);
        setCountdown(null);
        tiltActionsDisabled.current = false;
        // Start the round timer after countdown
        roundTimer.start();
      }
    }, 1000);

    countdownTimeoutRef.current = countdownInterval as any;
  };

  const handleRoundEnd = () => {
    setGameEnded(true);
    tiltActionsDisabled.current = true;

    Alert.alert(
      'Round Over!',
      `Final Score:\nCorrect: ${score}\nPassed: ${passed}`,
      [
        {
          text: 'Back to Menu',
          onPress: () => router.back(),
        },
        {
          text: 'Play Again',
          onPress: handleRestart,
        },
      ]
    );
  };

  const handleCorrect = () => {
    if (gameEnded || tiltActionsDisabled.current || showingAction || countdown !== null) return;

    // Show correct action feedback
    setShowingAction('correct');
    setScore(score + 1);

    // Move to next random word after delay
    if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
    actionTimeoutRef.current = setTimeout(() => {
      setShowingAction(null);
      getNextRandomWord();
    }, ACTION_DISPLAY_TIME);
  };

  const handlePass = () => {
    if (gameEnded || tiltActionsDisabled.current || showingAction || countdown !== null) return;

    // Show pass action feedback
    setShowingAction('pass');
    setPassed(passed + 1);

    // Move to next random word after delay
    if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
    actionTimeoutRef.current = setTimeout(() => {
      setShowingAction(null);
      getNextRandomWord();
    }, ACTION_DISPLAY_TIME);
  };

  const getNextRandomWord = () => {
    // If all words have been used, reshuffle and start fresh
    if (usedIndices.current.size >= wordList.length) {
      const reshuffled = shuffleArray(wordList);
      setWordList(reshuffled);
      usedIndices.current.clear();
      const newIndex = Math.floor(Math.random() * reshuffled.length);
      usedIndices.current.add(newIndex);
      setCurrentIndex(newIndex);
      return;
    }

    // Get available indices
    const availableIndices = [];
    for (let i = 0; i < wordList.length; i++) {
      if (!usedIndices.current.has(i)) {
        availableIndices.push(i);
      }
    }

    // Pick a random one from available
    const randomAvailableIndex = Math.floor(Math.random() * availableIndices.length);
    const newIndex = availableIndices[randomAvailableIndex];

    usedIndices.current.add(newIndex);
    setCurrentIndex(newIndex);
  };

  // Only enable tilt actions when game is active
  useTiltActions({
    onCorrect: handleCorrect,
    onPass: handlePass,
  });

  const handleRestart = () => {
    setScore(0);
    setPassed(0);
    setGameEnded(false);
    setShowingAction(null);
    usedIndices.current.clear();
    if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
    if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);

    // Reshuffle words and start with random word
    const shuffled = shuffleArray(originalWordList);
    setWordList(shuffled);
    const randomStart = Math.floor(Math.random() * shuffled.length);
    setCurrentIndex(randomStart);
    usedIndices.current.add(randomStart);

    // Start countdown again
    startCountdown();
  };

  return (
    <SafeAreaView style={styles.container}>
      {countdown !== null ? (
        // Show countdown screen
        <View style={styles.countdownScreen}>
          <Text style={styles.countdownText}>{countdown}</Text>
          <Text style={styles.countdownLabel}>Get Ready!</Text>
        </View>
      ) : showingAction ? (
        // Show action feedback screen
        <View
          style={[
            styles.actionFeedback,
            showingAction === 'correct' ? styles.correctFeedback : styles.passFeedback,
          ]}>
          {showingAction === 'correct' ? (
            <>
              <Check size={120} color="#ffffff" strokeWidth={3} />
              <Text style={styles.actionText}>CORRECT!</Text>
            </>
          ) : (
            <>
              <X size={120} color="#ffffff" strokeWidth={3} />
              <Text style={styles.actionText}>PASS</Text>
            </>
          )}
        </View>
      ) : (
        // Show normal game screen
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={28} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.categoryTitle}>{category}</Text>
            <View style={styles.timerContainer}>
              <Clock size={20} color="#6b7280" />
              <Text style={styles.roundTimer}>{roundTimer.roundRemaining}s</Text>
            </View>
          </View>

          <View style={styles.scoreContainer}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Correct</Text>
              <Text style={styles.scoreValue}>{score}</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Passed</Text>
              <Text style={styles.scoreValue}>{passed}</Text>
            </View>
          </View>

          <View style={styles.cardContainer}>
            <WordCard word={wordList[currentIndex]} />
          </View>
        </>
      )}

      <TouchableOpacity
        style={styles.restartButton}
        onPress={handleRestart}
        activeOpacity={0.7}>
        <RotateCcw size={20} color="#6b7280" />
        <Text style={styles.restartText}>Restart</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  countdownScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    gap: 16,
  },
  countdownText: {
    fontSize: 160,
    fontWeight: '900',
    color: '#ffffff',
  },
  countdownLabel: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
  },
  actionFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  correctFeedback: {
    backgroundColor: '#10b981',
  },
  passFeedback: {
    backgroundColor: '#ef4444',
  },
  actionText: {
    fontSize: 56,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roundTimer: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 16,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 4,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginBottom: 16,
  },
  restartText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
});
