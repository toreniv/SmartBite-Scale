// src/screens/SecondScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SecondScreen = ({ navigation }) => {
  const menuItems = [
    {
      id: 'scan',
      title: 'Scan Food',
      icon: 'camera',
      onPress: () => navigation.navigate('ScanFood'),
    },
    {
      id: 'calibration',
      title: 'Calibration',
      icon: 'scale-bathroom',
      onPress: () => navigation.navigate('Calibration'),
    },
    {
      id: 'upload',
      title: 'Upload Image',
      icon: 'image-plus',
      onPress: () => navigation.navigate('UploadImage'),
    },
    {
      id: 'more',
      title: 'More Features',
      icon: 'dots-horizontal',
      onPress: () => navigation.navigate('MoreFeatures'),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <Icon name={item.icon} size={40} color="#007AFF" />
            <Text style={styles.menuItemText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back to Main Screen</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  menuItem: {
    width: '45%',
    aspectRatio: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItemText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
  },
  backButton: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default SecondScreen;