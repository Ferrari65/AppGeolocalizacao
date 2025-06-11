// src/components/MapControls.js
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

export default function MapControls({
  mapType,
  setMapType,
  showTraffic,
  setShowTraffic,
  isTracking,
  onToggleTracking,
  onFitAllMarkers,
  onMyLocation,
}) {
  const { theme } = useTheme();

  const mapTypes = [
    { id: 'standard', name: 'Padrão', icon: 'map-outline' },
    { id: 'satellite', name: 'Satélite', icon: 'planet-outline' },
    { id: 'hybrid', name: 'Híbrido', icon: 'layers-outline' },
  ];

  return (
    <View style={styles.container}>
      {/* Controles Principais */}
      <View style={[styles.controlGroup, { backgroundColor: theme.colors.surface }]}>
        {/* Botão Minha Localização */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: theme.colors.background }
          ]}
          onPress={onMyLocation}
        >
          <Icon name="locate" size={20} color={theme.colors.primary} />
        </TouchableOpacity>

        {/* Botão Rastreamento */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: isTracking ? theme.colors.primary : theme.colors.background,
            }
          ]}
          onPress={onToggleTracking}
        >
          <Icon
            name="navigate"
            size={20}
            color={isTracking ? 'white' : theme.colors.primary}
          />
        </TouchableOpacity>

        {/* Botão Ajustar Todos os Marcadores */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: theme.colors.background }
          ]}
          onPress={onFitAllMarkers}
        >
          <Icon name="scan" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Controles de Tipo de Mapa */}
      <View style={[styles.mapTypeGroup, { backgroundColor: theme.colors.surface }]}>
        {mapTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.mapTypeButton,
              {
                backgroundColor: mapType === type.id ? theme.colors.primary : 'transparent',
              }
            ]}
            onPress={() => setMapType(type.id)}
          >
            <Icon
              name={type.icon}
              size={16}
              color={mapType === type.id ? 'white' : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.mapTypeText,
                {
                  color: mapType === type.id ? 'white' : theme.colors.textSecondary,
                }
              ]}
            >
              {type.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Controle de Trânsito */}
      <TouchableOpacity
        style={[
          styles.trafficButton,
          {
            backgroundColor: showTraffic ? theme.colors.warning : theme.colors.surface,
          }
        ]}
        onPress={() => setShowTraffic(!showTraffic)}
      >
        <Icon
          name="car"
          size={16}
          color={showTraffic ? 'white' : theme.colors.textSecondary}
        />
        <Text
          style={[
            styles.trafficText,
            {
              color: showTraffic ? 'white' : theme.colors.textSecondary,
            }
          ]}
        >
          Trânsito
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  container: {
    position: 'absolute',
    top: 120,
    right: 16,
    alignItems: 'flex-end',
  },
  controlGroup: {
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  mapTypeGroup: {
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  mapTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  mapTypeText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  trafficButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  trafficText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
  },
};