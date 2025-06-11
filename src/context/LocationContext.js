import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [locationHistory, setLocationHistory] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestLocationPermission();
    loadStoredData();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permissão de localização negada');
        setLoading(false);
        return;
      }
      getCurrentLocation();
    } catch (error) {
      setErrorMsg('Erro ao solicitar permissão de localização');
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now(),
      };
      
      setCurrentLocation(newLocation);
      setLoading(false);
    } catch (error) {
      setErrorMsg('Erro ao obter localização atual');
      setLoading(false);
    }
  };

  const addMarker = async (markerData) => {
    try {
      const newMarker = {
        id: Date.now().toString(),
        ...markerData,
        timestamp: Date.now(),
      };
      
      const updatedMarkers = [...markers, newMarker];
      setMarkers(updatedMarkers);
      await AsyncStorage.setItem('markers', JSON.stringify(updatedMarkers));
      
      return newMarker;
    } catch (error) {
      console.error('Erro ao adicionar marcador:', error);
    }
  };

  const removeMarker = async (markerId) => {
    try {
      const updatedMarkers = markers.filter(marker => marker.id !== markerId);
      setMarkers(updatedMarkers);
      await AsyncStorage.setItem('markers', JSON.stringify(updatedMarkers));
    } catch (error) {
      console.error('Erro ao remover marcador:', error);
    }
  };

  const calculateRoute = async (origin, destination) => {
    try {
      // Simulação de cálculo de rota (substitua por API real como Google Directions)
      const distance = calculateDistance(origin, destination);
      const estimatedTime = Math.round(distance * 2); // 2 minutos por km (aproximação)
      
      const route = {
        id: Date.now().toString(),
        origin,
        destination,
        distance: distance.toFixed(2),
        estimatedTime,
        timestamp: Date.now(),
      };
      
      const updatedRoutes = [...routes, route];
      setRoutes(updatedRoutes);
      await AsyncStorage.setItem('routes', JSON.stringify(updatedRoutes));
      
      return route;
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
    }
  };

  const calculateDistance = (point1, point2) => {
    const R = 6371; // Raio da Terra em km
    const dLat = toRad(point2.latitude - point1.latitude);
    const dLon = toRad(point2.longitude - point1.longitude);
    const lat1 = toRad(point1.latitude);
    const lat2 = toRad(point2.latitude);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;

    return d;
  };

  const toRad = (value) => {
    return value * Math.PI / 180;
  };

  const startTracking = async () => {
    try {
      setIsTracking(true);
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: Date.now(),
          };
          
          setCurrentLocation(newLocation);
          setLocationHistory(prev => [...prev, newLocation]);
        }
      );
      
      return subscription;
    } catch (error) {
      console.error('Erro ao iniciar rastreamento:', error);
      setIsTracking(false);
    }
  };

  const stopTracking = (subscription) => {
    if (subscription) {
      subscription.remove();
    }
    setIsTracking(false);
  };

  const loadStoredData = async () => {
    try {
      const storedMarkers = await AsyncStorage.getItem('markers');
      const storedRoutes = await AsyncStorage.getItem('routes');
      
      if (storedMarkers) {
        setMarkers(JSON.parse(storedMarkers));
      }
      
      if (storedRoutes) {
        setRoutes(JSON.parse(storedRoutes));
      }
    } catch (error) {
      console.error('Erro ao carregar dados armazenados:', error);
    }
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.multiRemove(['markers', 'routes']);
      setMarkers([]);
      setRoutes([]);
      setLocationHistory([]);
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
    }
  };

  const value = {
    currentLocation,
    isTracking,
    markers,
    routes,
    locationHistory,
    errorMsg,
    loading,
    addMarker,
    removeMarker,
    calculateRoute,
    calculateDistance,
    startTracking,
    stopTracking,
    clearAllData,
    getCurrentLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};