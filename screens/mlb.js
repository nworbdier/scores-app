import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
} from 'react-native';

import NavBar from '../components/navbar'; // Import the NavBar component

const ITEM_WIDTH = 75;

const MLB = () => {
  const navigation = useNavigation();
  const [gameData, setGameData] = useState([]);
  const [dates, setDates] = useState([]);
  const [datesFetched, setDatesFetched] = useState(false);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYYMMDD'));
  const [refreshing, setRefreshing] = useState(false);
  const [dateListLoading, setDateListLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const ref = useRef();

  const formatToYYYYMMDD = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    if (month < 10) {
      month = `0${month}`;
    }
    if (day < 10) {
      day = `0${day}`;
    }

    return `${year}${month}${day}`;
  };

  const fetchDates = async () => {
    try {
      const response = await fetch(
        `https://sports.core.api.espn.com/v2/sports/baseball/leagues/mlb/calendar/whitelist`
      );
      const data = await response.json();
      const dates = data.eventDate.dates.map((date) => formatToYYYYMMDD(date));

      setDates(dates);
      setDatesFetched(true); // Set the flag to true
      const newIndex = dates.findIndex((date) => date === selectedDate);
      setIndex(newIndex >= 0 ? newIndex : 0);
    } catch (error) {
      console.error('Error in fetchNBADates:', error);
    }
  };

  const fetchGameData = async () => {
    try {
      let formattedDate;

      if (selectedDate && /^\d{8}$/.test(selectedDate)) {
        formattedDate = selectedDate;
      } else {
        return;
      }

      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${formattedDate}`
      );

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const gameData = data.events.map((event) => {
        return {
          id: event.id,
          HomeTeam: event.competitions[0].competitors[0].team.abbreviation,
          HomeLogo: event.competitions[0].competitors[0].team.logo,
          HomeScore: event.competitions[0].competitors[0].score,
          HomeTeamRecordSummary: event.competitions[0].competitors[0].records[0].summary,
          AwayTeam: event.competitions[0].competitors[1].team.abbreviation,
          AwayLogo: event.competitions[0].competitors[1].team.logo,
          AwayScore: event.competitions[0].competitors[1].score,
          AwayTeamRecordSummary: event.competitions[0].competitors[1].records[0].summary,
          GameTime: event.competitions[0].date,
          Status: event.competitions[0].status.type.name,
          StatusShortDetail: event.competitions[0].status.type.shortDetail,
          DisplayClock: event.status.displayClock,
          Quarter: event.status.period,
        };
      });

      setGameData(gameData);
    } catch (error) {
      console.error('Error in fetchNBAGameData:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchDates();
      const formattedDate = formatToYYYYMMDD(selectedDate);
      await fetchGameData(formattedDate);
    };
    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    if (ref.current && datesFetched) {
      // Check if dates have been fetched
      const wait = new Promise((resolve) => setTimeout(resolve, 1000));
      wait.then(() => {
        ref.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      });
    }
  }, [index, ref, datesFetched]);

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
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    // eslint-disable-next-line no-undef
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };

  const renderDateItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.dateButton, item === selectedDate]}
      onPress={() => setSelectedDate(item)}
      activeOpacity={1}>
      <Text style={[styles.dateText, item === selectedDate && styles.selectedDateText]}>
        {moment(item).format('MMM D')}
      </Text>
    </TouchableOpacity>
  );

  const renderMLBComponent = () => {
    return (
      <View style={{ flex: 1 }}>
        {gameData.length > 0 ? (
          <FlatList
            data={gameData}
            renderItem={({ item, index }) => (
              <View key={index} style={{ flex: 1 }}>
                <TouchableOpacity
                  style={styles.itemContainer}
                  onPress={() => navigation.navigate('MLBDetails', { eventId: item.id })}>
                  <View style={styles.column}>
                    <Image source={{ uri: item.AwayLogo }} style={styles.image} />
                    <Text style={styles.TextStyle1}>{item.AwayTeam}</Text>
                    {item.Status === 'STATUS_SCHEDULED' ? (
                      <Text style={styles.TextStyle1}>{item.AwayTeamRecordSummary}</Text>
                    ) : (
                      <Text style={styles.TextStyle1}>{item.AwayScore}</Text>
                    )}
                  </View>
                  <View style={styles.column2}>
                    {item.Status === 'STATUS_SCHEDULED' ? (
                      <Text style={styles.TextStyle2}>{formatGameTime(item.GameTime)}</Text>
                    ) : item.Status === 'STATUS_FINAL' ? (
                      <Text style={styles.TextStyle2}>{item.StatusShortDetail}</Text>
                    ) : (
                      <View style={styles.gameTime}>
                        {item.StatusShortDetail.includes('Top') && (
                          <Text style={styles.TextStyle2}>Top {item.Quarter}</Text>
                        )}
                        {item.StatusShortDetail.includes('Mid') && (
                          <Text style={styles.TextStyle2}>Mid {item.Quarter}</Text>
                        )}
                        {item.StatusShortDetail.includes('Bot') && (
                          <Text style={styles.TextStyle2}>Bot {item.Quarter}</Text>
                        )}
                        {item.StatusShortDetail.includes('End') && (
                          <Text style={styles.TextStyle2}>End {item.Quarter}</Text>
                        )}
                      </View>
                    )}
                  </View>
                  <View style={styles.column}>
                    <Image source={{ uri: item.HomeLogo }} style={styles.image} />
                    <Text style={styles.TextStyle1}>{item.HomeTeam}</Text>
                    {item.Status === 'STATUS_SCHEDULED' ? (
                      <Text style={styles.TextStyle1}>{item.HomeTeamRecordSummary}</Text>
                    ) : (
                      <Text style={styles.TextStyle1}>{item.HomeScore}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#888" />
            }
            numColumns={2}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>No games available</Text>
          </View>
        )}
      </View>
    );
  };

  const renderMLBDates = () => {
    return (
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
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeAreaContainer} />
      <View style={styles.header}>
        <Text style={styles.headerText}>MLB</Text>
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
    backgroundColor: 'black',
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
    height: 70,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  selectedDateText: {
    fontWeight: 'bold',
    color: '#FFDB58',
  },
  itemContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 5,
    borderWidth: 0.5,
    borderColor: 'white',
    borderRadius: 5,
    margin: 3,
    backgroundColor: '#141414',
  },
  TextStyle1: {
    fontSize: 14,
    fontWeight: 'normal',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  TextStyle2: {
    fontSize: 15,
    fontWeight: 'normal',
    color: 'white',
    textAlign: 'center',
    marginBottom: 2,
  },
  TextStyle3: {
    fontSize: 12,
    fontWeight: 'normal',
    color: 'white',
    textAlign: 'center',
    marginTop: 2,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  gameTime: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  column2: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  image: {
    width: 40,
    height: 40,
    marginBottom: 5,
  },
});

export default MLB;
