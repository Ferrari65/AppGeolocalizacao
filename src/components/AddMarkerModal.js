// src/components/AddMarkerModal.js - VERSÃO FINAL LIMPA
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

// Sua Google Maps API Key
const GOOGLE_MAPS_API_KEY = "AIzaSyBKeFCWFIvggGr3nkT-h98cnL2Sj8N98EA";

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
  });
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);

  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setFormData({
      nome: '',
      endereco: '',
      tipo: 'other',
      descricao: '',
    });
    setUseCurrentLocation(true);
  };

  const handleLocationOptionChange = (useCurrent) => {
    setUseCurrentLocation(useCurrent);
    
    if (useCurrent) {
      setFormData(prev => ({ ...prev, endereco: '' }));
    }
  };

  const geocodeWithGoogleAPI = async (address) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
          formatted_address: data.results[0].formatted_address,
        };
      } else {
        if (data.status === 'REQUEST_DENIED') {
          throw new Error('Chave de API inválida ou sem permissão para Geocoding API');
        }
        throw new Error(`Erro da API: ${data.status}`);
      }
    } catch (error) {
      throw error;
    }
  };

  const geocodeWithExpo = async (address) => {
    try {
      const results = await Location.geocodeAsync(address);
      
      if (results.length > 0) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
          formatted_address: address,
        };
      } else {
        throw new Error('Nenhum resultado encontrado pelo Expo');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      Alert.alert('Erro', 'Por favor, insira um nome para o marcador.');
      return;
    }

    setLoading(true);

    try {
      let finalCoords = null;
      let finalAddress = '';

      if (useCurrentLocation) {
        if (!currentLocation) {
          Alert.alert('Erro', 'Localização atual não disponível');
          setLoading(false);
          return;
        }
        
        finalCoords = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        };
        finalAddress = 'Localização Atual';

      } else {
        if (!formData.endereco.trim()) {
          Alert.alert('Erro', 'Por favor, digite um endereço para buscar.');
          setLoading(false);
          return;
        }

        let geocodeResult = null;

        try {
          geocodeResult = await geocodeWithGoogleAPI(formData.endereco.trim());
        } catch (googleError) {
          try {
            geocodeResult = await geocodeWithExpo(formData.endereco.trim());
          } catch (expoError) {
            Alert.alert(
              'Erro na busca de endereço',
              `Não foi possível encontrar o endereço.\n\nTente:\n• "São Paulo, SP"\n• "Av. Paulista, São Paulo"\n• "Cristo Redentor, Rio de Janeiro"`
            );
            setLoading(false);
            return;
          }
        }

        if (geocodeResult) {
          finalCoords = {
            latitude: geocodeResult.latitude,
            longitude: geocodeResult.longitude,
          };
          finalAddress = geocodeResult.formatted_address || formData.endereco.trim();
        }
      }

      const selectedType = markerTypes.find(type => type.id === formData.tipo);

      const markerData = {
        nome: formData.nome.trim(),
        endereco: finalAddress,
        descricao: formData.descricao.trim(),
        tipo: formData.tipo,
        icon: selectedType.icon,
        color: selectedType.color,
        latitude: finalCoords.latitude,
        longitude: finalCoords.longitude,
      };

      await onAddMarker(markerData);
      Alert.alert('Sucesso! 🎉', 'Marcador adicionado com sucesso!');
      
    } catch (error) {
      Alert.alert('Erro', `Erro inesperado: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAddress = async () => {
    if (!formData.endereco.trim()) {
      Alert.alert('Digite um endereço primeiro');
      return;
    }

    setLoading(true);
    
    try {
      try {
        const googleResult = await geocodeWithGoogleAPI(formData.endereco.trim());
        
        Alert.alert(
          'Endereço encontrado! ✅',
          `Lat: ${googleResult.latitude.toFixed(6)}\nLng: ${googleResult.longitude.toFixed(6)}\n\nEndereço formatado:\n${googleResult.formatted_address}`
        );
        setLoading(false);
        return;
        
      } catch (googleError) {
        try {
          const expoResult = await geocodeWithExpo(formData.endereco.trim());
          
          Alert.alert(
            'Endereço encontrado! ✅',
            `Lat: ${expoResult.latitude.toFixed(6)}\nLng: ${expoResult.longitude.toFixed(6)}`
          );
          
        } catch (expoError) {
          Alert.alert(
            'Endereço não encontrado ❌',
            'Tente um formato mais específico:\n• "São Paulo, SP"\n• "Av. Paulista, 1000, São Paulo"\n• "Cristo Redentor, Rio de Janeiro"'
          );
        }
      }
      
    } catch (error) {
      Alert.alert('Erro no teste', error.message);
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
                
                {/* Botões de Toggle */}
                <View style={styles.locationOptions}>
                  <TouchableOpacity
                    style={[
                      styles.locationOption,
                      {
                        backgroundColor: useCurrentLocation ? theme.colors.primary : theme.colors.background,
                        borderColor: useCurrentLocation ? theme.colors.primary : theme.colors.border,
                      }
                    ]}
                    onPress={() => handleLocationOptionChange(true)}
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
                      Localização Atual
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.locationOption,
                      {
                        backgroundColor: !useCurrentLocation ? theme.colors.primary : theme.colors.background,
                        borderColor: !useCurrentLocation ? theme.colors.primary : theme.colors.border,
                      }
                    ]}
                    onPress={() => handleLocationOptionChange(false)}
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

                {/* Campo de Endereço */}
                {!useCurrentLocation && (
                  <View style={styles.addressContainer}>
                    <Text style={[styles.addressLabel, { color: theme.colors.text }]}>
                      Digite o endereço:
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
                      placeholder="Ex: Av. Paulista, 1000, São Paulo, SP"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={formData.endereco}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, endereco: text }))}
                      multiline
                      numberOfLines={2}
                    />
                    
                    {/* Botão de Teste */}
                    <TouchableOpacity
                      style={[
                        styles.testButton, 
                        { 
                          borderColor: theme.colors.primary,
                          backgroundColor: theme.colors.background,
                        }
                      ]}
                      onPress={testAddress}
                      disabled={loading || !formData.endereco.trim()}
                    >
                      <Icon name="search" size={16} color={theme.colors.primary} />
                      <Text style={[styles.testButtonText, { color: theme.colors.primary }]}>
                        Testar Endereço
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Info sobre localização atual */}
                {useCurrentLocation && currentLocation && (
                  <View style={[styles.currentLocationInfo, { backgroundColor: theme.colors.background }]}>
                    <Icon name="checkmark-circle" size={16} color={theme.colors.success} />
                    <Text style={[styles.currentLocationText, { color: theme.colors.success }]}>
                      Localização atual: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                    </Text>
                  </View>
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
    marginBottom: 16,
    gap: 8,
  },
  locationOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  locationOptionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  addressContainer: {
    marginTop: 8,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 12,
  },
  testButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  currentLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  currentLocationText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
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