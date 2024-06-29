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

const MLBDetails = ({ route }) => {
  const { eventId } = route.params;
  const [matchupData, setMatchupData] = useState(null);
  const [selectedTab, setSelectedTab] = useState('Feed');
  const [countdown, setCountdown] = useState('');
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRefs = useRef([]);

  // Rename some team names logic
  const TeamRename = (input) => {
    if (input === 'Diamondbacks') {
      return 'D-backs';
    }
    return input;
  };

  // Fetch data for the given eventID
  const fetchMatchupData = async () => {
    try {
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/summary?event=${eventId}`
      );
      console.log('Url', response.url);
      const data = await response.json();
      setMatchupData(data);
    } catch (error) {
      console.error('Error fetching matchup data:', error);
    }
  };

  // Refreshes data every 10 seconds if you're on the page
  useFocusEffect(
    useCallback(() => {
      const fetchInitialData = async () => {
        await fetchMatchupData();
      };

      fetchInitialData();

      const intervalId = setInterval(() => {
        fetchMatchupData();
      }, 10000);

      return () => clearInterval(intervalId);
    }, [eventId])
  );

  // useEffect for displaying time until first pitch if the status is scheduled
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

          let countdownText = 'First Pitch: ';
          if (hours > 0) {
            countdownText += `${hours} hr `;
          }
          if (minutes > 0 || hours === 0) {
            countdownText += `${minutes} min`;
          }

          setCountdown(countdownText.trim());
        }, 500);
      }
    }

    return () => clearInterval(interval);
  }, [matchupData]);

  // Stat and Stat Label Scrolling UseEffect
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

  // Stat and Stat Label Scrolling Const
  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: false,
  });

  // Logic for displaying the bases graphic
  const renderBasesComponent = (situation) => {
    return (
      <View style={styles.basesContainer}>
        <View style={styles.baseRow}>
          <View style={styles.emptySpace} />
          <View style={[styles.base, situation?.onSecond?.playerId ? styles.baseActive : null]} />
          <View style={styles.emptySpace} />
        </View>
        <View style={styles.baseRow}>
          <View style={[styles.base, situation?.onThird?.playerId ? styles.baseActive : null]} />
          <View style={styles.emptySpace} />
          <View style={[styles.base, situation?.onFirst?.playerId ? styles.baseActive : null]} />
        </View>
      </View>
    );
  };

  // Checks data before rendering. Renders "loading... if not yet
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

  // Some const values to use in the below stuff
  const competition = matchupData.header.competitions[0];
  const situation = matchupData.situation;
  const homeTeam = competition.competitors[1].team.abbreviation;
  const awayTeam = competition.competitors[0].team.abbreviation;
  const defaultImage = require('../assets/person.png');

  // Update batter order if more than one batter with the same order occur
  const getUpdatedBatOrder = (athletes) => {
    const batOrderMapping = {};

    return athletes.map((athlete) => {
      const baseOrder = athlete.batOrder;
      if (batOrderMapping[baseOrder] === undefined) {
        batOrderMapping[baseOrder] = 0;
      } else {
        batOrderMapping[baseOrder] += 1;
      }
      const increment = batOrderMapping[baseOrder];
      const updatedBatOrder = increment === 0 ? baseOrder : `${baseOrder}.${increment}`;

      return { ...athlete, updatedBatOrder };
    });
  };

  // Using getUpdatedBatOrder for the home batters
  const updatedBattersHome = getUpdatedBatOrder(
    matchupData.boxscore.players[0].statistics[0].athletes
  );

  // Using getUpdatedBatOrder for the away batters
  const updatedBattersAway = getUpdatedBatOrder(
    matchupData.boxscore.players[1].statistics[0].athletes
  );

  // Athlete Stats and Stats Label Logic
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

  // Tab Switcher Logic
  const renderContent = () => {
    switch (selectedTab) {
      // Play Feed
      case 'Feed':
        if (competition.status.type.name !== 'STATUS_SCHEDULED') {
          const filteredItems = matchupData.plays
            .filter((item) => item.status !== 'STATUS_SCHEDULED')
            .map((item) => {
              if (item.text?.includes('Strike Foul')) {
                item.type.text = 'Foul ball';
              }
              return item;
            });

          const groupedItems = {};
          filteredItems.forEach((item) => {
            if (item.text && item.text.includes('pitches to')) {
              return;
            }
            if (!groupedItems[item.atBatId]) {
              groupedItems[item.atBatId] = [];
            }
            groupedItems[item.atBatId].push(item.text);
          });

          const reversedAtBatIds = Object.keys(groupedItems).reverse();

          return (
            <View style={styles.feedContent}>
              <ScrollView>
                {reversedAtBatIds.map((atBatId) => (
                  <View key={atBatId} style={styles.feedItem}>
                    <Text style={styles.feedItemHeader}>{atBatId}</Text>
                    {groupedItems[atBatId].reverse().map((text, index) => (
                      <Text key={index} style={styles.feedItemText}>
                        {text}
                      </Text>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>
          );
        } else {
          return (
            <View style={styles.feedContent}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          );
        }

      // Game and Team Statistics
      case 'Game':
        return (
          <View style={styles.feedContent}>
            <Text style={styles.tabContent}>Game</Text>
          </View>
        );

      // Home Athletes Names, Stats, & Labels
      case homeTeam:
        return (
          <View style={styles.tabContent}>
            <ScrollView>
              <Text style={styles.tabContent}>Pitching</Text>
              {matchupData.boxscore.players[0].statistics[1].athletes
                .filter((athlete) => athlete.starter === true)
                .map((athlete, index) => (
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
                        index,
                        matchupData.boxscore.players[0].statistics[1].labels
                      )}
                    </View>
                  </View>
                ))}
              <Text style={styles.tabContent}>Batting</Text>
              {updatedBattersHome.map((athlete, index) => (
                <View key={athlete?.athlete?.id} style={styles.playerContainer}>
                  {athlete?.athlete?.headshot?.href ? (
                    <View style={styles.headshotContainer}>
                      <Image
                        source={{ uri: athlete.athlete.headshot.href }}
                        style={styles.headshot}
                      />
                      {athlete.batOrder !== undefined && (
                        <View style={styles.batOrderContainer}>
                          <Text style={styles.batOrder}>{athlete.updatedBatOrder}</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.headshotContainer}>
                      <Image source={defaultImage} style={styles.headshot} />
                      {athlete.batOrder !== undefined && (
                        <View style={styles.batOrderContainer}>
                          <Text style={styles.batOrder}>{athlete.updatedBatOrder}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  <View style={{ flexDirection: 'column', flex: 1 }}>
                    <Text style={styles.players}>
                      {athlete?.athlete?.displayName} - {athlete?.athlete?.position?.abbreviation}
                    </Text>
                    {renderAthleteStats(
                      athlete,
                      index + matchupData.boxscore.players[0].statistics[1].athletes.length,
                      matchupData.boxscore.players[0].statistics[0].labels
                    )}
                  </View>
                </View>
              ))}

              {matchupData.boxscore.players[0].statistics[1].athletes.filter(
                (athlete) => athlete.starter === false
              ).length > 0 && (
                <>
                  <Text style={styles.tabContent}>Other Pitching</Text>
                  {matchupData.boxscore.players[0].statistics[1].athletes
                    .filter((athlete) => athlete.starter === false)
                    .map((athlete, index) => (
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
                            {athlete?.athlete?.displayName} -{' '}
                            {athlete?.athlete?.position?.abbreviation}
                          </Text>
                          {renderAthleteStats(
                            athlete,
                            index +
                              updatedBattersHome.length +
                              matchupData.boxscore.players[0].statistics[1].athletes.filter(
                                (a) => a.starter === true
                              ).length,
                            matchupData.boxscore.players[0].statistics[1].labels
                          )}
                        </View>
                      </View>
                    ))}
                </>
              )}
            </ScrollView>
          </View>
        );

      // Away Athletes Names, Stats, & Labels
      case awayTeam:
        return (
          <View style={styles.tabContent}>
            <ScrollView>
              <Text style={styles.tabContent}>Pitching</Text>
              {matchupData.boxscore.players[1].statistics[1].athletes
                .filter((athlete) => athlete.starter === true)
                .map((athlete, index) => (
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
                        index,
                        matchupData.boxscore.players[1].statistics[1].labels
                      )}
                    </View>
                  </View>
                ))}

              <Text style={styles.tabContent}>Batting</Text>
              {updatedBattersAway.map((athlete, index) => (
                <View key={athlete?.athlete?.id} style={styles.playerContainer}>
                  {athlete?.athlete?.headshot?.href ? (
                    <View style={styles.headshotContainer}>
                      <Image
                        source={{ uri: athlete.athlete.headshot.href }}
                        style={styles.headshot}
                      />
                      {athlete.batOrder !== undefined && (
                        <View style={styles.batOrderContainer}>
                          <Text style={styles.batOrder}>{athlete.updatedBatOrder}</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.headshotContainer}>
                      <Image source={defaultImage} style={styles.headshot} />
                      {athlete.batOrder !== undefined && (
                        <View style={styles.batOrderContainer}>
                          <Text style={styles.batOrder}>{athlete.updatedBatOrder}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  <View style={{ flexDirection: 'column', flex: 1 }}>
                    <Text style={styles.players}>
                      {athlete?.athlete?.displayName} - {athlete?.athlete?.position?.abbreviation}
                    </Text>
                    {renderAthleteStats(
                      athlete,
                      index + matchupData.boxscore.players[1].statistics[1].athletes.length,
                      matchupData.boxscore.players[1].statistics[0].labels
                    )}
                  </View>
                </View>
              ))}

              {matchupData.boxscore.players[1].statistics[1].athletes.filter(
                (athlete) => athlete.starter === false
              ).length > 0 && (
                <>
                  <Text style={styles.tabContent}>Other Pitching</Text>
                  {matchupData.boxscore.players[1].statistics[1].athletes
                    .filter((athlete) => athlete.starter === false)
                    .map((athlete, index) => (
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
                            {athlete?.athlete?.displayName} -{' '}
                            {athlete?.athlete?.position?.abbreviation}
                          </Text>
                          {renderAthleteStats(
                            athlete,
                            index +
                              updatedBattersAway.length +
                              matchupData.boxscore.players[1].statistics[1].athletes.filter(
                                (a) => a.starter === true
                              ).length,
                            matchupData.boxscore.players[1].statistics[1].labels
                          )}
                        </View>
                      </View>
                    ))}
                </>
              )}
            </ScrollView>
          </View>
        );
      default:
        return null;
    }
  };

  // Logo, Score, and Team Name
  const renderTeamInfo = (competitor, index) => {
    const team = competitor.team;
    const logoUri = team.logos[1].href;
    const isScheduled = competition.status.type.name === 'STATUS_SCHEDULED';
    const scoreStyle = index === 0 ? { marginRight: 20 } : { marginLeft: 20 };

    return (
      <View
        style={[styles.row, { justifyContent: index === 0 ? 'flex-end' : 'flex-start' }]}
        key={index}>
        {index === 0 && (
          <Text style={[styles.score, scoreStyle]}>
            {isScheduled ? competitor.record[0].displayValue : competitor.score}
          </Text>
        )}
        <View style={{ alignItems: 'center' }}>
          <Image source={{ uri: logoUri }} style={styles.logo} />
          <Text style={styles.teamName}>{TeamRename(team.name)}</Text>
        </View>
        {index === 1 && (
          <Text style={[styles.score, scoreStyle]}>
            {isScheduled ? competitor.record[0].displayValue : competitor.score}
          </Text>
        )}
      </View>
    );
  };

  // Inning, Bases Graphic, and Outs
  const renderMatchupInfo = () => {
    const status = competition.status.type.name;

    if (status === 'STATUS_SCHEDULED') {
      return <Text style={styles.dateText}>{moment(competition.date).format('h:mm A')}</Text>;
    } else if (status === 'STATUS_FINAL') {
      return <Text style={styles.inning}>{competition.status.type.shortDetail}</Text>;
    } else {
      return (
        <View style={styles.gameTime}>
          <View>
            {['Top', 'Mid', 'Bot', 'End'].map(
              (prefix) =>
                competition.status.periodPrefix.includes(prefix) && (
                  <Text style={styles.inning}>{`${prefix} ${competition.status.period}`}</Text>
                )
            )}
          </View>
          <View>{renderBasesComponent(situation)}</View>
          <View>
            <Text style={styles.ballsandstrikes}>{situation?.outs} Outs</Text>
          </View>
        </View>
      );
    }
  };

  // Final Return
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeAreaContainer} />
      <View style={styles.matchupContainer}>
        <View>{renderTeamInfo(competition.competitors[1], 1)}</View>
        <View>{renderMatchupInfo()}</View>
        <View>{renderTeamInfo(competition.competitors[0], 0)}</View>
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

// Style Sheet
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
    marginHorizontal: 20,
  },
  row: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
  },
  logo: {
    width: 45,
    height: 45,
    resizeMode: 'contain',
  },
  teamName: {
    fontSize: 18,
    marginTop: 10,
    color: 'white',
  },
  score: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
  },
  record: {
    fontSize: 18,
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
    marginLeft: 20,
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

export default MLBDetails;
