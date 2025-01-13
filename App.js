// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MainScreen from './src/screens/MainScreen';
import SecondScreen from './src/screens/SecondScreen';

// Placeholder screens - we'll implement these later
const ScanFoodScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Scan Food Screen</Text></View>;
const CalibrationScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Calibration Screen</Text></View>;
const UploadImageScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Upload Image Screen</Text></View>;
const MoreFeaturesScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>More Features Screen</Text></View>;

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Main" 
          component={MainScreen}
          options={{ title: 'SmartBite-Scale' }}
        />
        <Stack.Screen 
          name="Second" 
          component={SecondScreen}
          options={{ title: 'Menu' }}
        />
        <Stack.Screen 
          name="ScanFood" 
          component={ScanFoodScreen}
          options={{ title: 'Scan Food' }}
        />
        <Stack.Screen 
          name="Calibration" 
          component={CalibrationScreen}
          options={{ title: 'Calibration' }}
        />
        <Stack.Screen 
          name="UploadImage" 
          component={UploadImageScreen}
          options={{ title: 'Upload Image' }}
        />
        <Stack.Screen 
          name="MoreFeatures" 
          component={MoreFeaturesScreen}
          options={{ title: 'More Features' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;