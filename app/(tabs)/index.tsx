import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import CategoryList from '@/components/CategoryList';
import gameData from '@/assets/data.json';

export default function HomeScreen() {
  const router = useRouter();

  const categories = Object.keys(gameData);

  const handleSelectCategory = (category: string) => {
    const words = gameData[category as keyof typeof gameData];
    router.push({
      pathname: '/game',
      params: {
        category,
        words: JSON.stringify(words),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Heads Up!</Text>
        <Text style={styles.subtitle}>Choose a category to start playing</Text>
      </View>
      <CategoryList categories={categories} onSelectCategory={handleSelectCategory} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});
