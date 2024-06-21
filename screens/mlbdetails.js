import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import NavBar from '../components/navbar'; // Import the NavBar component

const MLBDetails = ({ route }) => {
  const { eventId } = route.params; // Get the eventId from the navigation route parameters
  const [matchupData, setMatchupData] = useState(null);
  const [selectedTab, setSelectedTab] = useState('Feed');
  const [countdown, setCountdown] = useState('');

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

          let countdownText = 'First Pitch: ';
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
  const situation = matchupData.situation;
  const homeTeam = competition.competitors[1].team.abbreviation;
  const awayTeam = competition.competitors[0].team.abbreviation;
  const defaultImage = require('../assets/person.png');
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
  const updatedBattersHome = getUpdatedBatOrder(
    matchupData.boxscore.players[0].statistics[0].athletes
  );
  const updatedBattersAway = getUpdatedBatOrder(
    matchupData.boxscore.players[1].statistics[0].athletes
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'Feed':
        if (competition.status.type.name !== 'STATUS_SCHEDULED') {
          // Filter items where status is not 'STATUS_SCHEDULED' and make the necessary text replacements
          const filteredItems = matchupData.plays
            .filter((item) => item.status !== 'STATUS_SCHEDULED')
            .map((item) => {
              // Make the necessary text replacements
              if (item.text?.includes('Strike Foul')) {
                item.type.text = 'Foul ball';
              }
              return item;
            });

          // Prepare grouped items and filter out "Pitcher pitches to Batter"
          const groupedItems = {};
          filteredItems.forEach((item) => {
            if (item.text && item.text.includes('pitches to')) {
              return; // Skip this item
            }
            if (!groupedItems[item.atBatId]) {
              groupedItems[item.atBatId] = [];
            }
            groupedItems[item.atBatId].push(item.text);
          });

          // Reverse the order of atBatId keys
          const reversedAtBatIds = Object.keys(groupedItems).reverse();

          // Render the items, reversing the order of both atBatId keys and texts within each group
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
              <Text style={styles.tabContent}>Pitching</Text>
              {matchupData.boxscore.players[0].statistics[1].athletes
                .filter((athlete) => athlete.starter === true)
                .map((athlete) => (
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
                    <View style={{ flexDirection: 'column' }}>
                      <Text style={styles.players}>
                        {athlete?.athlete?.displayName} - {athlete.position.abbreviation}
                      </Text>
                      <ScrollView horizontal>
                        <View style={{ flexDirection: 'column' }}>
                          <Text style={styles.playerStats}>{athlete.stats.join('  ')}</Text>
                          <Text style={styles.playerStats}>
                            {matchupData.boxscore.players[0].statistics[1].labels.join('  ')}
                          </Text>
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                ))}
              <Text style={styles.tabContent}>Batting</Text>
              {updatedBattersHome.map((athlete) => (
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
                  <View style={{ flexDirection: 'column' }}>
                    <Text style={styles.players}>
                      {athlete?.athlete?.displayName} - {athlete.position.abbreviation}
                    </Text>
                    <ScrollView horizontal>
                      <View style={{ flexDirection: 'column' }}>
                        <Text style={styles.playerStats}>{athlete.stats.join('  ')}</Text>
                        <Text style={styles.playerStats}>
                          {matchupData.boxscore.players[0].statistics[0].labels.join('  ')}
                        </Text>
                      </View>
                    </ScrollView>
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
                    .map((athlete) => (
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
                        <View style={{ flexDirection: 'column' }}>
                          <Text style={styles.players}>
                            {athlete?.athlete?.displayName} - {athlete.position.abbreviation}
                          </Text>
                          <ScrollView horizontal>
                            <View style={{ flexDirection: 'column' }}>
                              <Text style={styles.playerStats}>{athlete.stats.join('  ')}</Text>
                              <Text style={styles.playerStats}>
                                {matchupData.boxscore.players[0].statistics[1].labels.join('  ')}
                              </Text>
                            </View>
                          </ScrollView>
                        </View>
                      </View>
                    ))}
                </>
              )}
            </ScrollView>
          </View>
        );

      case awayTeam:
        return (
          <View style={styles.tabContent}>
            <ScrollView>
              <Text style={styles.tabContent}>Pitching</Text>
              {matchupData.boxscore.players[1].statistics[1].athletes
                .filter((athlete) => athlete.starter === true)
                .map((athlete) => (
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
                    <View style={{ flexDirection: 'column' }}>
                      <Text style={styles.players}>
                        {athlete?.athlete?.displayName} - {athlete.position.abbreviation}
                      </Text>
                      <ScrollView horizontal>
                        <View style={{ flexDirection: 'column' }}>
                          <Text style={styles.playerStats}>{athlete.stats.join('  ')}</Text>
                          <Text style={styles.playerStats}>
                            {matchupData.boxscore.players[1].statistics[1].labels.join('  ')}
                          </Text>
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                ))}

              <Text style={styles.tabContent}>Batting</Text>
              {updatedBattersAway.map((athlete) => (
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
                  <View style={{ flexDirection: 'column' }}>
                    <Text style={styles.players}>
                      {athlete?.athlete?.displayName} - {athlete.position.abbreviation}
                    </Text>
                    <ScrollView horizontal>
                      <View style={{ flexDirection: 'column' }}>
                        <Text style={styles.playerStats}>{athlete.stats.join('  ')}</Text>
                        <Text style={styles.playerStats}>
                          {matchupData.boxscore.players[0].statistics[0].labels.join('  ')}
                        </Text>
                      </View>
                    </ScrollView>
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
                    .map((athlete) => (
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
                        <View style={{ flexDirection: 'column' }}>
                          <Text style={styles.players}>
                            {athlete?.athlete?.displayName} - {athlete.position.abbreviation}
                          </Text>
                          <ScrollView horizontal>
                            <View style={{ flexDirection: 'column' }}>
                              <Text style={styles.playerStats}>{athlete.stats.join('  ')}</Text>
                              <Text style={styles.playerStats}>
                                {matchupData.boxscore.players[0].statistics[1].labels.join('  ')}
                              </Text>
                            </View>
                          </ScrollView>
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
          <View>
            {competition.status.type.name === 'STATUS_SCHEDULED' ? (
              <Text style={styles.dateText}>{moment(competition.date).format('h:mm A')}</Text>
            ) : competition.status.type.name === 'STATUS_FINAL' ? (
              <Text style={styles.inning}>{competition.status.type.shortDetail}</Text>
            ) : (
              <View style={styles.gameTime}>
                <View>
                  {competition.status.periodPrefix.includes('Top') && (
                    <Text style={styles.inning}>Top {competition.status.period}</Text>
                  )}
                  {competition.status.periodPrefix.includes('Mid') && (
                    <Text style={styles.inning}>Mid {competition.status.period}</Text>
                  )}
                  {competition.status.periodPrefix.includes('Bot') && (
                    <Text style={styles.inning}>Bot {competition.status.period}</Text>
                  )}
                  {competition.status.periodPrefix.includes('End') && (
                    <Text style={styles.inning}>End {competition.status.period}</Text>
                  )}
                </View>
                <View>{renderBasesComponent(situation)}</View>
                <View>
                  <Text style={styles.ballsandstrikes}>{situation?.outs} Outs</Text>
                </View>
              </View>
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
    justifyContent: 'space-around',
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
