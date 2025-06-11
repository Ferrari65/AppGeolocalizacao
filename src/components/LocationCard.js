// src/components/LocationCard.js
import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';

const { width } = Dimensions.get('window');

export default function LocationCard({ marker, onClose, onDelete, onNavigate, currentLocation }) {
  const { theme } = useTheme();
  const { calculateDistance } = useLocation();

  const distance = currentLocation 
    ? calculateDistance(currentLocation, {
        latitude: marker.latitude,
        longitude: marker.longitude,
      }).toFixed(1)
    : null;

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Handle Bar */}
      <View style={[styles.handleBar, { backgroundColor: theme.colors.border }]} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: marker.color }]}>
            <Icon name={marker.icon} size={24} color="white" />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
              {marker.nome}
            </Text>
            {distance && (
              <Text style={[styles.distance, { color: theme.colors.textSecondary }]}>
                {distance} km de distância
              </Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Endereço */}
        <View style={styles.infoRow}>
          <Icon name="location-outline" size={20} color={theme.colors.textSecondary} />
          <Text style={[styles.infoText, { color: theme.colors.text }]} numberOfLines={2}>
            {marker.endereco}
          </Text>
        </View>

        {/* Descrição */}
        {marker.descricao && (
          <View style={styles.infoRow}>
            <Icon name="document-text-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.infoText, { color: theme.colors.text }]} numberOfLines={3}>
              {marker.descricao}
            </Text>
          </View>
        )}

        {/* Data de criação */}
        <View style={styles.infoRow}>
          <Icon name="time-outline" size={20} color={theme.colors.textSecondary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Adicionado em {formatTimestamp(marker.timestamp)}
          </Text>
        </View>

        {/* Coordenadas */}
        <View style={styles.coordinatesContainer}>
          <Text style={[styles.coordinatesLabel, { color: theme.colors.textSecondary }]}>
            Coordenadas:
          </Text>
          <Text style={[styles.coordinates, { color: theme.colors.textSecondary }]}>
            {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.navigateButton,
            { backgroundColor: theme.colors.primary }
          ]}
          onPress={onNavigate}
        >
          <Icon name="navigate" size={20} color="white" />
          <Text style={styles.actionButtonText}>Navegar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.shareButton,
            { backgroundColor: theme.colors.secondary }
          ]}
          onPress={() => shareLocation(marker)}
        >
          <Icon name="share" size={20} color="white" />
          <Text style={styles.actionButtonText}>Compartilhar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.deleteButton,
            { backgroundColor: theme.colors.error }
          ]}
          onPress={onDelete}
        >
          <Icon name="trash" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const shareLocation = (marker) => {
  // Implementar compartilhamento de localização
  const message = `📍 ${marker.nome}\n📍 ${marker.endereco}\n🗺️ https://maps.google.com/?q=${marker.latitude},${marker.longitude}`;
  console.log('Compartilhar:', message);
};

const styles = {
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34, // Safe area
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  distance: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
    marginLeft: 16,
  },
  content: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    lineHeight: 22,
  },
  coordinatesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 8,
  },
  coordinatesLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navigateButton: {
    flex: 2,
    paddingHorizontal: 16,
  },
  shareButton: {
    flex: 2,
    paddingHorizontal: 16,
  },
  deleteButton: {
    width: 48,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
};