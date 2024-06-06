import { AntDesign, Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

import UFC from './ufc';

const sportNames = ['UFC', 'TENNIS', 'MLB', 'NBA', 'WNBA', 'NHL', 'NFL', 'CFB', 'CBB'];

const Scores = () => {
  const [selectedSport, setSelectedSport] = useState('UFC');
  const [selectedDate, setSelectedDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);

  const { events, eventDetails, dates, onRefresh, renderCard } = UFC({
    selectedDate,
    setSelectedDate,
    refreshing,
    setRefreshing,
  });

  useEffect(() => {
    const index = dates.findIndex((date) => date === selectedDate);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }
  }, [selectedDate, dates]);

  const renderSportItem = ({ item }) => (
    <TouchableOpacity style={styles.sportButton} onPress={() => setSelectedSport(item)}>
      <Text style={[styles.sportText, selectedSport === item && styles.selectedSportText]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderDateItem = ({ item }) => (
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
      <View style={styles.header}>
        <Text style={styles.headerText}>Scores</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={25} color="white" />
          </TouchableOpacity>
          <TouchableOpacity>
            <AntDesign name="search1" size={25} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.headerContainer}>
        <FlatList
          data={sportNames}
          renderItem={renderSportItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sportList}
        />
        <FlatList
          data={dates}
          renderItem={renderDateItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          ref={flatListRef}
          getItemLayout={(_, index) => ({ length: 100, offset: 100 * index, index })}
          contentContainerStyle={styles.dateList}
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
  },
  headerContainer: {
    height: 70,
  },
  sportList: {
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
    color: '#FFDB58',
  },
  dateList: {
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
