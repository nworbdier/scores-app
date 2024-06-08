import moment from 'moment';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  RefreshControl,
  Modal,
  TouchableOpacity,
} from 'react-native';

const PGA = () => {
  const [playersData, setPlayersData] = useState([]);
  const [tournamentName, setTournamentName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const fetchEventId = async () => {
    try {
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?dates=${currentDate}`
      );
      const data = await response.json();
      setCurrentData(data); // Set current data
      return data.events[0].id;
    } catch (error) {
      console.error('Error fetching PGA event ID:', error);
    }
  };

  const fetchPGAData = async (eventId) => {
    try {
      const response = await fetch(
        `https://site.web.api.espn.com/apis/site/v2/sports/golf/leaderboard?league=pga&event=${eventId}`
      );
      console.log('Fetch PGA  Data URL:', response.url); // Logging the URL
      const data = await response.json();
      setCurrentData(data); // Set current data

      setTournamentName(data.events[0].tournament.displayName);

      const players = data.events[0].competitions[0].competitors
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((competitor) => {
          const period = competitor.status.period;
          let today = '-';
          let thru = competitor.status.thru;

          if (competitor.status.type.name === 'STATUS_SCHEDULED') {
            thru = moment(competitor.status.teeTime).format('h:mm A');
          } else {
            if (competitor.linescores && competitor.linescores.length > 0) {
              const lineScoreIndex = period - 1;
              if (lineScoreIndex >= 0 && lineScoreIndex < competitor.linescores.length) {
                today = competitor.linescores[lineScoreIndex].displayValue || '-';
              }
            }
          }

          // Find the total score from statistics
          let totalScore = '-';
          if (competitor.statistics && competitor.statistics[0]) {
            totalScore = competitor.statistics[0].displayValue || '-';
          }

          return {
            id: competitor.athlete.id, // Assuming competitor has an id field
            pl: competitor.status.position.displayName,
            name: competitor.athlete.displayName,
            today,
            thru,
            tot: totalScore,
          };
        });

      setPlayersData(players);
    } catch (error) {
      console.error('Error fetching PGA data:', error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      const eventId = await fetchEventId();
      setCurrentEventId(eventId);
      if (eventId) {
        await fetchPGAData(eventId);
      }
    };

    initializeData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPGAData(currentEventId);
    setRefreshing(false);
  };

  const PlayerModal = ({ visible, player, onClose, statusPeriod }) => {
    const [selectedRound, setSelectedRound] = useState(`R${statusPeriod || 1}`);
    const [lineScores, setLineScores] = useState({});
    const [playerData, setPlayerData] = useState(null);

    useEffect(() => {
      const fetchPlayerData = async () => {
        if (!player) return;

        const eventId = currentEventId; // Assuming currentEventId is available in the scope
        const playerId = player.id;

        try {
          const response = await fetch(
            `https://site.web.api.espn.com/apis/site/v2/sports/golf/pga/leaderboard/${eventId}/competitorsummary/${playerId}`
          );
          const data = await response.json();
          setPlayerData(data);
        } catch (error) {
          console.error('Error fetching PGA player data:', error);
        }
      };

      fetchPlayerData();
    }, [player]);

    useEffect(() => {
      const updateScoresForSelectedRound = () => {
        if (!playerData || !playerData.rounds) return;

        const roundIndex = parseInt(selectedRound.slice(1)) - 1;
        if (playerData.rounds[roundIndex] && playerData.rounds[roundIndex].linescores) {
          const roundLineScores = playerData.rounds[roundIndex].linescores.map((ls) => ls.value);
          const outScore = playerData.rounds[roundIndex].outScore;
          const inScore = playerData.rounds[roundIndex].inScore;

          setLineScores({
            [selectedRound]: roundLineScores,
            outScore,
            inScore,
          });
        }
      };

      updateScoresForSelectedRound();
    }, [selectedRound, playerData]);

    if (!playerData) {
      // You can show a loading indicator here
      return null;
    }

    return (
      <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
            <View style={styles.modalPlayerInfo}>
              <Image
                source={{ uri: playerData?.competitor?.headshot }}
                style={styles.playerHeadshot}
              />
              <Text style={styles.modalPlayerName}>{player?.name}</Text>
            </View>
            <View style={styles.roundButtonsContainer}>
              {['R1', 'R2', 'R3', 'R4'].map((round) => (
                <TouchableOpacity
                  key={round}
                  style={[
                    styles.roundButton,
                    selectedRound === round && styles.selectedRoundButton,
                  ]}
                  onPress={() => setSelectedRound(round)}>
                  <Text style={styles.roundButtonText}>{round}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.scoresContainer}>
              <View style={styles.scoreRow}>
                {[...Array(9).keys()].map((i) => (
                  <Text key={i} style={styles.scoreCell}>
                    {i + 1}
                  </Text>
                ))}
                <Text style={[styles.scoreCell, styles.headerCell]}>Out</Text>
              </View>
              <View style={styles.scoreRow}>
                {[...Array(9).keys()].map((i) => (
                  <Text key={i} style={styles.scoreCell}>
                    {lineScores[selectedRound] ? lineScores[selectedRound][i] : ''}
                  </Text>
                ))}
                <Text style={styles.scoreCell}>{lineScores.outScore}</Text>
              </View>
              <View style={styles.scoreRow}>
                {[...Array(9).keys()].map((i) => (
                  <Text key={i} style={styles.scoreCell}>
                    {i + 10}
                  </Text>
                ))}
                <Text style={[styles.scoreCell, styles.headerCell]}>In</Text>
              </View>
              <View style={styles.scoreRow}>
                {[...Array(9).keys()].map((i) => (
                  <Text key={i} style={styles.scoreCell}>
                    {lineScores[selectedRound] ? lineScores[selectedRound][i + 9] : ''}
                  </Text>
                ))}
                <Text style={styles.scoreCell}>{lineScores.inScore}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderPlayer = ({ item }) => (
    <TouchableOpacity
      style={styles.playerRow}
      onPress={() => {
        setSelectedPlayer(item);
        setModalVisible(true);
      }}>
      <View style={styles.leftContainer}>
        <Text style={styles.playerPosition}>{item.pl}</Text>
        {item.headshot ? <Image source={{ uri: item.headshot }} style={styles.headshot} /> : null}
        <Text style={styles.playerName}>{item.name}</Text>
      </View>
      <View style={styles.rightContainer}>
        <Text style={styles.playerToday}>{item.today}</Text>
        <Text style={styles.playerThru}>{item.thru}</Text>
        <Text style={styles.playerTotal}>{item.tot}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => {
    // Extract the round number and status type from the current data
    const competition = currentData ? currentData.events[0].competitions[0] : null;
    let roundNumber = competition ? competition.status.period : '';
    const statusType = competition ? competition.status.type.name : '';

    // If the status type is STATUS_PLAY_COMPLETE, add 1 to the round number
    if (statusType === 'STATUS_PLAY_COMPLETE') {
      roundNumber += 1;
    }

    // Construct the header text based on the round number
    const headerText = roundNumber ? `R${roundNumber}` : 'Today';

    return (
      <View>
        <Text style={styles.tournamentName}>{tournamentName}</Text>
        <View style={styles.playerRow2}>
          <View style={styles.leftContainer}>
            <Text style={styles.headerPlayerPosition}>POS</Text>
            <Text style={styles.headerPlayerName}>PLAYER</Text>
          </View>
          <View style={styles.rightContainer}>
            <Text style={styles.headerPlayerToday}>{headerText}</Text>
            <Text style={styles.headerPlayerThru}>THRU</Text>
            <Text style={styles.headerPlayerTotal}>TOT</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={playersData}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.id.toString()} // Assuming competitor's ID is a number
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#888" />
        }
        ListHeaderComponent={renderHeader}
      />
      <PlayerModal
        visible={modalVisible}
        player={selectedPlayer}
        onClose={() => setModalVisible(false)}
        statusPeriod={selectedPlayer?.statusPeriod}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tournamentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    paddingBottom: 10,
    textAlign: 'left',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.25,
    borderBottomColor: '#ddd',
  },
  playerRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7.5,
    borderBottomWidth: 0.25,
    borderBottomColor: '#ddd',
  },
  leftContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    alignItems: 'center',
  },
  headerPlayerPosition: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  headerPlayerName: {
    color: 'white',
    flex: 4,
    textAlign: 'left',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  headerPlayerToday: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  headerPlayerThru: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  headerPlayerTotal: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  playerPosition: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
  },
  playerName: {
    color: 'white',
    flex: 4,
    textAlign: 'left',
  },
  playerToday: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
  },
  playerThru: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
  },
  playerTotal: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
  },
  listContent: {
    paddingHorizontal: 5,
  },
  headshot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    height: '75%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalPlayerInfo: {
    marginBottom: 20,
    alignItems: 'center',
  },
  playerHeadshot: {
    width: 80,
    height: 80,
    borderRadius: 40, // For a circular image
    marginBottom: 10, // Add some spacing between the image and name
  },
  modalPlayerName: {
    fontSize: 18,
  },
  roundButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  roundButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'gray',
  },
  selectedRoundButton: {
    backgroundColor: 'blue',
  },
  roundButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  scoresContainer: {
    alignItems: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  scoreCell: {
    width: 30,
    textAlign: 'center',
    color: 'black',
  },
});

export default PGA;
