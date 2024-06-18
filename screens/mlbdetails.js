import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import moment from 'moment';

import NavBar from '../components/navbar'; // Import the NavBar component

const MLBDetails = ({ route }) => {
  const { eventId } = route.params; // Get the eventId from the navigation route parameters
  const [matchupData, setMatchupData] = useState(null);
  const [selectedTab, setSelectedTab] = useState('Feed');

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
        return <Text style={styles.tabContent}>Feed</Text>;
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
});

export default MLBDetails;
