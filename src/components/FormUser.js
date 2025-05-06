import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";

import styles from "../styles/FormUserStyles";

export default function FormUser({ onAddUser }) {
  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const handleSubmit = () => {
    const endereco = `${street}, ${number}, ${city} - ${state}`;
    onAddUser(name, endereco);
    Alert.alert("Formulário Enviado", `Nome: ${name}\nEndereço: ${endereco}`);
    // limpa campos
    setName("");
    setStreet("");
    setNumber("");
    setCity("");
    setState("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Cadastro</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome Completo"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Rua"
        value={street}
        onChangeText={setStreet}
      />
      <TextInput
        style={styles.input}
        placeholder="Número"
        keyboardType="numeric"
        value={number}
        onChangeText={setNumber}
      />
      <TextInput
        style={styles.input}
        placeholder="Cidade"
        value={city}
        onChangeText={setCity}
      />
      <TextInput
        style={styles.input}
        placeholder="Estado"
        value={state}
        onChangeText={setState}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Enviar</Text>
      </TouchableOpacity>
    </View>
  );
}
