import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';
import { BlurView } from 'expo-blur';

import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import AddMarkerModal from '../components/AddMarkerModal';
import MapControls from '../components/MapControls';
import LocationCard from '../components/LocationCard';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const { theme } = useTheme();
  const {
    currentLocation,
    markers,
    loading,
    errorMsg,
    addMarker,
    removeMarker,
    calculateRoute,
    isTracking,
    startTracking,
    stopTracking,
  } = useLocation();

  const mapRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapType, setMapType] = useState('standard');
  const [showTraffic, setShowTraffic] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [trackingSubscription, setTrackingSubscription] = useState(null);
  
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (currentLocation && mapRef.current) {
      animateToCurrentLocation();
    }
  }, [currentLocation]);

  const animateToCurrentLocation = () => {
    mapRef.current?.animateToRegion({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  };

  const handleMarkerPress = (marker) => {
    setSelectedMarker(marker);
    showLocationCard();
  };

  const showLocationCard = () => {
    Animated.spring(slideAnim, {
      toValue: height - 300,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const hideLocationCard = () => {
    Animated.spring(slideAnim, {
      toValue: height,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start(() => {
      setSelectedMarker(null);
    });
  };

  const handleAddMarker = async (markerData) => {
    await addMarker(markerData);
    setModalVisible(false);
  };

  const handleDeleteMarker = async (markerId) => {
    Alert.alert(
      'Remover Marcador',
      'Tem certeza que deseja remover este marcador?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await removeMarker(markerId);
            hideLocationCard();
          },
        },
      ]
    );
  };

  const handleNavigateToMarker = async (marker) => {
    if (currentLocation) {
      const route = await calculateRoute(currentLocation, {
        latitude: marker.latitude,
        longitude: marker.longitude,
      });
      
      Alert.alert(
        'Rota Calculada',
        `Distância: ${route.distance}km\nTempo estimado: ${route.estimatedTime} min`,
        [
          { text: 'OK' },
          { text: 'Iniciar Navegação', onPress: () => startNavigation(route) },
        ]
      );
    }
  };

  const startNavigation = (route) => {
    // Implementar navegação
    console.log('Iniciando navegação:', route);
  };

  const toggleTracking = async () => {
    if (isTracking) {
      stopTracking(trackingSubscription);
      setTrackingSubscription(null);
    } else {
      const subscription = await startTracking();
      setTrackingSubscription(subscription);
    }
  };

  const fitAllMarkers = () => {
    if (markers.length > 0 && currentLocation) {
      const allCoords = [
        currentLocation,
        ...markers.map(m => ({ latitude: m.latitude, longitude: m.longitude }))
      ];
      mapRef.current?.fitToCoordinates(allCoords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Carregando localização...
        </Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Icon name="location-outline" size={64} color={theme.colors.error} />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {errorMsg}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => window.location.reload()}
        >
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Barra de Pesquisa */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Icon name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Buscar locais..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Icon name="close-circle" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        showsTraffic={showTraffic}
        showsUserLocation
        showsMyLocationButton={false}
        followsUserLocation={isTracking}
        initialRegion={currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : undefined}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            onPress={() => handleMarkerPress(marker)}
          >
            <View style={[styles.customMarker, { backgroundColor: theme.colors.primary }]}>
              <Icon name="location" size={20} color="white" />
            </View>
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{marker.nome}</Text>
                <Text style={styles.calloutDescription}>{marker.endereco}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Controles do Mapa */}
      <MapControls
        mapType={mapType}
        setMapType={setMapType}
        showTraffic={showTraffic}
        setShowTraffic={setShowTraffic}
        isTracking={isTracking}
        onToggleTracking={toggleTracking}
        onFitAllMarkers={fitAllMarkers}
        onMyLocation={animateToCurrentLocation}
      />

      {/* Botão Adicionar Marcador */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Modal Adicionar Marcador */}
      <AddMarkerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddMarker={handleAddMarker}
        currentLocation={currentLocation}
      />

      {/* Card de Localização */}
      {selectedMarker && (
        <Animated.View
          style={[
            styles.locationCardContainer,
            { top: slideAnim }
          ]}
        >
          <LocationCard
            marker={selectedMarker}
            onClose={hideLocationCard}
            onDelete={() => handleDeleteMarker(selectedMarker.id)}
            onNavigate={() => handleNavigateToMarker(selectedMarker)}
            currentLocation={currentLocation}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutContainer: {
    minWidth: 150,
    padding: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  locationCardContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
};