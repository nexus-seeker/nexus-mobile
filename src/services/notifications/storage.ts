import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationPreferences, STORAGE_KEY } from './types';

export const getDefaultPreferences = (): NotificationPreferences => ({
  pushEnabled: false,
  categories: {
    chat: true,
    marketing: false,
  },
  playerId: null,
  permissionStatus: 'notDetermined',
  lastPromptedAt: null,
  softAskShown: false,
});

export const getPreferences = async (): Promise<NotificationPreferences> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...getDefaultPreferences(), ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading notification preferences:', error);
  }
  return getDefaultPreferences();
};

export const savePreferences = async (
  prefs: NotificationPreferences
): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Error saving notification preferences:', error);
  }
};
