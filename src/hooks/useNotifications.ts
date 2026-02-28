import { useState, useEffect, useCallback } from 'react';
import { OneSignal } from 'react-native-onesignal';
import { getPreferences, savePreferences, getDefaultPreferences } from '../services/notifications/storage';
import { NotificationPreferences } from '../services/notifications/types';

export const useNotifications = () => {
  const [prefs, setPrefs] = useState<NotificationPreferences>(getDefaultPreferences());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setError(null);
      const loaded = await getPreferences();
      setPrefs(loaded);
    } catch (err) {
      setError('Failed to load notification preferences');
      console.error('Failed to load preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      try {
        setError(null);
        const newPrefs = { ...prefs, ...updates };
        setPrefs(newPrefs);
        await savePreferences(newPrefs);
        return newPrefs;
      } catch (err) {
        setError('Failed to save notification preferences');
        console.error('Failed to save preferences:', err);
        throw err;
      }
    },
    [prefs]
  );

  const checkPermissionStatus = useCallback(async () => {
    const hasPermission = await OneSignal.Notifications.getPermissionAsync();

    const newStatus = hasPermission ? 'granted' : 'denied';
    if (prefs.permissionStatus !== newStatus) {
      await updatePreferences({ permissionStatus: newStatus });
    }

    return hasPermission;
  }, [prefs.permissionStatus, updatePreferences]);

  const requestPermission = useCallback(async () => {
    const response = await OneSignal.Notifications.requestPermission(true);
    const status = response ? 'granted' : 'denied';
    await updatePreferences({
      permissionStatus: status,
      pushEnabled: response,
      lastPromptedAt: Date.now(),
    });
    return response;
  }, [updatePreferences]);

  const toggleCategory = useCallback(
    async (category: 'chat' | 'marketing', enabled: boolean) => {
      const newCategories = { ...prefs.categories, [category]: enabled };
      await updatePreferences({ categories: newCategories });
    },
    [prefs.categories, updatePreferences]
  );

  const getPlayerId = useCallback(async () => {
    const playerId = await OneSignal.User.pushSubscription.getIdAsync();
    if (playerId !== prefs.playerId) {
      await updatePreferences({ playerId });
    }
    return playerId;
  }, [prefs.playerId, updatePreferences]);

  return {
    prefs,
    isLoading,
    error,
    updatePreferences,
    checkPermissionStatus,
    requestPermission,
    toggleCategory,
    getPlayerId,
    refresh: loadPreferences,
  };
};
