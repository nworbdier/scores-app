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
  Dimensions,
} from 'react-native';

import MLB from './mlb';
import NBA from './nba';
import PGA from './pga';
import UFC from './ufc';

const { width } = Dimensions.get('window');

const sportNames = ['UFC', 'PGA', 'MLB', 'NBA', 'WNBA', 'TENNIS', 'NHL', 'NFL', 'CFB', 'CBB'];

const Scores = () => {
  const [selectedSport, setSelectedSport] = useState('UFC');
  const [selectedDate, setSelectedDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);

  const {
    renderUFCComponent,
    dates: ufcDates,
    onRefresh: onUFCRefresh,
  } = UFC({
    selectedDate,
    setSelectedDate,
    refreshing,
    setRefreshing,
  });

  const {
    renderMLBComponent,
    dates: mlbDates,
    onRefresh: onMLBRefresh,
    fetchDates: fetchMLBDates,
  } = MLB({
    selectedDate,
    setSelectedDate,
    refreshing,
    setRefreshing,
  });

  const {
    renderNBAComponent,
    dates: nbaDates,
    onRefresh: onNBARefresh,
    fetchDates: fetchNBADates,
  } = NBA({
    selectedDate,
    setSelectedDate,
    refreshing,
    setRefreshing,
  });

  useEffect(() => {
    if (selectedSport === 'MLB') {
      fetchMLBDates();
    }
  }, [selectedSport]);

  useEffect(() => {
    if (selectedSport === 'NBA') {
      fetchNBADates();
    }
  }, [selectedSport]);

  useEffect(() => {
    if (selectedSport !== 'PGA') {
      const dates = selectedSport === 'UFC' ? ufcDates : mlbDates;
      const index = dates.findIndex((date) => date === selectedDate);
      if (index !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0 });
      }
    }
  }, [selectedDate, selectedSport, ufcDates, mlbDates]);

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

  const getDates = () => {
    switch (selectedSport) {
      case 'UFC':
        return ufcDates;
      case 'MLB':
        return mlbDates;
      case 'NBA':
        return nbaDates;
      // Add other cases for other sports if needed
      default:
        return [];
    }
  };

  const getOnRefresh = () => {
    switch (selectedSport) {
      case 'UFC':
        return onUFCRefresh;
      case 'MLB':
        return onMLBRefresh;
      case 'NBA':
        return onNBARefresh;
      // Add other cases for other sports if needed
      default:
        return () => {};
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Scores</Text>
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
        <FlatList
          data={sportNames}
          renderItem={renderSportItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sportList}
        />
        {selectedSport !== 'PGA' && (
          <FlatList
            data={getDates()}
            renderItem={renderDateItem}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            ref={flatListRef}
            getItemLayout={(_, index) => ({ length: 100, offset: 100 * index, index })}
            contentContainerStyle={styles.dateList}
            initialScrollIndex={getDates().findIndex((date) => date === selectedDate)}
          />
        )}
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
        horizontal={false} // Add this line to restrict horizontal scrolling
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={getOnRefresh()} />}>
        {selectedSport === 'PGA' && <PGA />}
        {selectedSport === 'UFC' && renderUFCComponent()}
        {selectedSport === 'MLB' && renderMLBComponent()}
        {selectedSport === 'NBA' && renderNBAComponent()}
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
    marginRight: 10,
  },
  headerContainer: {
    height: 70,
  },
  sportList: {
    justifyContent: 'center',
  },
  sportButton: {
    height: '100%',
    marginHorizontal: 7,
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
    width: 100, // Fixed width for each date button
    height: '100%',
    marginHorizontal: 5,
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
  scrollViewContent: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
});

export default Scores;
