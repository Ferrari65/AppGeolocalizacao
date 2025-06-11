// src/screens/RoutesScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';

export default function RoutesScreen() {
  const { theme } = useTheme();
  const { routes, markers, currentLocation, calculateRoute } = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simular refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const calculateQuickRoutes = async () => {
    if (!currentLocation || markers.length === 0) {
      Alert.alert('Aviso', 'Localização atual ou marcadores não disponíveis');
      return;
    }

    setCalculating(true);
    try {
      // Calcular rotas para os 3 marcadores mais próximos
      const nearbyMarkers = markers
        .map(marker => ({
          ...marker,
          distance: Math.sqrt(
            Math.pow(marker.latitude - currentLocation.latitude, 2) +
            Math.pow(marker.longitude - currentLocation.longitude, 2)
          )
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);

      for (const marker of nearbyMarkers) {
        await calculateRoute(currentLocation, {
          latitude: marker.latitude,
          longitude: marker.longitude,
        });
      }

      Alert.alert('Sucesso', `${nearbyMarkers.length} rotas calculadas!`);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao calcular rotas');
    } finally {
      setCalculating(false);
    }
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const renderRouteItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.routeCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => openRouteDetails(item)}
    >
      <View style={styles.routeHeader}>
        <View style={[styles.routeIcon, { backgroundColor: theme.colors.primary }]}>
          <Icon name="navigate" size={20} color="white" />
        </View>
        <View style={styles.routeInfo}>
          <Text style={[styles.routeTitle, { color: theme.colors.text }]} numberOfLines={1}>
            Rota #{item.id.slice(-4)}
          </Text>
          <Text style={[styles.routeSubtitle, { color: theme.colors.textSecondary }]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
        <View style={styles.routeStats}>
          <Text style={[styles.distance, { color: theme.colors.primary }]}>
            {item.distance} km
          </Text>
          <Text style={[styles.time, { color: theme.colors.textSecondary }]}>
            {formatTime(item.estimatedTime)}
          </Text>
        </View>
      </View>

      <View style={styles.routeDetails}>
        <View style={styles.pointContainer}>
          <Icon name="radio-button-on" size={12} color={theme.colors.success} />
          <Text style={[styles.pointText, { color: theme.colors.text }]} numberOfLines={1}>
            Origem: Localização Atual
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.pointContainer}>
          <Icon name="location" size={12} color={theme.colors.error} />
          <Text style={[styles.pointText, { color: theme.colors.text }]} numberOfLines={1}>
            Destino: {item.destination?.name || 'Destino'}
          </Text>
        </View>
      </View>

      <View style={styles.routeActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => startNavigation(item)}
        >
          <Icon name="play" size={16} color="white" />
          <Text style={styles.actionButtonText}>Iniciar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
          onPress={() => shareRoute(item)}
        >
          <Icon name="share" size={16} color="white" />
          <Text style={styles.actionButtonText}>Compartilhar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const openRouteDetails = (route) => {
    Alert.alert(
      'Detalhes da Rota',
      `Distância: ${route.distance} km\nTempo estimado: ${formatTime(route.estimatedTime)}\nCriada em: ${formatTimestamp(route.timestamp)}`,
      [
        { text: 'Fechar' },
        { text: 'Iniciar Navegação', onPress: () => startNavigation(route) }
      ]
    );
  };

  const startNavigation = (route) => {
    Alert.alert(
      'Iniciar Navegação',
      'Abrir no Google Maps?',
      [
        { text: 'Cancelar' },
        { text: 'Abrir', onPress: () => console.log('Abrindo navegação:', route) }
      ]
    );
  };

  const shareRoute = (route) => {
    console.log('Compartilhando rota:', route);
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="map-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Nenhuma rota encontrada
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Calcule rotas para seus marcadores favoritos
      </Text>
      <TouchableOpacity
        style={[styles.quickRoutesButton, { backgroundColor: theme.colors.primary }]}
        onPress={calculateQuickRoutes}
        disabled={calculating}
      >
        {calculating ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Icon name="flash" size={20} color="white" />
            <Text style={styles.quickRoutesButtonText}>Calcular Rotas Rápidas</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Minhas Rotas
        </Text>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: theme.colors.primary }]}
          onPress={calculateQuickRoutes}
          disabled={calculating}
        >
          {calculating ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Icon name="add" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Icon name="map" size={24} color={theme.colors.primary} />
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>
            {routes.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Rotas Salvas
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Icon name="location" size={24} color={theme.colors.secondary} />
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>
            {markers.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Marcadores
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Icon name="time" size={24} color={theme.colors.warning} />
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>
            {routes.reduce((total, route) => total + parseFloat(route.distance), 0).toFixed(1)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            km Total
          </Text>
        </View>
      </View>

      {/* Routes List */}
      <FlatList
        data={routes}
        renderItem={renderRouteItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={EmptyState}
        contentContainerStyle={routes.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
  },
  routeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  routeSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  routeStats: {
    alignItems: 'flex-end',
  },
  distance: {
    fontSize: 18,
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
  },
  routeDetails: {
    marginBottom: 16,
  },
  pointContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  pointText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  routeLine: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginLeft: 6,
    marginVertical: 2,
  },
  routeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  quickRoutesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  quickRoutesButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
};