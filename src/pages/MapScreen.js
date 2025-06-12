// src/screens/MapScreen.js - COM GOOGLE MAPS REAL
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
  FlatList,
  Linking,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';

import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import AddMarkerModal from '../components/AddMarkerModal';
import MapControls from '../components/MapControls';
import LocationCard from '../components/LocationCard';

const { width, height } = Dimensions.get('window');

// API Key para busca de lugares
const GOOGLE_MAPS_API_KEY = "AIzaSyBKeFCWFIvggGr3nkT-h98cnL2Sj8N98EA";

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
  const searchTimeout = useRef(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapType, setMapType] = useState('standard');
  const [showTraffic, setShowTraffic] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [trackingSubscription, setTrackingSubscription] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (currentLocation && mapRef.current) {
      animateToCurrentLocation();
    }
  }, [currentLocation]);

  // Busca automática conforme o usuário digita
  useEffect(() => {
    if (searchQuery.length > 2) {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      searchTimeout.current = setTimeout(() => {
        searchPlaces(searchQuery);
      }, 500);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  const searchPlaces = async (query) => {
    if (!currentLocation) return;

    setSearchLoading(true);
    setShowSearchResults(true);

    try {
      const location = `${currentLocation.latitude},${currentLocation.longitude}`;
      const radius = 10000; // 10km de raio
      
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${location}&radius=${radius}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        const results = data.results.slice(0, 5).map(place => ({
          id: place.place_id,
          name: place.name,
          address: place.formatted_address,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          rating: place.rating,
          types: place.types,
          icon: getPlaceIcon(place.types),
        }));

        setSearchResults(results);
      } else {
        try {
          const geoResults = await Location.geocodeAsync(query);
          const results = geoResults.slice(0, 3).map((result, index) => ({
            id: `geo_${index}`,
            name: query,
            address: `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`,
            latitude: result.latitude,
            longitude: result.longitude,
            rating: null,
            types: ['geocode'],
            icon: 'location',
          }));
          
          setSearchResults(results);
        } catch (error) {
          setSearchResults([]);
        }
      }
    } catch (error) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const getPlaceIcon = (types) => {
    if (types.includes('restaurant') || types.includes('food')) return 'restaurant';
    if (types.includes('hospital') || types.includes('doctor')) return 'medical';
    if (types.includes('school') || types.includes('university')) return 'school';
    if (types.includes('store') || types.includes('shopping_mall')) return 'storefront';
    if (types.includes('gas_station')) return 'car';
    if (types.includes('park')) return 'leaf';
    if (types.includes('bank')) return 'card';
    if (types.includes('pharmacy')) return 'medical';
    return 'location';
  };

  const getPlaceColor = (types) => {
    if (types.includes('restaurant') || types.includes('food')) return '#FF9500';
    if (types.includes('hospital') || types.includes('doctor')) return '#FF3B30';
    if (types.includes('school') || types.includes('university')) return '#5856D6';
    if (types.includes('store') || types.includes('shopping_mall')) return '#FF2D92';
    if (types.includes('gas_station')) return '#8E8E93';
    if (types.includes('park')) return '#32D74B';
    if (types.includes('bank')) return '#007AFF';
    return '#007AFF';
  };

  const handleSelectPlace = (place) => {
    setSearchQuery(place.name);
    setShowSearchResults(false);
    
    // Navegar para o local no mapa
    mapRef.current?.animateToRegion({
      latitude: place.latitude,
      longitude: place.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);

    // Mostrar opções para o usuário
    setTimeout(() => {
      Alert.alert(
        place.name,
        `${place.address}\n\n${place.rating ? `⭐ ${place.rating}/5` : ''}`,
        [
          { text: 'Fechar' },
          { 
            text: 'Criar Marcador Aqui', 
            onPress: () => createMarkerAtPlace(place) 
          },
          { 
            text: 'Abrir no Google Maps', 
            onPress: () => openInGoogleMaps(place) 
          },
        ]
      );
    }, 1200);
  };

  const createMarkerAtPlace = (place) => {
    const markerData = {
      nome: place.name,
      endereco: place.address,
      descricao: place.rating ? `Avaliação: ${place.rating}/5 estrelas` : '',
      tipo: getMarkerTypeFromPlace(place.types),
      icon: place.icon,
      color: getPlaceColor(place.types),
      latitude: place.latitude,
      longitude: place.longitude,
    };

    Alert.alert(
      'Criar Marcador',
      `Deseja criar um marcador em:\n${place.name}?`,
      [
        { text: 'Cancelar' },
        { 
          text: 'Criar', 
          onPress: async () => {
            await addMarker(markerData);
            Alert.alert('Sucesso!', 'Marcador criado com sucesso!');
            setSearchQuery('');
          }
        },
      ]
    );
  };

  const getMarkerTypeFromPlace = (types) => {
    if (types.includes('restaurant') || types.includes('food')) return 'restaurant';
    if (types.includes('hospital') || types.includes('doctor')) return 'hospital';
    if (types.includes('school') || types.includes('university')) return 'school';
    if (types.includes('store') || types.includes('shopping_mall')) return 'shop';
    if (types.includes('gas_station')) return 'gas';
    if (types.includes('park')) return 'park';
    return 'other';
  };

  // FUNÇÃO CORRIGIDA - Abre Google Maps de verdade
  const openInGoogleMaps = async (place) => {
    try {
      // URL para abrir no Google Maps
      const url = Platform.select({
        ios: `maps://app?daddr=${place.latitude},${place.longitude}`,
        android: `google.navigation:q=${place.latitude},${place.longitude}`,
      });

      // URL universal como fallback
      const universalUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&destination_place_id=${place.id}`;

      // Tentar abrir o app nativo primeiro
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Se não conseguir, abrir no navegador
        await Linking.openURL(universalUrl);
      }
    } catch (error) {
      Alert.alert(
        'Erro',
        'Não foi possível abrir o Google Maps. Verifique se está instalado no dispositivo.'
      );
    }
  };

  // FUNÇÃO CORRIGIDA - Navegação para marcador
  const navigateToMarker = async (marker) => {
    try {
      const url = Platform.select({
        ios: `maps://app?daddr=${marker.latitude},${marker.longitude}`,
        android: `google.navigation:q=${marker.latitude},${marker.longitude}`,
      });

      const universalUrl = `https://www.google.com/maps/dir/?api=1&destination=${marker.latitude},${marker.longitude}`;

      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(universalUrl);
      }
    } catch (error) {
      Alert.alert(
        'Erro',
        'Não foi possível abrir o Google Maps.'
      );
    }
  };

  // FUNÇÃO CORRIGIDA - Navegação com rota calculada
  const navigateToPlace = async (place) => {
    if (currentLocation) {
      const route = await calculateRoute(currentLocation, {
        latitude: place.latitude,
        longitude: place.longitude,
      });
      
      Alert.alert(
        'Rota Calculada',
        `Destino: ${place.name}\nDistância: ${route.distance}km\nTempo estimado: ${route.estimatedTime} min`,
        [
          { text: 'OK' },
          { text: 'Abrir Navegação', onPress: () => openInGoogleMaps(place) },
        ]
      );
    }
  };

  // FUNÇÃO CORRIGIDA - Compartilhar localização
  const shareLocation = async (marker) => {
    try {
      const message = `📍 ${marker.nome}\n📍 ${marker.endereco}\n🗺️ https://maps.google.com/?q=${marker.latitude},${marker.longitude}`;
      
      // Para compartilhar, você pode usar:
      // import { Share } from 'react-native';
      // await Share.share({ message });
      
      // Por enquanto, vamos copiar para clipboard (se disponível)
      Alert.alert(
        'Compartilhar Localização',
        message,
        [
          { text: 'Fechar' },
          { text: 'Abrir no Maps', onPress: () => navigateToMarker(marker) }
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar a localização');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

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
          { text: 'Abrir Navegação', onPress: () => navigateToMarker(marker) },
        ]
      );
    }
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
          onPress={() => console.log('Retry')}
        >
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Barra de Pesquisa Inteligente */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Icon name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Buscar restaurantes, hospitais, lojas..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Icon name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
        {searchLoading && (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: 8 }} />
        )}
      </View>

      {/* Resultados da Busca */}
      {showSearchResults && searchResults.length > 0 && (
        <View style={[styles.searchResultsContainer, { backgroundColor: theme.colors.surface }]}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.searchResultItem, { borderBottomColor: theme.colors.border }]}
                onPress={() => handleSelectPlace(item)}
              >
                <View style={[styles.resultIcon, { backgroundColor: getPlaceColor(item.types) }]}>
                  <Icon name={item.icon} size={16} color="white" />
                </View>
                <View style={styles.resultContent}>
                  <Text style={[styles.resultName, { color: theme.colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.resultAddress, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {item.address}
                  </Text>
                  {item.rating && (
                    <Text style={[styles.resultRating, { color: theme.colors.warning }]}>
                      ⭐ {item.rating}/5
                    </Text>
                  )}
                </View>
                <Icon name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
            style={styles.searchResultsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

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
            <View style={[styles.customMarker, { backgroundColor: marker.color || theme.colors.primary }]}>
              <Icon name={marker.icon || 'location'} size={20} color="white" />
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
            onShare={() => shareLocation(selectedMarker)}
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
  searchResultsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 116 : 96,
    left: 16,
    right: 16,
    maxHeight: 240,
    borderRadius: 12,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  searchResultsList: {
    borderRadius: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 14,
    marginBottom: 2,
  },
  resultRating: {
    fontSize: 12,
    fontWeight: '500',
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