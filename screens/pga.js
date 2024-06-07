import moment from 'moment';
import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, StyleSheet, RefreshControl } from 'react-native';

const PGA = () => {
  const [playersData, setPlayersData] = useState([]);
  const [tournamentName, setTournamentName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const fetchEventId = async () => {
    try {
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?dates=${currentDate}`
      );
      const data = await response.json();
      return data.events[0].id;
    } catch (error) {
      console.error('Error fetching event ID:', error);
    }
  };

  const fetchPGAData = async (eventId) => {
    try {
      const response = await fetch(
        `https://site.web.api.espn.com/apis/site/v2/sports/golf/leaderboard?league=pga&event=${eventId}`
      );
      const data = await response.json();

      setTournamentName(data.events[0].tournament.displayName);

      const players = data.events[0].competitions[0].competitors
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((competitor) => {
          const period = competitor.status.period;
          let today = '-';
          let thru = competitor.status.thru;

          if (competitor.linescores && competitor.linescores.length > 0) {
            const lineScoreIndex = period - 1;
            if (lineScoreIndex >= 0 && lineScoreIndex < competitor.linescores.length) {
              today = competitor.linescores[lineScoreIndex].displayValue || '-';
            }
            if (thru === 0 && competitor.linescores[1]) {
              thru = moment(competitor.linescores[1].teeTime).format('h:mm A');
            }
          }

          return {
            pl: competitor.status.position.displayName,
            name: competitor.athlete.displayName,
            today,
            thru,
            tot: competitor.score.displayValue,
          };
        });

      setPlayersData(players);
    } catch (error) {
      console.error('Error fetching PGA data:', error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      const eventId = await fetchEventId();
      if (eventId) {
        await fetchPGAData(eventId);
      }
    };

    initializeData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const eventId = await fetchEventId();
    if (eventId) {
      await fetchPGAData(eventId);
    }
    setRefreshing(false);
  };

  const renderPlayer = ({ item }) => (
    <View style={styles.playerRow}>
      <View style={styles.leftContainer}>
        <Text style={styles.playerPosition}>{item.pl}</Text>
        {item.headshot ? <Image source={{ uri: item.headshot }} style={styles.headshot} /> : null}
        <Text style={styles.playerName}>{item.name}</Text>
      </View>
      <View style={styles.rightContainer}>
        <Text style={styles.playerToday}>{item.today}</Text>
        <Text style={styles.playerThru}>{item.thru}</Text>
        <Text style={styles.playerTotal}>{item.tot}</Text>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View>
      <Text style={styles.tournamentName}>{tournamentName}</Text>
      <View style={styles.playerRow2}>
        <View style={styles.leftContainer}>
          <Text style={styles.headerPlayerPosition}>Pl</Text>
          <Text style={styles.headerPlayerName}>Player</Text>
        </View>
        <View style={styles.rightContainer}>
          <Text style={styles.headerPlayerToday}>Today</Text>
          <Text style={styles.headerPlayerThru}>Thru</Text>
          <Text style={styles.headerPlayerTotal}>Tot</Text>
        </View>
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
      ListHeaderComponent={renderHeader}
    />
  );
};

const styles = StyleSheet.create({
  tournamentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    paddingVertical: 10,
    textAlign: 'left',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  playerRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7.5,
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
  headerPlayerPosition: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  headerPlayerName: {
    color: 'white',
    flex: 4,
    textAlign: 'left',
    fontWeight: 'bold',
  },
  headerPlayerToday: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  headerPlayerThru: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  headerPlayerTotal: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  playerPosition: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
  },
  playerName: {
    color: 'white',
    flex: 4,
    textAlign: 'left',
  },
  playerToday: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
  },
  playerThru: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
  },
  playerTotal: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
  },
  listContent: {
    paddingHorizontal: 5,
  },
  headshot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 5,
  },
});

export default PGA;
