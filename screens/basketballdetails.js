import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';

import NavBar from '../components/navbar'; // Import the NavBar component

const BASKETBALLDetails = ({ route }) => {
  const { eventId, sport } = route.params; // Get the eventId from the navigation route parameters
  const [matchupData, setMatchupData] = useState(null);
  const [selectedTab, setSelectedTab] = useState('Feed');
  const [countdown, setCountdown] = useState('');
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRefs = useRef([]);

  const fetchMatchupData = async () => {
    try {
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/basketball/${sport.toLowerCase()}/summary?event=${eventId}`
      );
      const data = await response.json();
      setMatchupData(data);
    } catch (error) {
      console.error('Error fetching matchup data:', error);
    }
  };

  const fetchGameData = async () => {
    await fetchMatchupData();
  };

  useFocusEffect(
    useCallback(() => {
      const fetchInitialData = async () => {
        await fetchGameData();
      };

      fetchInitialData();

      const intervalId = setInterval(() => {
        fetchGameData();
      }, 10000); // Refresh every 10 seconds

      return () => clearInterval(intervalId); // Cleanup interval on blur
    }, [eventId])
  );

  useEffect(() => {
    let interval;
    if (matchupData && matchupData.header && matchupData.header.competitions) {
      const competition = matchupData.header.competitions[0];
      if (competition.status.type.name === 'STATUS_SCHEDULED') {
        interval = setInterval(() => {
          const gameTime = moment(competition.date);
          const now = moment();
          const duration = moment.duration(gameTime.diff(now));

          const hours = Math.floor(duration.asHours());
          const minutes = duration.minutes();

          let countdownText = 'Puck Drop: ';
          if (hours > 0) {
            countdownText += `${hours} hr `;
          }
          if (minutes > 0 || hours === 0) {
            // display minutes if there are hours or if there are only minutes
            countdownText += `${minutes} min`;
          }

          setCountdown(countdownText.trim());
        }, 500);
      }
    }

    return () => clearInterval(interval);
  }, [matchupData]);

  useEffect(() => {
    scrollX.addListener(({ value }) => {
      scrollViewRefs.current.forEach((ref) => {
        if (ref && ref.scrollTo) {
          ref.scrollTo({ x: value, animated: false });
        }
      });
    });

    return () => {
      scrollX.removeAllListeners();
    };
  }, []);

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: false,
  });

  if (
    !matchupData ||
    !matchupData.header ||
    !matchupData.header.competitions ||
    !matchupData.plays
  ) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const competition = matchupData.header.competitions[0];
  const homeTeam = competition.competitors[1].team.abbreviation;
  const awayTeam = competition.competitors[0].team.abbreviation;
  const defaultImage = require('../assets/person.png');

  const HomeAthletes = matchupData.boxscore.players[0].statistics[0].athletes;
  const AwayAthletes = matchupData.boxscore.players[1].statistics[0].athletes;

  const renderAthleteStats = (athlete, index, labels) => (
    <Animated.ScrollView
      ref={(ref) => (scrollViewRefs.current[index] = ref)}
      horizontal
      showsHorizontalScrollIndicator={false}
      onScroll={handleScroll}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {athlete.stats.map((stat, statIndex) => (
          <View key={statIndex} style={{ marginHorizontal: 10 }}>
            <Text style={styles.playerStats}>{stat}</Text>
            <Text style={styles.playerStatsLabels}>{labels[statIndex]}</Text>
          </View>
        ))}
      </View>
    </Animated.ScrollView>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'Feed':
        if (competition.status.type.name !== 'STATUS_SCHEDULED') {
          // Filter items where status is not 'STATUS_SCHEDULED' and make necessary text replacements
          const filteredItems = matchupData.plays
            .filter((item) => item.status !== 'STATUS_SCHEDULED')
            .map((item, index) => {
              // Make necessary text replacements
              if (item.text?.includes('Strike Foul')) {
                item.text = 'Foul ball';
              }
              return { ...item, index }; // Add index to item object
            });

          // Reverse the order of items
          filteredItems.reverse();

          return (
            <View style={styles.feedContent}>
              <ScrollView>
                {filteredItems.map((item) => (
                  <View key={item.index} style={styles.feedItem}>
                    <Text
                      style={[
                        styles.feedItemText,
                        { fontWeight: item.scoringPlay ? 'bold' : 'normal' },
                      ]}>
                      {item.text}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          );
        } else {
          // Render scheduled message or countdown if status is 'STATUS_SCHEDULED'
          return (
            <View style={styles.feedContent}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          );
        }

      case 'Game':
        return (
          <View style={styles.feedContent}>
            <Text style={styles.tabContent}>Game</Text>
          </View>
        );

      case homeTeam:
        return (
          <View style={styles.tabContent}>
            <ScrollView>
              <Text style={styles.tabContent}>Players</Text>
              {HomeAthletes.map((athlete, index) => (
                <View key={athlete?.athlete?.id} style={styles.playerContainer}>
                  {athlete?.athlete?.headshot?.href ? (
                    <View style={styles.headshotContainer}>
                      <Image
                        source={{ uri: athlete.athlete.headshot.href }}
                        style={styles.headshot}
                      />
                    </View>
                  ) : (
                    <View style={styles.headshotContainer}>
                      <Image source={defaultImage} style={styles.headshot} />
                    </View>
                  )}
                  <View style={{ flexDirection: 'column', flex: 1 }}>
                    <Text style={styles.players}>
                      {athlete?.athlete?.displayName} - {athlete?.athlete?.position?.abbreviation}
                    </Text>
                    {renderAthleteStats(
                      athlete,
                      index + matchupData.boxscore.players[0].statistics[0].athletes.length,
                      matchupData.boxscore.players[0].statistics[0].labels
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        );

      case awayTeam:
        return (
          <View style={styles.tabContent}>
            <ScrollView>
              <Text style={styles.tabContent}>Players</Text>
              {AwayAthletes.map((athlete, index) => (
                <View key={athlete?.athlete?.id} style={styles.playerContainer}>
                  {athlete?.athlete?.headshot?.href ? (
                    <View style={styles.headshotContainer}>
                      <Image
                        source={{ uri: athlete.athlete.headshot.href }}
                        style={styles.headshot}
                      />
                    </View>
                  ) : (
                    <View style={styles.headshotContainer}>
                      <Image source={defaultImage} style={styles.headshot} />
                    </View>
                  )}
                  <View style={{ flexDirection: 'column', flex: 1 }}>
                    <Text style={styles.players}>
                      {athlete?.athlete?.displayName} - {athlete?.athlete?.position?.abbreviation}
                    </Text>
                    {renderAthleteStats(
                      athlete,
                      index + matchupData.boxscore.players[0].statistics[0].athletes.length,
                      matchupData.boxscore.players[0].statistics[0].labels
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
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
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <Image
              source={{ uri: competition.competitors[1].team.logos[1].href }}
              style={styles.logo}
            />
            <Text style={styles.teamName}>{competition.competitors[1].team.name}</Text>
          </View>
          <View style={{ marginLeft: 10 }}>
            {competition.status.type.name === 'STATUS_SCHEDULED' ? (
              <Text style={styles.record}>{competition.competitors[1].record[0].displayValue}</Text>
            ) : (
              <Text style={styles.score}>{competition.competitors[1].score}</Text>
            )}
          </View>
        </View>
        <View styles={{ flex: 1, justifyContent: 'center' }}>
          {competition.status.type.name === 'STATUS_SCHEDULED' ? (
            <Text style={styles.dateText}>{moment(competition.date).format('h:mm A')}</Text>
          ) : competition.status.type.name === 'STATUS_FINAL' ? (
            <Text style={styles.inning}>{competition.status.type.shortDetail}</Text>
          ) : (
            <View style={styles.gameTime}>
              <View>
                {competition.status.periodPrefix.includes('Top') && (
                  <Text style={styles.inning}>{competition.status.period}</Text>
                )}
              </View>
            </View>
          )}
        </View>
        <View style={styles.column}>
          <View style={{ marginRight: 10 }}>
            {competition.status.type.name === 'STATUS_SCHEDULED' ? (
              <Text style={styles.record}>{competition.competitors[0].record[0].displayValue}</Text>
            ) : (
              <Text style={styles.score}>{competition.competitors[0].score}</Text>
            )}
          </View>
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <Image
              source={{ uri: competition.competitors[0].team.logos[1].href }}
              style={styles.logo}
            />
            <Text style={styles.teamName}>{competition.competitors[0].team.name}</Text>
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
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  column: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
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
  gameTime: {
    alignItems: 'center',
  },
  inning: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  ballsandstrikes: {
    fontSize: 16,
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
  },
  tabContent: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  playerHeader: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  players: {
    color: 'white',
    fontSize: 16,
    // fontWeight: 'bold',
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
  basesContainer: {
    marginVertical: 10,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  baseRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  base: {
    width: 15,
    height: 15,
    backgroundColor: 'grey',
    transform: [{ rotate: '45deg' }], // Rotate to make it look like a diamond
  },
  baseActive: {
    backgroundColor: 'yellow', // Change active base color to yellow
  },
  emptySpace: {
    width: 15,
    height: 15,
    transform: [{ rotate: '45deg' }], // Rotate to make it look like a diamond
  },
  playerContainer: {
    flexDirection: 'row',
    marginVertical: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  headshotContainer: {
    position: 'relative',
  },
  batOrderContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: -15,
    left: -15,
    borderRadius: 8,
    backgroundColor: 'black',
    padding: 5,
  },
  batOrder: {
    color: 'yellow',
    fontWeight: 'bold',
    fontSize: 16, // adjust as needed
  },
  headshot: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: '#606060',
  },
  playerStats: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerStatsLabels: {
    color: 'white',
    fontSize: 16,
  },
  feedItem: {
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  feedItemHeader: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  feedItemText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 5,
  },
});

export default BASKETBALLDetails;
