import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, Text, FlatList, RefreshControl } from 'react-native';

const options = {
  method: 'GET',
};

const findClosestDate = (dates) => {
  const today = moment();
  return dates.reduce((closestDate, currentDate) => {
    const currentDiff = Math.abs(today.diff(moment(currentDate), 'days'));
    const closestDiff = Math.abs(today.diff(moment(closestDate), 'days'));
    return currentDiff < closestDiff ? currentDate : closestDate;
  });
};

const UFC = ({ selectedDate, setSelectedDate, refreshing, setRefreshing }) => {
  const [events, setEvents] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);
  const [dates, setDates] = useState([]);

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
        `https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?dates=2024`,
        options
      );
      const result = await response.json();
      const calendarDates = result.leagues[0].calendar.map((item) => item.startDate);
      setDates(calendarDates);

      // Find the closest date
      const closestDate = findClosestDate(calendarDates);

      // Set the selected date to the closest date
      setSelectedDate(closestDate);
    } catch (error) {
      console.error('Error fetching UFC dates:', error);
    }
  };

  const fetchEvents = async (selectedDate) => {
    try {
      // Use the selectedDate state instead of the dates parameter
      const formattedDate = formatToYYYYMMDD(selectedDate);
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?dates=${formattedDate}`,
        options
      );
      console.log('Fetch UFC Events Data URL:', response.url); // Logging the URL
      const result = await response.json();
      setEvents(result.events || []); // Ensure events is always an array
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
      console.log('Fetch UFC Event Details URL:', response.url); // Logging the URL
      const result = await response.json();
      setEventDetails(result);
    } catch (error) {
      console.error('Error fetching UFC event details:', error);
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

  const renderCompetitionItem = (competition, cardKey) => {
    const statusType = competition.status.type.name;
    const competitor1 = competition.competitors[0];
    const competitor2 = competition.competitors[1];
    const result = competition.status.result;
    const isInProgress = statusType === 'STATUS_IN_PROGRESS';
    const period = competition.status.period;
    const displayClock = competition.status.displayClock;
    const competitionTypeText = competition.type.text; // Change 'x' to the appropriate variable containing your data

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

  const renderUFCComponent = () => {
    return (
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
            <Text>No fights available</Text>
          </View>
        )}
      </View>
    );
  };

  return {
    events,
    eventDetails,
    fetchDates,
    dates,
    onRefresh,
    renderUFCComponent,
  };
};

const styles = StyleSheet.create({
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
    paddingVertical: 10,
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
