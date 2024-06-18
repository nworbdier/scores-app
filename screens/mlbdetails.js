import moment from 'moment';
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

import NavBar from '../components/navbar'; // Import the NavBar component

const MLBDetails = ({ route }) => {
  const { eventId } = route.params; // Get the eventId from the navigation route parameters
  const [matchupData, setMatchupData] = useState(null);
  const [selectedTab, setSelectedTab] = useState('Feed');
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const fetchMatchupData = async () => {
      try {
        const response = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/summary?event=${eventId}`
        );
        console.log('Response URL:', response.url);
        const data = await response.json();
        setMatchupData(data);
      } catch (error) {
        console.error('Error fetching matchup data:', error);
      }
    };

    fetchMatchupData();
  }, [eventId]);

  useEffect(() => {
    let interval;
    if (matchupData && matchupData.header && matchupData.header.competitions) {
      const competition = matchupData.header.competitions[0];
      if (competition.status.type.name === 'STATUS_SCHEDULED') {
        interval = setInterval(() => {
          const gameTime = moment(competition.date);
          const now = moment();
          const duration = moment.duration(gameTime.diff(now));

          const hours = Math.floor(duration.asHours()).toString().padStart(1, '0');
          const minutes = duration.minutes().toString().padStart(2, '0');

          setCountdown(`First Pitch: ${hours} hr ${minutes} min`);
        }, 500);
      }
    }

    return () => clearInterval(interval);
  }, [matchupData]);

  if (!matchupData || !matchupData.header || !matchupData.header.competitions) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const competition = matchupData.header.competitions[0];

  const renderContent = () => {
    switch (selectedTab) {
      case 'Feed':
        return (
          <View style={styles.feedContent}>
            <Text style={styles.tabContent}>Feed</Text>
            {competition.status.type.name === 'STATUS_SCHEDULED' && (
              <Text style={styles.countdownText}>{countdown}</Text>
            )}
          </View>
        );
      case 'Game':
        return <Text style={styles.tabContent}>Game</Text>;
      case competition.competitors[1].team.abbreviation:
        return (
          <Text style={styles.tabContent}>{competition.competitors[1].team.abbreviation}</Text>
        );
      case competition.competitors[0].team.abbreviation:
        return (
          <Text style={styles.tabContent}>{competition.competitors[0].team.abbreviation}</Text>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeAreaContainer} />
      <View style={styles.matchupContainer}>
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
        <View>
          <View style={styles.vsContainer}>
            {competition.status.type.name === 'STATUS_SCHEDULED' ? (
              <Text style={styles.dateText}>{moment(competition.date).format('h:mm A')}</Text>
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
      </View>
      <View style={{ flex: 4, flexDirection: 'column' }}>
        <View>
          <View style={styles.switcherHeader}>
            {[
              'Feed',
              'Game',
              competition.competitors[1].team.abbreviation,
              competition.competitors[0].team.abbreviation,
            ].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setSelectedTab(tab)}
                style={selectedTab === tab ? styles.selectedTabContainer : null}>
                <Text
                  style={[
                    styles.switcherHeaderText,
                    selectedTab === tab && styles.selectedTabText,
                  ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.tabContentContainer}>{renderContent()}</View>
      </View>
      <NavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  safeAreaContainer: {
    backgroundColor: 'black',
  },
  matchupContainer: {
    flex: 1,
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
    alignSelf: 'center',
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
  dateText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  switcherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  switcherHeaderText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
    padding: 10,
  },
  selectedTabContainer: {
    borderBottomWidth: 3,
    borderBottomColor: '#FFDB58',
  },
  selectedTabText: {
    color: '#FFDB58',
  },
  tabContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  feedContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFDB58',
    marginTop: 10,
  },
});

export default MLBDetails;
