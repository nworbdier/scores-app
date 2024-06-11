import moment from 'moment';
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const MLBDetails = ({ route }) => {
  const { eventId } = route.params; // Get the eventId from the navigation route parameters
  const [matchupData, setMatchupData] = useState(null);

  useEffect(() => {
    const fetchMatchupData = async () => {
      try {
        const response = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/summary?event=${eventId}`
        );
        console.log('Response URl:', response.url);
        const data = await response.json();
        setMatchupData(data);
      } catch (error) {
        console.error('Error fetching matchup data:', error);
      }
    };

    fetchMatchupData();
  }, [eventId]);

  if (!matchupData || !matchupData.header || !matchupData.header.competitions) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const competition = matchupData.header.competitions[0];

  return (
    <View style={styles.container}>
      <View style={styles.matchupContainer}>
        <View style={styles.column}>
          <View style={styles.teamContainer}>
            <Image
              source={{ uri: competition.competitors[0].team.logos[1].href }}
              style={styles.logo}
            />
            <Text style={styles.teamName}>{competition.competitors[0].team.name}</Text>
            {competition.status.type.name === 'STATUS_SCHEDULED' ? (
              <Text style={styles.record}>{competition.competitors[0].record[0].displayValue}</Text>
            ) : (
              <Text style={styles.score}>{competition.competitors[0].score}</Text>
            )}
          </View>
        </View>
        <View>
          <View style={styles.vsContainer}>
            {competition.status.type.name === 'STATUS_SCHEDULED' ? (
              <Text style={styles.inningText}>{moment(competition.date).format('h:mm A')}</Text>
            ) : (
              <Text style={styles.inningText}>
                {competition.status.periodPrefix} {competition.status.period}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.teamContainer}>
            <Image
              source={{ uri: competition.competitors[1].team.logos[1].href }}
              style={styles.logo}
            />
            <Text style={styles.teamName}>{competition.competitors[1].team.name}</Text>
            {competition.status.type.name === 'STATUS_SCHEDULED' ? (
              <Text style={styles.record}>{competition.competitors[1].record[0].displayValue}</Text>
            ) : (
              <Text style={styles.score}>{competition.competitors[1].score}</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'black',
  },
  matchupContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  teamContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: 'white',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    color: 'white',
  },
  record: {
    fontSize: 18,
    marginTop: 10,
    color: 'white',
  },
  vsContainer: {
    alignItems: 'center',
  },
  vsText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 5,
    color: 'white',
  },
  inningText: {
    fontSize: 20,
    color: 'white',
  },
});

export default MLBDetails;
