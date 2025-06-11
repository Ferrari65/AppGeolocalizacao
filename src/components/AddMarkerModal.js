import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';

import { useTheme } from '../context/ThemeContext';

const markerTypes = [
  { id: 'home', name: 'Casa', icon: 'home', color: '#34C759' },
  { id: 'work', name: 'Trabalho', icon: 'briefcase', color: '#007AFF' },
  { id: 'restaurant', name: 'Restaurante', icon: 'restaurant', color: '#FF9500' },
  { id: 'hospital', name: 'Hospital', icon: 'medical', color: '#FF3B30' },
  { id: 'school', name: 'Escola', icon: 'school', color: '#5856D6' },
  { id: 'shop', name: 'Loja', icon: 'storefront', color: '#FF2D92' },
  { id: 'gas', name: 'Posto', icon: 'car', color: '#8E8E93' },
  { id: 'park', name: 'Parque', icon: 'leaf', color: '#32D74B' },
  { id: 'other', name: 'Outro', icon: 'location', color: '#007AFF' },
];

export default function AddMarkerModal({ visible, onClose, onAddMarker, currentLocation }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    tipo: 'other',
    descricao: '',
    latitude: null,
    longitude: null,
  });
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);

  useEffect(() => {
    if (visible) {
      resetForm();
      if (currentLocation && useCurrentLocation) {
        setFormData(prev => ({
          ...prev,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        }));
      }
    }
  }, [visible, currentLocation, useCurrentLocation]);

  const resetForm = () => {
    setFormData({
      nome: '',
      endereco: '',
      tipo: 'other',
      descricao: '',
      latitude: null,
      longitude: null,
    });
    setUseCurrentLocation(true);
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      Alert.alert('Erro', 'Por favor, insira um nome para o marcador.');
      return;
    }

    setLoading(true);

    try {
      let finalCoords = { latitude: formData.latitude, longitude: formData.longitude };

      // Se não estiver usando localização atual e tiver um endereço, geocodificar
      if (!useCurrentLocation && formData.endereco.trim()) {
        const geoResults = await Location.geocodeAsync(formData.endereco);
        if (geoResults.length === 0) {
          Alert.alert('Erro', 'Endereço não encontrado');
          setLoading(false);
          return;
        }
        finalCoords = {
          latitude: geoResults[0].latitude,
          longitude: geoResults[0].longitude,
        };
      }

      // Se usar localização atual mas não tiver coordenadas
      if (useCurrentLocation && !currentLocation) {
        Alert.alert('Erro', 'Localização atual não disponível');
        setLoading(false);
        return;
      }

      if (useCurrentLocation) {
        finalCoords = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        };
      }

      const selectedType = markerTypes.find(type => type.id === formData.tipo);

      const markerData = {
        nome: formData.nome.trim(),
        endereco: useCurrentLocation ? 'Localização Atual' : formData.endereco.trim(),
        descricao: formData.descricao.trim(),
        tipo: formData.tipo,
        icon: selectedType.icon,
        color: selectedType.color,
        latitude: finalCoords.latitude,
        longitude: finalCoords.longitude,
      };

      await onAddMarker(markerData);
      Alert.alert('Sucesso', 'Marcador adicionado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao adicionar marcador:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao adicionar o marcador');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = markerTypes.find(type => type.id === formData.tipo);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoiding}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                Adicionar Marcador
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Nome do Marcador */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Nome do Local *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    }
                  ]}
                  placeholder="Ex: Minha Casa, Escritório..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={formData.nome}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, nome: text }))}
                />
              </View>

              {/* Tipo do Marcador */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Tipo de Local
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeContainer}>
                  {markerTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeButton,
                        {
                          backgroundColor: formData.tipo === type.id ? type.color : theme.colors.background,
                          borderColor: type.color,
                        }
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, tipo: type.id }))}
                    >
                      <Icon
                        name={type.icon}
                        size={20}
                        color={formData.tipo === type.id ? 'white' : type.color}
                      />
                      <Text
                        style={[
                          styles.typeText,
                          {
                            color: formData.tipo === type.id ? 'white' : type.color,
                          }
                        ]}
                      >
                        {type.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Localização */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Localização
                </Text>
                
                <View style={styles.locationOptions}>
                  <TouchableOpacity
                    style={[
                      styles.locationOption,
                      {
                        backgroundColor: useCurrentLocation ? theme.colors.primary : theme.colors.background,
                        borderColor: theme.colors.border,
                      }
                    ]}
                    onPress={() => setUseCurrentLocation(true)}
                  >
                    <Icon
                      name="locate"
                      size={20}
                      color={useCurrentLocation ? 'white' : theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.locationOptionText,
                        { color: useCurrentLocation ? 'white' : theme.colors.primary }
                      ]}
                    >
                      Usar Localização Atual
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.locationOption,
                      {
                        backgroundColor: !useCurrentLocation ? theme.colors.primary : theme.colors.background,
                        borderColor: theme.colors.border,
                      }
                    ]}
                    onPress={() => setUseCurrentLocation(false)}
                  >
                    <Icon
                      name="search"
                      size={20}
                      color={!useCurrentLocation ? 'white' : theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.locationOptionText,
                        { color: !useCurrentLocation ? 'white' : theme.colors.primary }
                      ]}
                    >
                      Buscar Endereço
                    </Text>
                  </TouchableOpacity>
                </View>

                {!useCurrentLocation && (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.text,
                      }
                    ]}
                    placeholder="Digite o endereço completo..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={formData.endereco}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, endereco: text }))}
                    multiline
                  />
                )}
              </View>

              {/* Descrição */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Descrição (Opcional)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    }
                  ]}
                  placeholder="Adicione uma descrição ou observação..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={formData.descricao}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, descricao: text }))}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* Botões */}
            <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={onClose}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: theme.colors.primary,
                    opacity: loading ? 0.7 : 1,
                  }
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Icon name="checkmark" size={20} color="white" />
                    <Text style={styles.submitButtonText}>Adicionar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = {
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardAvoiding: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    maxHeight: 400,
  },
  inputGroup: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 12,
  },
  typeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  locationOptions: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  locationOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  locationOptionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
};