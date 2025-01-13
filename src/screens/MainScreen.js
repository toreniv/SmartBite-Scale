// src/screens/MainScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Colors, Shadows } from '../constants/useThemeColor';
import BluetoothManager from '../utils/BluetoothManager';

const MainScreen = ({ navigation }) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectTray = async () => {
    setIsConnecting(true);
    try {
      // Will implement Bluetooth connection logic later
      setTimeout(() => {
        navigation.navigate('Second');
      }, 1000);
    } catch (error) {
      Alert.alert('Connection Error', 'Failed to connect to the tray.');
      console.error('Failed to connect:', error);
    }
    setIsConnecting(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SmartBite-Scale</Text>
        <Text style={styles.subtitle}>Smart Food Analysis</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/tray-image.png')}
          style={styles.trayImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.connectButton]}
          onPress={handleConnectTray}
          disabled={isConnecting}
        >
          <Text style={styles.buttonText}>
            {isConnecting ? 'Connecting...' : 'Connect to Tray'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.skipButton]}
          onPress={() => navigation.navigate('Second')}
        >
          <Text style={styles.buttonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.secondary,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  trayImage: {
    width: '90%',
    height: '60%',
  },
  buttonContainer: {
    padding: 20,
    marginBottom: 30,
  },
  button: {
    ...Shadows.default,
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: Colors.connectButton,
  },
  skipButton: {
    backgroundColor: Colors.skipButton,
  },
  buttonText: {
    color: Colors.buttonText,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default MainScreen;