import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView, RefreshControl } from 'react-native';

import { RootStackParamList } from '../navigation';

type ScoresScreenNavigationProps = StackNavigationProp<RootStackParamList, 'Scores'>;

type Competitor = {
  name: string;
  symbolicName: string;
  score: number;
};

type Game = {
  id: string;
  homeCompetitor: Competitor;
  awayCompetitor: Competitor;
  gameTimeDisplay: string;
  shortStatusText: string;
};

const url =
  'https://allscores.p.rapidapi.com/api/allscores/custom-scores?langId=1&timezone=America%2FChicago&competitions=438&startDate=28%2F05%2F2024&endDate=28%2F05%2F2024';
const options = {
  method: 'GET',
  headers: {
    'x-rapidapi-key': 'b5085a79ffmsh6fae92970b1a422p1c6e8ajsnb4013fb16637',
    'x-rapidapi-host': 'allscores.p.rapidapi.com',
  },
};

export default function Scores() {
  const navigation = useNavigation<ScoresScreenNavigationProps>();
  const [games, setGames] = useState<Game[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScores = async () => {
    try {
      const response = await fetch(url, options);
      const result = await response.json();
      setGames(result.games);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchScores();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Game }) => (
    <View style={styles.gameContainer}>
      <View style={styles.playerContainer}>
        <View style={styles.player}>
          <Text style={styles.symbolicName}>{item.homeCompetitor.symbolicName}</Text>
          <Text style={styles.score}>{item.homeCompetitor.score}</Text>
        </View>
        <View style={styles.gameInfo}>
          {item.shortStatusText === 'Just Ended' || item.shortStatusText === 'Final' ? (
            <Text style={styles.shortStatusText}>Final</Text>
          ) : (
            <Text style={styles.gameTimeText}>{item.gameTimeDisplay}</Text>
          )}
        </View>
        <View style={styles.player}>
          <Text style={styles.symbolicName}>{item.awayCompetitor.symbolicName}</Text>
          <Text style={styles.score}>{item.awayCompetitor.score}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={games}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.grid}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  grid: {
    justifyContent: 'center',
  },
  gameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  playerContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 10,
    padding: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  player: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameInfo: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  gameTimeText: {
    fontSize: 16,
    color: '#666',
  },
  shortStatusText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  symbolicName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  score: {
    fontSize: 16,
    marginBottom: 5,
  },
});
