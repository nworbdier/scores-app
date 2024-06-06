import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, StyleSheet, RefreshControl } from 'react-native';

const PGA = () => {
  const [playersData, setPlayersData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const fetchPGAData = async () => {
    try {
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?dates=${currentDate}`
      );
      const data = await response.json();

      const extractedData = data.events.map((event) => {
        const players = event.competitions[0].competitors.map((competitor) => {
          let thru = 0;
          if (
            competitor.linescores &&
            competitor.linescores[0] &&
            competitor.linescores[0].linescores
          ) {
            thru = competitor.linescores.reduce(
              (count, score) => count + (score.linescores ? score.linescores.length : 0),
              0
            );
          }
          return {
            pl: competitor.order,
            name: competitor.athlete.displayName,
            headshot: competitor.athlete.headshot,
            today: competitor.linescores[0].value,
            thru,
            tot: competitor.score,
          };
        });
        return players;
      });

      const flattenedData = extractedData.flat();

      setPlayersData(flattenedData);
    } catch (error) {
      console.error('Error fetching PGA data:', error);
    }
  };

  useEffect(() => {
    fetchPGAData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPGAData();
    setRefreshing(false);
  };

  const renderPlayer = ({ item }) => (
    <View style={styles.playerRow}>
      <View style={styles.leftContainer}>
        <Text style={styles.playerPosition}>{item.pl}</Text>
        <Image source={{ uri: item.headshot }} style={styles.headshot} />
        <Text style={styles.playerName}>{item.name}</Text>
      </View>
      <View style={styles.rightContainer}>
        <Text style={styles.playerToday}>{item.today}</Text>
        <Text style={styles.playerThru}>{item.thru}</Text>
        <Text style={styles.playerTotal}>{item.tot}</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={playersData}
      renderItem={renderPlayer}
      keyExtractor={(item) => item.pl.toString()}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );
};

const styles = StyleSheet.create({
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  leftContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    alignItems: 'center',
  },
  playerPosition: {
    width: 30,
    textAlign: 'center',
    color: 'white',
  },
  headshot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  playerName: {
    color: 'white',
    flex: 1,
  },
  playerToday: {
    width: 50,
    textAlign: 'center',
    color: 'white',
  },
  playerThru: {
    width: 50,
    textAlign: 'center',
    color: 'white',
  },
  playerTotal: {
    width: 50,
    textAlign: 'center',
    color: 'white',
  },
  listContent: {
    paddingHorizontal: 10,
  },
});

export default PGA;
