/* eslint-disable @typescript-eslint/no-unused-vars */
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import moment from 'moment';
import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import MLB from './mlb';
import UFC from './ufc';
import { RootStackParamList } from '../navigation';

type ScoresScreenNavigationProps = StackNavigationProp<RootStackParamList, 'Scores'>;

const sportNames = ['UFC', 'TENNIS', 'MLB', 'NBA', 'WNBA', 'NHL', 'NFL', 'CFB', 'CBB'];

const Scores = () => {
  const navigation = useNavigation<ScoresScreenNavigationProps>();
  const [selectedSport, setSelectedSport] = useState<string>('UFC');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const { events, eventDetails, dates, onRefresh, renderCard } = UFC({
    selectedDate,
    setSelectedDate,
    refreshing,
    setRefreshing,
  });

  useEffect(() => {
    if (selectedDate && dates.includes(selectedDate) && flatListRef.current) {
      const index = dates.findIndex((date) => date === selectedDate);
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }
  }, [selectedDate, dates]);

  const flatListRef = useRef<FlatList<string>>(null);

  const renderSportItem = ({ item }: { item: string }) => (
    <TouchableOpacity style={styles.sportButton} onPress={() => setSelectedSport(item)}>
      <Text style={[styles.sportText, selectedSport === item && styles.selectedSportText]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderDateItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.dateButton, item === selectedDate && styles.selectedDateButton]}
      onPress={() => setSelectedDate(item)}>
      <Text style={[styles.dateText, item === selectedDate && styles.selectedDateText]}>
        {moment(item).format('MMM DD')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 }}>
          <View style={{ flex: 4, alignItems: 'flex-start' }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 24, marginLeft: 10 }}>
              Scores
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              alignItems: 'center',
            }}>
            <TouchableOpacity>
              <Ionicons name="settings-outline" size={25} color="white" />
            </TouchableOpacity>
            <TouchableOpacity>
              <AntDesign name="search1" size={25} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.headerContainer}>
        <FlatList
          data={sportNames}
          renderItem={renderSportItem}
          keyExtractor={(item) => item}
          horizontal
          contentContainerStyle={styles.sportList}
          showsHorizontalScrollIndicator={false}
        />
        <FlatList
          data={dates}
          renderItem={renderDateItem}
          keyExtractor={(item) => item}
          horizontal
          contentContainerStyle={styles.dateList}
          showsHorizontalScrollIndicator={false}
          ref={flatListRef}
          getItemLayout={(data, index) => ({ length: 100, offset: 100 * index, index })}
        />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.eventNameContainer}>
          <Text style={styles.eventNameText}>
            {events.length > 0 ? events[0].name : 'No events'}
          </Text>
        </View>
        {eventDetails &&
          Object.keys(eventDetails.cards).map((cardKey) => (
            <View key={cardKey}>{renderCard(cardKey)}</View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  headerContainer: {
    height: 70, // Adjusted to accommodate both sport and date lists
  },
  sportList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  sportButton: {
    height: '100%',
    marginHorizontal: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  selectedSportText: {
    color: '#FFDB58', // Mustard yellow color
  },
  dateList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  dateButton: {
    height: '100%',
    marginHorizontal: 15,
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
  eventNameContainer: {
    paddingVertical: 10,
    backgroundColor: 'black',
  },
  eventNameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'left',
  },
  scrollViewContent: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
});

export default Scores;
