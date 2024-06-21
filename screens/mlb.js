import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';

import NavBar from '../components/navbar'; // Import the NavBar component

const ITEM_WIDTH = 75;
const { width } = Dimensions.get('window');

const MLB = () => {
  const navigation = useNavigation();
  const [gameData, setGameData] = useState([]);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYYMMDD'));
  const [refreshing, setRefreshing] = useState(false);
  const [dateListLoading, setDateListLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [seasonSlug, setSeasonSlug] = useState('');
  const ref = useRef();

  const formatToYYYYMMDD = (dateString) => {
    const date = new Date(dateString);
    return moment(date).format('YYYYMMDD');
  };

  const findClosestDate = (dates) => {
    const today = moment();
    return dates.reduce((closestDate, currentDate) => {
      const currentDiff = Math.abs(today.diff(moment(currentDate), 'days'));
      const closestDiff = Math.abs(today.diff(moment(closestDate), 'days'));
      return currentDiff < closestDiff ? currentDate : closestDate;
    });
  };

  const fetchDates = async () => {
    try {
      const response = await fetch(
        `https://sports.core.api.espn.com/v2/sports/baseball/leagues/mlb/calendar/whitelist`
      );
      const data = await response.json();
      const dates = data.eventDate.dates.map((date) => formatToYYYYMMDD(date));
      const closestDate = findClosestDate(dates);
      const newIndex = dates.findIndex((date) => date === closestDate);
      setDates(dates);
      setIndex(newIndex);
      setSelectedDate(closestDate);
      setDateListLoading(false);
    } catch (error) {
      console.error('Error fetching dates:', error);
      setDateListLoading(false);
    }
  };

  const fetchGameData = async (date = selectedDate) => {
    try {
      if (!date || !/^\d{8}$/.test(date)) {
        return;
      }

      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${date}`
      );

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const gameData = data.events.map((event) => {
        const competition = event.competitions[0];
        const isPlayoff = competition.series && competition.series.type === 'playoff';
        let homeWins = null;
        let awayWins = null;

        if (isPlayoff) {
          homeWins = competition.series.competitors[0].wins;
          awayWins = competition.series.competitors[1].wins;
        }
        return {
          id: event.id,
          HomeTeam: competition.competitors[0].team.shortDisplayName,
          HomeLogo: competition.competitors[0].team.logo,
          HomeScore: competition.competitors[0].score,
          HomeTeamRecordSummary: competition.competitors[0].records[0].summary,
          AwayTeam: competition.competitors[1].team.shortDisplayName,
          AwayLogo: competition.competitors[1].team.logo,
          AwayScore: competition.competitors[1].score,
          AwayTeamRecordSummary: competition.competitors[1].records[0].summary,
          GameTime: competition.date,
          Status: competition.status.type.name,
          StatusShortDetail: competition.status.type.shortDetail,
          DisplayClock: event.status.displayClock,
          Inning: event.status.period,
          Outs: competition.situation ? competition.situation.outs : null,
          First: competition.situation ? competition.situation.onFirst : null,
          Second: competition.situation ? competition.situation.onSecond : null,
          Third: competition.situation ? competition.situation.onThird : null,
          IsPlayoff: isPlayoff,
          HomeWins: homeWins,
          AwayWins: awayWins,
        };
      });

      if (data.events[0] && data.events[0].season && data.events[0].season.slug) {
        setSeasonSlug(data.events[0].season.slug);
      }

      // Sort the game data
      const sortedGameData = gameData.sort((a, b) => {
        if (a.Status === 'STATUS_FINAL' && b.Status === 'STATUS_FINAL') {
          return a.GameTime.localeCompare(b.GameTime);
        } else if (a.Status === 'STATUS_FINAL') {
          return 1;
        } else if (b.Status === 'STATUS_FINAL') {
          return -1;
        } else {
          return a.GameTime.localeCompare(b.GameTime);
        }
      });

      setGameData(sortedGameData);
    } catch (error) {
      console.error('Error fetching game data:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchDates();
      const closestDate = findClosestDate(dates);
      setSelectedDate(closestDate);
      await fetchGameData(closestDate);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchGameData();
    }
  }, [selectedDate]);

  useEffect(() => {
    if (ref.current && dates.length > 0 && !dateListLoading) {
      const selectedIndex = dates.findIndex((d) => d === selectedDate);
      setIndex(selectedIndex >= 0 ? selectedIndex : 0);

      const wait = new Promise((resolve) => setTimeout(resolve, 100));
      wait.then(() => {
        try {
          ref.current.scrollToIndex({ index: selectedIndex, animated: true, viewPosition: 0.5 });
        } catch (e) {
          console.warn('Scroll to index failed:', e);
        }
      });
    }
  }, [dates, selectedDate, dateListLoading]);

  const onScrollToIndexFailed = useCallback((info) => {
    const wait = new Promise((resolve) => setTimeout(resolve, 500));
    wait.then(() => {
      const offset = ITEM_WIDTH * info.index;
      try {
        ref.current?.scrollToOffset({ offset, animated: true, viewPosition: 0.5 });
        setDateListLoading(false);
      } catch (e) {
        console.warn('Scroll to index failed:', e);
      }
    });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGameData();
    setRefreshing(false);
  };

  const formatGameTime = (isoDate) => {
    const date = new Date(isoDate);
    return moment(date).format('h:mm A');
  };

  const renderDateItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.dateButton, item === selectedDate && styles.selectedDateButton]}
      onPress={() => setSelectedDate(item)}
      activeOpacity={1}>
      <Text style={[styles.dateText, item === selectedDate && styles.selectedDateText]}>
        {moment(item).format('MMM D')}
      </Text>
    </TouchableOpacity>
  );

  const renderBasesComponent = (First, Second, Third) => {
    return (
      <View style={styles.basesContainer}>
        <View style={styles.baseRow}>
          <View style={styles.emptySpace} />
          <View style={[styles.base, Second && styles.baseActive]} />
          <View style={styles.emptySpace} />
        </View>
        <View style={styles.baseRow}>
          <View style={[styles.base, Third && styles.baseActive]} />
          <View style={styles.emptySpace} />
          <View style={[styles.base, First && styles.baseActive]} />
        </View>
      </View>
    );
  };

  const renderMLBComponent = () => {
    const renderItem = ({ item, index }) => {
      const containerStyle = [
        styles.itemContainer,
        item.Status === 'STATUS_IN_PROGRESS' && { borderColor: 'lightgreen' },
        item.Status === 'STATUS_RAIN_DELAY' && { borderColor: 'yellow' },
      ];

      return (
        <TouchableOpacity
          style={containerStyle}
          onPress={() => navigation.navigate('MLBDetails', { eventId: item.id })}>
          <View style={{ flexDirection: 'column' }}>
            <View style={styles.column}>
              <Image source={{ uri: item.AwayLogo }} style={styles.image} />
              <View style={{ flexDirection: 'column', marginLeft: 10 }}>
                {item.Status === 'STATUS_SCHEDULED' ? (
                  <Text style={styles.score}>{item.AwayTeamRecordSummary}</Text>
                ) : (
                  <Text style={styles.score}>{item.AwayScore}</Text>
                )}
                <Text style={styles.TextStyle1}>{item.AwayTeam}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <Image source={{ uri: item.HomeLogo }} style={styles.image} />
              <View style={{ flexDirection: 'column', marginLeft: 10 }}>
                {item.Status === 'STATUS_SCHEDULED' ? (
                  <Text style={styles.score}>{item.HomeTeamRecordSummary}</Text>
                ) : (
                  <Text style={styles.score}>{item.HomeScore}</Text>
                )}
                <Text style={styles.TextStyle1}>{item.HomeTeam}</Text>
              </View>
            </View>
          </View>
          <View style={styles.column2}>
            {item.Status === 'STATUS_SCHEDULED' ? (
              <View style={styles.column2}>
                <Text style={styles.gametime}>{formatGameTime(item.GameTime)}</Text>
              </View>
            ) : item.Status === 'STATUS_FINAL' ? (
              <View style={styles.column2}>
                <Text style={styles.gametime}>{item.StatusShortDetail}</Text>
              </View>
            ) : item.Status === 'STATUS_RAIN_DELAY' ? (
              <View style={styles.column2}>
                <Text style={[styles.TextStyle2, { fontWeight: 'bold' }]}>Rain Delay</Text>
              </View>
            ) : (
              <View style={styles.column2}>
                <View style={styles.gameTime}>
                  {item.StatusShortDetail.includes('Top') && (
                    <Text style={[styles.inning]}>Top {item.Inning}</Text>
                  )}
                  {item.StatusShortDetail.includes('Mid') && (
                    <Text style={[styles.inning]}>Mid {item.Inning}</Text>
                  )}
                  {item.StatusShortDetail.includes('Bot') && (
                    <Text style={[styles.inning]}>Bot {item.Inning}</Text>
                  )}
                  {item.StatusShortDetail.includes('End') && (
                    <Text style={[styles.inning]}>End {item.Inning}</Text>
                  )}
                </View>
                {renderBasesComponent(item.First, item.Second, item.Third)}

                <View>
                  {item.Outs !== null && <Text style={styles.TextStyle2}>{item.Outs} Outs</Text>}
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    };

    const groupedData = [];
    const remaining = gameData.slice(0);
    for (let i = 0; i < remaining.length; i += 4) {
      groupedData.push(remaining.slice(i, i + 4));
    }

    return (
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: 'white',
            fontSize: 20,
            fontWeight: 'bold',
            marginBottom: 10,
            marginLeft: 10,
          }}>
          {' '}
          {seasonSlug === 'regular-season'
            ? 'Games'
            : seasonSlug === 'post-season'
              ? 'Playoffs'
              : 'Games'}
        </Text>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#888" />
          }>
          <ScrollView horizontal>
            {groupedData.map((row, index) => (
              <View key={index} style={{ flexDirection: 'column' }}>
                {row.map((item, rowIndex) => (
                  <View key={`${index}-${rowIndex}`}>{renderItem({ item, index: rowIndex })}</View>
                ))}
              </View>
            ))}
          </ScrollView>
        </ScrollView>
      </View>
    );
  };

  const renderMLBDates = () => (
    <FlatList
      ref={ref}
      data={dates}
      getItemLayout={(data, index) => ({
        length: ITEM_WIDTH,
        offset: ITEM_WIDTH * index,
        index,
      })}
      initialScrollIndex={index}
      renderItem={renderDateItem}
      keyExtractor={(item) => item}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.dateList}
      onScrollToIndexFailed={onScrollToIndexFailed}
    />
  );

  useFocusEffect(
    useCallback(() => {
      const fetchInitialData = async () => {
        await fetchGameData();
      };

      fetchInitialData();

      const intervalId = setInterval(
        () => fetchGameData(),
        10000 // Refresh every 10 seconds
      );

      return () => clearInterval(intervalId); // Cleanup interval on blur
    }, [])
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeAreaContainer} />
      <View style={styles.header}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.headerText}>MLB</Text>
          <Ionicons name="baseball-outline" size={24} color="white" marginLeft={5} />
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={25} color="white" marginRight={10} />
          </TouchableOpacity>
          <TouchableOpacity>
            <AntDesign name="search1" size={25} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.headerContainer}>
        {dateListLoading ? <ActivityIndicator size="large" color="white" /> : renderMLBDates()}
      </View>
      <View
        style={{
          flex: 1,
          backgroundColor: 'black',
          paddingHorizontal: 10,
        }}>
        {renderMLBComponent()}
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
    backgroundColor: '#141414',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
    marginLeft: 10,
  },
  headerIcons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginRight: 10,
  },
  headerContainer: {
    height: 50,
  },
  dateList: {
    justifyContent: 'center',
  },
  dateButton: {
    width: ITEM_WIDTH,
    height: '100%',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  selectedDateText: {
    fontWeight: 'bold',
    color: '#FFDB58',
  },
  itemContainer: {
    flexDirection: 'row',
    width: width * 0.6,
    padding: 10,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 5,
    margin: 2,
    backgroundColor: '#141414',
  },
  TextStyle1: {
    fontSize: 14,
    fontWeight: 'normal',
    color: 'white',
    textAlign: 'left',
    marginBottom: 4,
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'left',
    marginBottom: 4,
  },
  TextStyle2: {
    fontSize: 15,
    fontWeight: 'normal',
    color: 'white',
    textAlign: 'center',
  },
  inning: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  gametime: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'left',
  },
  TextStyle3: {
    fontSize: 12,
    fontWeight: 'normal',
    color: 'white',
    textAlign: 'center',
  },
  column: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameTime: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  column2: {
    flex: 1,
    flexDirection: 'column',
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginRight: 5,
  },
  image: {
    width: 35,
    height: 35,
  },
  basesContainer: {
    marginVertical: 5,
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
});

export default MLB;
