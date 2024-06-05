/* eslint-disable @typescript-eslint/no-unused-vars */
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import moment from 'moment';
import React, { ReactNode, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';

import { RootStackParamList } from '../navigation';

type ScoresScreenNavigationProps = StackNavigationProp<RootStackParamList, 'Scores'>;

type Athlete = {
  headshot: { href: string };
  displayName: string;
};

type Competitor = {
  displayRecord: ReactNode;
  records: { summary: string }[];
  winner: boolean;
  athlete: Athlete;
};

type Competition = {
  status: {
    result: any;
    type: { name: string };
};
  id: string;
  competitors: Competitor[];
};

type Card = {
  displayName: string;
  competitions: Competition[];
};

type EventDetails = {
  cards: { [key: string]: Card };
};

type Event = {
  id: string;
  name: string;
};

type CalendarDate = {
  startDate: string;
};

const options = {
  method: 'GET',
};

const findClosestDate = (dates: string[]): string => {
  const today = moment();
  return dates.reduce((closestDate, currentDate) => {
    const currentDiff = Math.abs(today.diff(moment(currentDate), 'days'));
    const closestDiff = Math.abs(today.diff(moment(closestDate), 'days'));
    return currentDiff < closestDiff ? currentDate : closestDate;
  });
};

export default function Scores() {
  const navigation = useNavigation<ScoresScreenNavigationProps>();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [dates, setDates] = useState<string[]>([]);

  const fetchDates = async () => {
    try {
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?dates=2024`,
        options
      );
      const result = await response.json();
      const calendarDates = result.leagues[0].calendar.map((item: CalendarDate) => item.startDate);
      setDates(calendarDates);
      if (calendarDates.length > 0) {
        const closestDate = findClosestDate(calendarDates);
        setSelectedDate(closestDate);
        fetchEvents(closestDate);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEvents = async (date: string) => {
    try {
      const formattedDate = moment(date).format('YYYYMMDD');
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?dates=${formattedDate}`,
        options
      );
      const result = await response.json();
      setEvents(result.events);
      if (result.events.length > 0) {
        fetchEventDetails(result.events[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEventDetails = async (eventId: string) => {
    try {
      const response = await fetch(
        `https://site.web.api.espn.com/apis/common/v3/sports/mma/ufc/fightcenter/${eventId}`,
        options
      );
      const result = await response.json();
      setEventDetails(result);
    } catch (error) {
      console.error(error);
    }
  };

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

  const renderDateItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.dateButton, item === selectedDate && styles.selectedDateButton]}
      onPress={() => setSelectedDate(item)}>
      <Text style={[styles.dateText, item === selectedDate && styles.selectedDateText]}>
        {moment(item).format('MMM DD')}
      </Text>
    </TouchableOpacity>
  );

  const renderEventItem = ({ item }: { item: Event }) => (
    <View style={styles.eventContainer}>
      <Text style={styles.eventName}>{item.name}</Text>
    </View>
  );

  const renderCompetitionItem = (competition: Competition, cardKey: string) => {
    const statusType = competition.status.type.name;
    const competitor1 = competition.competitors[0];
    const competitor2 = competition.competitors[1];
    const result = competition.status.result;

    const getImageSource = (competitor: Competitor) => {
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
            {statusType === 'STATUS_SCHEDULED'
              ? competitor1.displayRecord
              : competitor1.winner
                ? 'W'
                : 'L'}
          </Text>
        </View>
        <View style={styles.vsColumn}>
          {statusType === 'STATUS_FINAL' ? (
            <View style={styles.resultColumn}>
              <Text style={[styles.resultText, styles.centeredText]}>
                {result.shortDisplayName}
              </Text>
              <Text style={[styles.resultDescription, styles.centeredText]}>
                {result.description}
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
            {statusType === 'STATUS_SCHEDULED'
              ? competitor2.displayRecord
              : competitor2.winner
                ? 'W'
                : 'L'}
          </Text>
        </View>
      </View>
    );
  };

  const renderCard = (cardKey: string) => {
    const card = eventDetails?.cards[cardKey];
    return (
      <View style={styles.cardContainer} key={cardKey}>
        <Text style={styles.cardName}>{card?.displayName}</Text>
        {card?.competitions.map(renderCompetitionItem)}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 }}>
          <View style={{ flex: 4, alignItems: 'flex-start' }}>
            <Text style={{ color: 'white', fontSize: 24, marginLeft: 10 }}>MATCHES</Text>
          </View>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              alignItems: 'center',
            }}>
            <TouchableOpacity style={{ marginHorizontal: 0 }}>
              <Ionicons name="settings-outline" size={25} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={{ marginHorizontal: 0 }}>
              <AntDesign name="search1" size={25} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.headerContainer}>
        <FlatList
          data={dates}
          renderItem={renderDateItem}
          keyExtractor={(item) => item}
          horizontal
          contentContainerStyle={styles.dateList}
          showsHorizontalScrollIndicator={false}
        />
      </View>
      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.eventList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}>
        {eventDetails &&
          Object.keys(eventDetails.cards).map((cardKey) => (
            <View key={cardKey}>{renderCard(cardKey)}</View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'black',
  },
  headerContainer: {
    height: 35, // Adjust as needed
  },
  dateList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  dateButton: {
    height: '100%',
    marginHorizontal: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#ececec',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDateButton: {
    backgroundColor: '#cce5ff',
  },
  dateText: {
    fontSize: 16,
  },
  selectedDateText: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  eventList: {
    paddingTop: 10,
  },
  eventContainer: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: 'black',
    borderRadius: 5,
  },
  eventName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'white',
  },
  cardContainer: {
    marginBottom: 20,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  competitorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  competitorColumn: {
    flex: 3,
    alignItems: 'center',
  },
  vsColumn: {
    flex: 1,
    alignItems: 'center',
  },
  headshotImage: {
    width: 75,
    height: 75,
    borderRadius: 25,
    marginBottom: 10,
  },
  competitorName: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  vsText: {
    fontSize: 18,
    color: 'white',
  },
  resultColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2.5,
  },
  resultDescription: {
    fontSize: 14,
    color: 'white',
    marginTop: 2.5,
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
});
