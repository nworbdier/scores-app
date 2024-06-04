/* eslint-disable @typescript-eslint/no-unused-vars */
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
} from 'react-native';

import { RootStackParamList } from '../navigation';

type ScoresScreenNavigationProps = StackNavigationProp<RootStackParamList, 'Scores'>;

type Athlete = {
  displayName: string;
};

type Competitor = {
  athlete: Athlete;
};

type Competition = {
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

  const renderCompetitionItem = ({ item }: { item: Competition }) => (
    <View style={styles.competitorsContainer}>
      <Text style={styles.competitorName}>{item.competitors[0]?.athlete.displayName}</Text>
      <Text style={styles.vsText}>vs</Text>
      <Text style={styles.competitorName}>{item.competitors[1]?.athlete.displayName}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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
  },
  headerContainer: {
    height: 50, // Adjust as needed
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
    paddingTop: 20,
  },
  eventContainer: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
  },
  eventName: {
    fontSize: 16,
    marginBottom: 10,
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
    fontSize: 14,
  },
  vsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
