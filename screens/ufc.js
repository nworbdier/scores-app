import { AntDesign, Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  FlatList,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import NavBar from '../components/navbar'; // Import the NavBar component

const options = {
  method: 'GET',
};

const ITEM_WIDTH = 75; // Define a fixed width for date items

const findClosestDate = (dates) => {
  const today = moment();
  return dates.reduce((closestDate, currentDate) => {
    const currentDiff = Math.abs(today.diff(moment(currentDate), 'days'));
    const closestDiff = Math.abs(today.diff(moment(closestDate), 'days'));
    return currentDiff < closestDiff ? currentDate : closestDate;
  });
};

const UFC = () => {
  const ref = useRef();
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYYMMDD'));
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);
  const [dates, setDates] = useState([]);
  const [datesFetched, setDatesFetched] = useState(false);
  const [index, setIndex] = useState(0);
  const [dateListLoading, setDateListLoading] = useState(true);

  const formatToYYYYMMDD = (dateString) => {
    const date = moment(dateString);
    return date.format('YYYYMMDD');
  };

  const fetchDates = async () => {
    try {
      const response = await fetch(
        `https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/calendar/whitelist`
      );
      const data = await response.json();
      const dates = data.eventDate.dates.map((date) => formatToYYYYMMDD(date));
      const closestDate = findClosestDate(dates);
      const newIndex = dates.findIndex((date) => date === closestDate);
      setDates(dates);
      setDatesFetched(true); // Set the flag to true
      setIndex(newIndex);
      setSelectedDate(closestDate);
      setDateListLoading(false);
    } catch (error) {
      console.error('Error fetching dates:', error);
      setDates([]);
      setDateListLoading(false);
    }
  };

  const fetchEvents = async (selectedDate) => {
    try {
      const formattedDate = formatToYYYYMMDD(selectedDate);
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?dates=${formattedDate}`,
        options
      );
      console.log('Fetch UFC Events Data URL:', response.url);
      const result = await response.json();
      setEvents(result.events || []);
      if (result.events && result.events.length > 0) {
        await fetchEventDetails(result.events[0].id);
      }
    } catch (error) {
      console.error('Error fetching UFC events:', error);
    }
  };

  const fetchEventDetails = async (eventId) => {
    try {
      const response = await fetch(
        `https://site.web.api.espn.com/apis/common/v3/sports/mma/ufc/fightcenter/${eventId}`,
        options
      );
      const result = await response.json();
      setEventDetails(result);
    } catch (error) {
      console.error('Error fetching UFC event details:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchDates();
      const closestDate = findClosestDate(dates);
      setSelectedDate(closestDate);
      await fetchEvents(closestDate);
    };
    fetchData();
  }, []);

  useEffect(() => {
    fetchDates();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchEvents(selectedDate);
    }
  }, [selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents(selectedDate);
    setRefreshing(false);
  };

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
    const wait = new Promise((resolve) => setTimeout(resolve, 1000));
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

  const renderCompetitionItem = (competition, cardKey) => {
    const statusType = competition.status.type.name;
    const competitor1 = competition.competitors[0];
    const competitor2 = competition.competitors[1];
    const result = competition.status.result;
    const isInProgress = statusType === 'STATUS_IN_PROGRESS';
    const period = competition.status.period;
    const displayClock = competition.status.displayClock;

    const getImageSource = (competitor) => {
      const { headshot, athlete } = competitor.athlete || {};
      return headshot && headshot.href
        ? { uri: headshot.href }
        : athlete && athlete.flag && athlete.flag.href
          ? { uri: athlete.flag.href }
          : null;
    };

    return (
      <View style={styles.competitorsContainer} key={competition.id}>
        <View style={styles.competitorColumn}>
          {getImageSource(competitor1) && (
            <Image source={getImageSource(competitor1)} style={styles.headshotImage} />
          )}
          <Text style={styles.competitorName}>{competitor1.athlete.displayName}</Text>
          <Text
            style={[
              styles.resultText,
              statusType === 'STATUS_SCHEDULED' && styles.scheduledText,
              !competitor1.winner && statusType !== 'STATUS_SCHEDULED' && styles.lossText,
            ]}>
            {isInProgress
              ? '-'
              : statusType === 'STATUS_SCHEDULED'
                ? competitor1.displayRecord
                : competitor1.winner
                  ? 'W'
                  : 'L'}
          </Text>
        </View>
        <View style={styles.vsColumn}>
          {statusType === 'STATUS_FINAL' || isInProgress ? (
            <View style={styles.resultColumn}>
              <Text style={[styles.resultText2, styles.centeredText]}>
                {isInProgress ? `R${period}` : result.shortDisplayName}
              </Text>
              <Text style={[styles.resultDescription, styles.centeredText]}>
                {isInProgress ? displayClock : result.description}
              </Text>
            </View>
          ) : (
            <Text style={styles.vsText}>vs</Text>
          )}
        </View>
        <View style={styles.competitorColumn}>
          {getImageSource(competitor2) && (
            <Image source={getImageSource(competitor2)} style={styles.headshotImage} />
          )}
          <Text style={styles.competitorName}>{competitor2.athlete.displayName}</Text>
          <Text
            style={[
              styles.resultText,
              statusType === 'STATUS_SCHEDULED' && styles.scheduledText,
              !competitor2.winner && statusType !== 'STATUS_SCHEDULED' && styles.lossText,
            ]}>
            {isInProgress
              ? '-'
              : statusType === 'STATUS_SCHEDULED'
                ? competitor2.displayRecord
                : competitor2.winner
                  ? 'W'
                  : 'L'}
          </Text>
        </View>
      </View>
    );
  };

  const renderCard = (cardKey) => {
    const card = eventDetails?.cards[cardKey];
    const cardDate = card?.competitions[0]?.date;
    const statusType = card?.competitions[0]?.status?.type?.name;
    const cardTime =
      cardDate && statusType !== 'STATUS_FINAL' ? moment(cardDate).format('h:mm A') : '';

    return (
      <View style={styles.cardContainer} key={cardKey}>
        <Text style={styles.cardName2}>
          {card?.displayName} {cardTime && `- ${cardTime}`}
        </Text>
        {card?.competitions.map((comp) => renderCompetitionItem(comp, cardKey))}
      </View>
    );
  };

  const renderDateItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.dateButton, item === selectedDate && styles.selectedDateButton]}
      onPress={() => setSelectedDate(formatToYYYYMMDD(item))}
      activeOpacity={1}>
      <Text style={[styles.dateText, item === selectedDate && styles.selectedDateText]}>
        {moment(item).format('MMM D')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeAreaContainer} />
      <View style={styles.header}>
        <Text style={styles.headerText}>UFC</Text>
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
        {dateListLoading ? (
          <ActivityIndicator size="large" color="white" />
        ) : (
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
        )}
      </View>
      <View style={{ flex: 1 }}>
        {events && events.length > 0 ? (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.cardContainer}>
                <Text style={styles.cardName}>{item.name}</Text>
                {Object.keys(eventDetails?.cards || {}).map((cardKey) => (
                  <View key={cardKey}>{renderCard(cardKey)}</View>
                ))}
              </View>
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#888" />
            }
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: 'white' }}> </Text>
          </View>
        )}
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
    marginVertical: 5,
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
    height: 40,
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
  competitorsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderWidth: 0.5,
    borderColor: 'white',
    marginBottom: 10,
    paddingVertical: 10,
    borderRadius: 5,
  },
  competitorColumn: {
    flex: 3,
    alignItems: 'center',
  },
  eventNameContainer: {
    paddingVertical: 5,
    backgroundColor: 'black',
  },
  eventNameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'left',
  },
  cardContainer: {
    marginBottom: 20,
    marginHorizontal: 5,
  },
  cardName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 10,
  },
  cardName2: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  vsColumn: {
    flex: 1,
    alignItems: 'center',
  },
  headshotImage: {
    width: 60,
    height: 60,
    borderRadius: 25,
    marginBottom: 10,
  },
  competitorName: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'green',
  },
  resultText2: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  vsText: {
    fontSize: 18,
    color: 'white',
  },
  resultColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultDescription: {
    fontSize: 12,
    color: 'white',
  },
  centeredText: {
    textAlign: 'center',
  },
  scheduledText: {
    color: 'gray',
  },
  lossText: {
    color: 'red',
  },
  competitionTypeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default UFC;
