import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, AppState, Image } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import * as Notifications from 'expo-notifications';

export default function App() {
  const [magneticField, setMagneticField] = useState({ x: 0, y: 0, z: 0 });
  const [subscription, setSubscription] = useState(null);
  const [compassHeading, setCompassHeading] = useState(0);
  const [notificationId, setNotificationId] = useState(null);

  const calculateCompassHeading = () => {
    const { x, y } = magneticField;
    const heading = Math.atan2(y, x) * (180 / Math.PI);
    const adjustedHeading = (heading + 360) % 360;
    setCompassHeading(adjustedHeading);
    updateNotification(adjustedHeading.toFixed(2), getCardinalDirection());
  };

  const getCardinalDirection = () => {
    const directions = ['North', 'North East', 'East', 'South East', 'South', 'South West', 'West', 'North West'];
    const index = Math.round(compassHeading / 45) % 8;
    return directions[index];
  };

  const updateNotification = async (heading, direction) => {
    const notificationContent = {
      title: 'Compass Update',
      body: `Compass Heading: ${heading}°\nDirection: ${direction}`,
      sound: 'default',
      data: { screen: 'compass' },
    };

    try {
      if (notificationId) {
        await Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

        await Notifications.scheduleNotificationAsync({
          identifier: notificationId,
          content: notificationContent,
          trigger: null,
        });
      } else {
        const identifier = await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: null,
        });
        setNotificationId(identifier);
      }
    } catch (error) {
      console.log('Notification error:', error);
    }
  };

  useEffect(() => {
    const subscribeToMagnetometer = async () => {
      const isAvailable = await Magnetometer.isAvailableAsync();
      if (isAvailable) {
        const newSubscription = Magnetometer.addListener((data) => {
          setMagneticField(data);
        });
        Magnetometer.setUpdateInterval(100);
        setSubscription(newSubscription);
      } else {
        console.log('Magnetometer sensor is not available on this device.');
      }
    };

    subscribeToMagnetometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background') {
        calculateCompassHeading();
      }
    };

    AppState.addEventListener('change', handleAppStateChange);

    return () => {
      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, []);

  useEffect(() => {
    calculateCompassHeading();
  }, [magneticField]);

  return (
    <View style={styles.container}>
    <View style={styles.iconContainer}>
        <Image
          source={require('./assets/UselessCompass.png')}
          style={styles.icon}
        />
      </View>
      <Text>Compass Heading: {compassHeading.toFixed(2)}°</Text>
      <Text>Direction: {getCardinalDirection()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
   flex: 1,
    backgroundColor: 'grey',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  icon: {
    width: 72,
    height: 72,
  },
});