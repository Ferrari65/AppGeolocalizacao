// src/screens/ProfileScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';

export default function ProfileScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { 
    markers, 
    routes, 
    locationHistory, 
    clearAllData, 
    isTracking 
  } = useLocation();
  
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [highAccuracy, setHighAccuracy] = useState(true);

  const menuItems = [
    {
      id: 'locations',
      title: 'Meus Locais',
      subtitle: `${markers.length} marcadores salvos`,
      icon: 'location',
      color: theme.colors.primary,
      onPress: () => showLocationStats(),
    },
    {
      id: 'history',
      title: 'Histórico de Localizações',
      subtitle: `${locationHistory.length} pontos registrados`,
      icon: 'time',
      color: theme.colors.secondary,
      onPress: () => showLocationHistory(),
    },
    {
      id: 'export',
      title: 'Exportar Dados',
      subtitle: 'Backup dos seus dados',
      icon: 'download',
      color: theme.colors.warning,
      onPress: () => exportData(),
    },
    {
      id: 'share',
      title: 'Compartilhar App',
      subtitle: 'Convide amigos',
      icon: 'share',
      color: theme.colors.success,
      onPress: () => shareApp(),
    },
  ];

  const settingsItems = [
    {
      id: 'theme',
      title: 'Modo Escuro',
      subtitle: 'Alterne entre temas claro e escuro',
      icon: 'moon',
      type: 'switch',
      value: isDark,
      onToggle: toggleTheme,
    },
    {
      id: 'notifications',
      title: 'Notificações',
      subtitle: 'Receber alertas de localização',
      icon: 'notifications',
      type: 'switch',
      value: notifications,
      onToggle: setNotifications,
    },
    {
      id: 'autosave',
      title: 'Salvamento Automático',
      subtitle: 'Salvar rotas automaticamente',
      icon: 'save',
      type: 'switch',
      value: autoSave,
      onToggle: setAutoSave,
    },
    {
      id: 'accuracy',
      title: 'Alta Precisão GPS',
      subtitle: 'Melhor precisão, maior uso de bateria',
      icon: 'navigate',
      type: 'switch',
      value: highAccuracy,
      onToggle: setHighAccuracy,
    },
  ];

  const showLocationStats = () => {
    const stats = calculateLocationStats();
    Alert.alert(
      'Estatísticas dos Locais',
      `📍 Total de marcadores: ${stats.totalMarkers}\n📊 Tipos mais usados: ${stats.topTypes.join(', ')}\n📏 Distância total: ${stats.totalDistance} km\n⏰ Primeiro marcador: ${stats.firstMarker}`,
      [{ text: 'OK' }]
    );
  };

  const calculateLocationStats = () => {
    const typeCount = {};
    let totalDistance = 0;
    let firstMarkerDate = null;

    markers.forEach(marker => {
      // Contar tipos
      typeCount[marker.tipo] = (typeCount[marker.tipo] || 0) + 1;
      
      // Data do primeiro marcador
      if (!firstMarkerDate || marker.timestamp < firstMarkerDate) {
        firstMarkerDate = marker.timestamp;
      }
    });

    // Calcular distância total das rotas
    routes.forEach(route => {
      totalDistance += parseFloat(route.distance);
    });

    // Top 3 tipos mais usados
    const topTypes = Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);

    return {
      totalMarkers: markers.length,
      topTypes,
      totalDistance: totalDistance.toFixed(1),
      firstMarker: firstMarkerDate ? new Date(firstMarkerDate).toLocaleDateString('pt-BR') : 'N/A',
    };
  };

  const showLocationHistory = () => {
    if (locationHistory.length === 0) {
      Alert.alert('Histórico Vazio', 'Nenhum histórico de localização encontrado.');
      return;
    }

    const latest = locationHistory[locationHistory.length - 1];
    const oldest = locationHistory[0];
    const timeSpan = ((latest.timestamp - oldest.timestamp) / (1000 * 60 * 60)).toFixed(1);

    Alert.alert(
      'Histórico de Localização',
      `📊 Total de pontos: ${locationHistory.length}\n⏰ Período: ${timeSpan} horas\n📍 Última posição: ${new Date(latest.timestamp).toLocaleString('pt-BR')}\n🗓️ Primeira posição: ${new Date(oldest.timestamp).toLocaleString('pt-BR')}`,
      [
        { text: 'Limpar Histórico', style: 'destructive', onPress: clearLocationHistory },
        { text: 'OK' }
      ]
    );
  };

  const clearLocationHistory = () => {
    Alert.alert(
      'Confirmar Limpeza',
      'Tem certeza que deseja limpar todo o histórico de localização?',
      [
        { text: 'Cancelar' },
        { text: 'Limpar', style: 'destructive', onPress: () => {
          // Implementar limpeza do histórico
          console.log('Limpando histórico...');
        }}
      ]
    );
  };

  const exportData = async () => {
    try {
      const data = {
        markers,
        routes,
        locationHistory,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };

      // Simular exportação
      const jsonData = JSON.stringify(data, null, 2);
      
      Alert.alert(
        'Dados Exportados',
        `Arquivo gerado com sucesso!\nTamanho: ${(jsonData.length / 1024).toFixed(1)} KB\nItens: ${markers.length + routes.length} registros`,
        [
          { text: 'OK' },
          { text: 'Compartilhar', onPress: () => Share.share({ message: jsonData }) }
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Falha ao exportar dados');
    }
  };

  const shareApp = async () => {
    try {
      await Share.share({
        message: '🗺️ Confira este incrível app de geolocalização! Organize seus locais favoritos e calcule rotas facilmente.',
        title: 'App de Geolocalização',
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const clearAllAppData = () => {
    Alert.alert(
      'Limpar Todos os Dados',
      'Esta ação removerá TODOS os seus marcadores, rotas e configurações. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar' },
        {
          text: 'Limpar Tudo',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Dados Limpos', 'Todos os dados foram removidos com sucesso.');
          }
        }
      ]
    );
  };

  const renderMenuItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
      onPress={item.onPress}
    >
      <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
        <Icon name={item.icon} size={20} color="white" />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: theme.colors.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.menuSubtitle, { color: theme.colors.textSecondary }]}>
          {item.subtitle}
        </Text>
      </View>
      <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderSettingItem = (item) => (
    <View
      key={item.id}
      style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
          <Icon name={item.icon} size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
            {item.subtitle}
          </Text>
        </View>
      </View>
      <Switch
        value={item.value}
        onValueChange={item.onToggle}
        trackColor={{
          false: theme.colors.border,
          true: theme.colors.primary,
        }}
        thumbColor={item.value ? 'white' : theme.colors.textSecondary}
      />
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Perfil
        </Text>
      </View>

      {/* Status Card */}
      <View style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusIcon, { backgroundColor: isTracking ? theme.colors.success : theme.colors.textSecondary }]}>
            <Icon name={isTracking ? "navigate" : "pause"} size={24} color="white" />
          </View>
          <View style={styles.statusContent}>
            <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
              {isTracking ? 'Rastreamento Ativo' : 'Rastreamento Pausado'}
            </Text>
            <Text style={[styles.statusSubtitle, { color: theme.colors.textSecondary }]}>
              {isTracking ? 'Sua localização está sendo monitorada' : 'Toque para iniciar o rastreamento'}
            </Text>
          </View>
        </View>
        
        <View style={styles.statusStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
              {markers.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Locais
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.secondary }]}>
              {routes.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Rotas
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
              {locationHistory.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Histórico
            </Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Meus Dados
        </Text>
        {menuItems.map(renderMenuItem)}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Configurações
        </Text>
        {settingsItems.map(renderSettingItem)}
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>
          Zona de Perigo
        </Text>
        <TouchableOpacity
          style={[styles.dangerButton, { borderColor: theme.colors.error }]}
          onPress={clearAllAppData}
        >
          <Icon name="trash" size={20} color={theme.colors.error} />
          <Text style={[styles.dangerButtonText, { color: theme.colors.error }]}>
            Limpar Todos os Dados
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Versão 1.0.0
        </Text>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Feito com ❤️
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  header: {
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
  statusCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingBottom: 100,
  },
  footerText: {
    fontSize: 14,
    marginBottom: 4,
  },
};