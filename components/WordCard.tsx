import { StyleSheet, Text, View } from 'react-native';

interface WordCardProps {
  word: string;
}

export default function WordCard({ word }: WordCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.word}>{word}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 48,
    minHeight: 280,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  word: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
});
