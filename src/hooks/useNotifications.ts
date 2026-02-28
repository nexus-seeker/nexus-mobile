import { useState, useEffect, useCallback } from 'react';
import OneSignal from 'react-native-onesignal';
import { getPreferences, savePreferences, getDefaultPreferences } from '../services/notifications/storage';
import { NotificationPreferences } from '../services/notifications/types';

export const useNotifications = () => {
  const [prefs, setPrefs] = useState<NotificationPreferences>(getDefaultPreferences());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const loaded = await getPreferences();
    setPrefs(loaded);
    setIsLoading(false);
  };

  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      const newPrefs = { ...prefs, ...updates };
      setPrefs(newPrefs);
      await savePreferences(newPrefs);
      return newPrefs;
    },
    [prefs]
  );

  const checkPermissionStatus = useCallback(async () => {
    const deviceState = await OneSignal.getDeviceState();
    const hasPermission = deviceState?.hasNotificationPermission ?? false;

    const newStatus = hasPermission ? 'granted' : 'denied';
    if (prefs.permissionStatus !== newStatus) {
      await updatePreferences({ permissionStatus: newStatus });
    }

    return hasPermission;
  }, [prefs.permissionStatus, updatePreferences]);

  const requestPermission = useCallback(async () => {
    return new Promise<boolean>((resolve) => {
      OneSignal.promptForPushNotificationsWithUserResponse((response) => {
        const status = response ? 'granted' : 'denied';
        updatePreferences({
          permissionStatus: status,
          pushEnabled: response,
          lastPromptedAt: Date.now(),
        });
        resolve(response);
      });
    });
  }, [updatePreferences]);

  const toggleCategory = useCallback(
    async (category: 'chat' | 'marketing', enabled: boolean) => {
      const newCategories = { ...prefs.categories, [category]: enabled };
      await updatePreferences({ categories: newCategories });
    },
    [prefs.categories, updatePreferences]
  );

  const getPlayerId = useCallback(async () => {
    const deviceState = await OneSignal.getDeviceState();
    const playerId = deviceState?.userId || null;
    if (playerId !== prefs.playerId) {
      await updatePreferences({ playerId });
    }
    return playerId;
  }, [prefs.playerId, updatePreferences]);

  return {
    prefs,
    isLoading,
    updatePreferences,
    checkPermissionStatus,
    requestPermission,
    toggleCategory,
    getPlayerId,
    refresh: loadPreferences,
  };
};
