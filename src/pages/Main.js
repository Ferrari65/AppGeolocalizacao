// src/components/Main.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

import styles from "../styles/MainStyles";
import useLocation from "../hooks/useLocation";
import FormUser from "../components/FormUser";

const { height } = Dimensions.get("window");

export default function Main() {
  const { coords, errorMsg } = useLocation();
  const mapRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!coords || users.length === 0 || !mapRef.current) return;

    const allCoords = [
      { latitude: coords.latitude, longitude: coords.longitude },
      ...users,
    ];

    const latitudes = allCoords.map((c) => c.latitude);
    const longitudes = allCoords.map((c) => c.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;

    const deltaLat = (maxLat - minLat) * 1.4 || 0.01;
    const deltaLng = (maxLng - minLng) * 1.4 || 0.01;

    mapRef.current.animateToRegion(
      {
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: deltaLat,
        longitudeDelta: deltaLng,
      },
      800
    );
  }, [users, coords]);

  const handleAddUser = async (nome, endereco) => {
    setModalVisible(false);
    try {
      const geoResults = await Location.geocodeAsync(endereco);
      if (geoResults.length === 0) {
        alert("Endereço não encontrado");
        return;
      }
      const { latitude, longitude } = geoResults[0];
      setUsers((prev) => [...prev, { nome, latitude, longitude }]);
    } catch (error) {
      console.error("Erro ao geocodificar o endereço:", error);
      alert("Ocorreu um erro ao converter o endereço em coordenadas");
    }
  };

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }
  if (!coords) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3498DB" />
        <Text style={styles.loadingText}>Carregando localização...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
      >
        <Marker coordinate={coords} title="Você está aqui" pinColor="red" />
        {users.map((u, i) => (
          <Marker
            key={i}
            coordinate={{ latitude: u.latitude, longitude: u.longitude }}
            title={u.nome}
          />
        ))}
      </MapView>

      <TouchableOpacity
        style={styles.openButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.openButtonText}>＋ Adicionar usuario</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoiding}
          >
            <View style={[styles.bottomSheet, { maxHeight: height * 0.6 }]}>
              <View style={styles.handleBar} />
              <ScrollView
                contentContainerStyle={styles.bottomSheetContent}
                keyboardShouldPersistTaps="handled"
              >
                <FormUser onAddUser={handleAddUser} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
