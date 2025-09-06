import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Icon } from '@react-native-vector-icons/material-icons';

const DASHBOARD_TILES = [
  { label: "Notes", icon: "sticky-note-2", path: "Notes" },
  { label: "Reminders", icon: "alarm", path: "Reminders" },
  { label: "Trips", icon: "explore", path: "Trips" },
  { label: "Budgets", icon: "account-balance-wallet", path: "Budgets" },
];

const HomeDummy = ({ navigation }) => {
  const [budgets] = useState([
    { id: "b1", name: "Goa Trip Budget", amount: 12000 },
    { id: "b2", name: "College Expenses", amount: 5000 },
  ]);

  const [reminders] = useState([
    { id: "r1", text: "Pack clothes" },
    { id: "r2", text: "Book tickets" },
  ]);

  const [myTrips] = useState([
    { id: "t1", name: "Goa Trip", from: "Jaipur", location: "Goa" },
    { id: "t2", name: "Manali Trek", from: "Delhi", location: "Manali" },
  ]);

  const renderTile = ({ item }) => (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => navigation?.navigate(item.path)}
    >
      <Icon name={item.icon} size={30} color="#333" />
      <Text style={styles.tileLabel}>{item.label}</Text>
    </TouchableOpacity>
  );

  const renderSection = (title, data, renderItem) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.viewMore}>View More</Text>
      </View>
      {data.length === 0 ? (
        <Text style={styles.emptyText}>No {title.toLowerCase()} found.</Text>
      ) : (
        data.slice(0, 3).map(renderItem)
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>BunkMate (Dummy Mode)</Text>

      {/* Tiles */}
      <FlatList
        data={DASHBOARD_TILES}
        renderItem={renderTile}
        keyExtractor={(item) => item.label}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-around" }}
        style={{ marginVertical: 10 }}
      />

      <ScrollView>
        {renderSection("Your Trips", myTrips, (trip) => (
          <View key={trip.id} style={styles.card}>
            <Text style={styles.cardTitle}>{trip.name}</Text>
            <Text style={styles.cardText}>
              {trip.from} → {trip.location}
            </Text>
          </View>
        ))}
        {renderSection("Your Budgets", budgets, (budget) => (
          <View key={budget.id} style={styles.card}>
            <Text style={styles.cardTitle}>{budget.name}</Text>
            <Text style={styles.cardText}>₹{budget.amount}</Text>
          </View>
        ))}
        {renderSection("Reminders", reminders, (rem) => (
          <View key={rem.id} style={styles.card}>
            <Text style={styles.cardText}>{rem.text}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  tile: {
    backgroundColor: "#eee",
    padding: 20,
    margin: 10,
    borderRadius: 12,
    alignItems: "center",
    width: "40%",
  },
  tileLabel: { marginTop: 5, fontSize: 14 },
  section: { marginVertical: 10, paddingHorizontal: 15 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontWeight: "bold" },
  viewMore: { color: "#007AFF" },
  emptyText: { fontSize: 14, color: "#888", marginTop: 5 },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
  },
  cardTitle: { fontWeight: "bold", fontSize: 16 },
  cardText: { fontSize: 14 },
});

export default HomeDummy;
