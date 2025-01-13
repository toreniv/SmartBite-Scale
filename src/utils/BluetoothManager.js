// utils/BluetoothManager.js
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import AsyncStorage from '@react-native-async-storage/async-storage';

class BluetoothManager {
  constructor() {
    this.device = null;
    this.isConnected = false;
  }

  async init() {
    try {
      const enabled = await RNBluetoothClassic.isEnabled();
      if (!enabled) {
        await RNBluetoothClassic.requestEnable();
      }
    } catch (error) {
      console.error('Failed to initialize Bluetooth:', error);
      throw error;
    }
  }

  async connect() {
    try {
      await this.init();
      
      // Get last connected device address
      const lastDeviceAddress = await AsyncStorage.getItem('lastConnectedDevice');
      
      if (lastDeviceAddress) {
        this.device = await RNBluetoothClassic.connectToDevice(lastDeviceAddress);
        this.isConnected = true;
        return true;
      }
      
      // If no last device, scan for devices
      const devices = await RNBluetoothClassic.list();
      // Here you would typically show a UI for the user to select a device
      // For now, we'll just connect to the first available device
      if (devices.length > 0) {
        this.device = await RNBluetoothClassic.connectToDevice(devices[0].address);
        await AsyncStorage.setItem('lastConnectedDevice', devices[0].address);
        this.isConnected = true;
        return true;
      }
      
      throw new Error('No devices found');
    } catch (error) {
      console.error('Failed to connect:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    if (this.device && this.isConnected) {
      try {
        await this.device.disconnect();
        this.isConnected = false;
        this.device = null;
      } catch (error) {
        console.error('Failed to disconnect:', error);
        throw error;
      }
    }
  }

  async sendMessage(message) {
    if (!this.device || !this.isConnected) {
      throw new Error('Not connected to any device');
    }
    
    try {
      await this.device.write(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async startWeightReading() {
    if (!this.device || !this.isConnected) {
      throw new Error('Not connected to any device');
    }

    try {
      // Send command to start weight reading
      await this.sendMessage('START_WEIGHT');
      
      // Start listening for incoming data
      this.device.onDataReceived((data) => {
        // Parse the weight data
        const weight = parseFloat(data);
        // Here you would typically update your UI with the weight
        console.log('Received weight:', weight);
      });
    } catch (error) {
      console.error('Failed to start weight reading:', error);
      throw error;
    }
  }
}

export default new BluetoothManager();