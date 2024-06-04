/* eslint-disable @typescript-eslint/no-unused-vars */
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';

import { RootStackParamList } from '../navigation';

type ScoresScreenNavigationProps = StackNavigationProp<RootStackParamList, 'Scores'>;

type Athlete = {
  flag: any;
  displayName: string;
};

type Competitor = {
  records: any;
  winner: any;
  athlete: Athlete;
};

type Competition = {
  status: any;
  id: any;
  competitors: Competitor[];
};

type Event = {
  id: string;
  name: string;
  competitions: Competition[];
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
        fetchScores(closestDate);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchScores = async (date: string) => {
    try {
      const formattedDate = moment(date).format('YYYYMMDD');
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?dates=${formattedDate}`,
        options
      );
      const result = await response.json();
      setEvents(result.events);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDates();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchScores(selectedDate);
    }
  }, [selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchScores(selectedDate);
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
      <FlatList
        data={item.competitions}
        renderItem={renderCompetitionItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
      />
    </View>
  );

  const renderCompetitionItem = ({ item }: { item: Competition }) => {
    const statusType = item.status?.type?.name;
    const competitor1Record = item.competitors[0]?.records[0]?.summary;
    const competitor2Record = item.competitors[1]?.records[0]?.summary;

    return (
      <View style={styles.competitorsContainer}>
        <View style={styles.competitorColumn}>
          <Image
            source={{ uri: item.competitors[0]?.athlete.flag.href }}
            style={styles.flagImage}
          />
          <Text style={styles.competitorName}>{item.competitors[0]?.athlete.displayName}</Text>
          <Text
            style={[
              styles.resultText,
              statusType === 'STATUS_SCHEDULED' && styles.scheduledText,
              statusType === 'L' && styles.lossText,
            ]}>
            {statusType === 'STATUS_SCHEDULED'
              ? competitor1Record
              : item.competitors[0]?.winner
                ? 'W'
                : 'L'}
          </Text>
        </View>
        <View style={styles.vsColumn}>
          <Text style={styles.vsText}>vs</Text>
        </View>
        <View style={styles.competitorColumn}>
          <Image
            source={{ uri: item.competitors[1]?.athlete.flag.href }}
            style={styles.flagImage}
          />
          <Text style={styles.competitorName}>{item.competitors[1]?.athlete.displayName}</Text>
          <Text
            style={[
              styles.resultText,
              statusType === 'STATUS_SCHEDULED' && styles.scheduledText,
              statusType === 'L' && styles.lossText,
            ]}>
            {statusType === 'STATUS_SCHEDULED'
              ? competitor2Record
              : item.competitors[1]?.winner
                ? 'W'
                : 'L'}
          </Text>
        </View>
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
    fontSize: 24,
    marginBottom: 10,
    color: 'white',
  },
  competitorsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
    padding: 10,
    borderRadius: 3,
    backgroundColor: '#ffffff', // background color for competitors container
    borderWidth: 1, // border width for competitors container
    borderColor: '#ccc', // border color for competitors container
  },
  competitorName: {
    fontSize: 12,
  },
  competitorColumn: {
    alignItems: 'center',
    flex: 2,
  },
  flagImage: {
    width: 30,
    height: 20,
    marginBottom: 5,
  },
  resultText: {
    fontSize: 20,
    color: 'green', // you can adjust color as needed
  },
  scheduledText: {
    color: 'black',
  },
  lossText: {
    color: 'red',
  },
  vsColumn: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  vsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
