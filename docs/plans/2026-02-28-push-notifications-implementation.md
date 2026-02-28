# Push Notifications Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement production-grade Android push notifications with category-based settings, soft-ask permission flow, and deep linking

**Architecture:** Notification service with category-based routing, permission state machine, and granular user controls. Android notification channels for different priorities.

**Tech Stack:** React Native, Expo, OneSignal SDK, Firebase Cloud Messaging, AsyncStorage, React Navigation

---

## Task 1: Create Notification Types and Constants

**Files:**
- Create: `src/services/notifications/types.ts`

**Step 1: Write the type definitions**

```typescript
export enum NotificationCategory {
  TRANSACTION = 'transaction',
  CHAT = 'chat',
  MARKETING = 'marketing',
  SYSTEM = 'system',
}

export interface NotificationPayload {
  title: string;
  body: string;
  category: NotificationCategory;
  data: {
    action: string;
    screen?: string;
    params?: Record<string, any>;
    deeplink?: string;
  };
  android?: {
    channelId: string;
    priority: 'high' | 'default' | 'low';
  };
}

export interface NotificationRoute {
  screen: string;
  params?: Record<string, any>;
  modal?: boolean;
  clearStack?: boolean;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  categories: {
    chat: boolean;
    marketing: boolean;
  };
  playerId: string | null;
  permissionStatus: 'granted' | 'denied' | 'notDetermined';
  lastPromptedAt: number | null;
  softAskShown: boolean;
}

export const ANDROID_CHANNELS = {
  TRANSACTIONS: {
    id: 'transactions_critical',
    name: 'Transaction Alerts',
    description: 'Critical payment notifications',
    importance: 'high',
    sound: true,
    vibration: true,
  },
  CHAT: {
    id: 'chat_messages',
    name: 'Chat Messages',
    description: 'New messages from conversations',
    importance: 'high',
    sound: true,
    vibration: true,
  },
  SYSTEM: {
    id: 'system_alerts',
    name: 'Security & System',
    description: 'Security alerts and important updates',
    importance: 'high',
    sound: true,
    vibration: true,
  },
  MARKETING: {
    id: 'marketing_updates',
    name: 'Promotions & Updates',
    description: 'Optional updates about new features',
    importance: 'low',
    sound: false,
    vibration: false,
  },
} as const;

export const NOTIFICATION_ROUTES: Record<string, NotificationRoute> = {
  transaction_received: {
    screen: 'TransactionDetail',
    params: { type: 'received' },
    modal: true,
  },
  transaction_sent: {
    screen: 'TransactionDetail',
    params: { type: 'sent' },
    modal: true,
  },
  transaction_failed: {
    screen: 'TransactionRetry',
    modal: true,
  },
  chat_message: {
    screen: 'Chat',
    params: { navigateToConversation: true },
  },
  promo_feature: {
    screen: 'FeatureHighlight',
    modal: true,
  },
  security_alert: {
    screen: 'SecurityAlert',
    clearStack: true,
  },
};

export const STORAGE_KEY = '@notification_prefs_v1';
```

**Step 2: Commit**

```bash
git add src/services/notifications/types.ts
git commit -m "feat(notifications): add type definitions and constants"
```

---

## Task 2: Create Notification Storage Service

**Files:**
- Create: `src/services/notifications/storage.ts`
- Create: `src/services/notifications/__tests__/storage.test.ts`

**Step 1: Write the test**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPreferences,
  savePreferences,
  getDefaultPreferences,
} from '../storage';
import { STORAGE_KEY } from '../types';

jest.mock('@react-native-async-storage/async-storage');

describe('Notification Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns default preferences when none stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const prefs = await getPreferences();

    expect(prefs).toEqual(getDefaultPreferences());
  });

  it('returns stored preferences', async () => {
    const stored = JSON.stringify({
      pushEnabled: true,
      categories: { chat: false, marketing: true },
    });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(stored);

    const prefs = await getPreferences();

    expect(prefs.categories.chat).toBe(false);
    expect(prefs.categories.marketing).toBe(true);
  });

  it('saves preferences correctly', async () => {
    const prefs = getDefaultPreferences();
    prefs.pushEnabled = false;

    await savePreferences(prefs);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify(prefs)
    );
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/services/notifications/__tests__/storage.test.ts
```

Expected: FAIL - "Cannot find module '../storage'"

**Step 3: Write minimal implementation**

```typescript
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
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/services/notifications/__tests__/storage.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/services/notifications/storage.ts
git add src/services/notifications/__tests__/storage.test.ts
git commit -m "feat(notifications): add storage service with tests"
```

---

## Task 3: Create Notification Router

**Files:**
- Create: `src/services/notifications/router.ts`
- Create: `src/services/notifications/__tests__/router.test.ts`

**Step 1: Write the test**

```typescript
import { getRouteForNotification, validateDeepLink } from '../router';
import { NotificationCategory, NotificationPayload } from '../types';

describe('Notification Router', () => {
  describe('getRouteForNotification', () => {
    it('routes transaction_received to TransactionDetail', () => {
      const notification: NotificationPayload = {
        title: 'Payment',
        body: 'Received',
        category: NotificationCategory.TRANSACTION,
        data: { action: 'transaction_received' },
      };

      const route = getRouteForNotification(notification);

      expect(route.screen).toBe('TransactionDetail');
      expect(route.params).toEqual({ type: 'received' });
      expect(route.modal).toBe(true);
    });

    it('routes chat_message to Chat screen', () => {
      const notification: NotificationPayload = {
        title: 'New Message',
        body: 'Hello',
        category: NotificationCategory.CHAT,
        data: { action: 'chat_message' },
      };

      const route = getRouteForNotification(notification);

      expect(route.screen).toBe('Chat');
      expect(route.params).toEqual({ navigateToConversation: true });
    });

    it('returns null for unknown action', () => {
      const notification: NotificationPayload = {
        title: 'Unknown',
        body: 'Test',
        category: NotificationCategory.SYSTEM,
        data: { action: 'unknown_action' },
      };

      const route = getRouteForNotification(notification);

      expect(route).toBeNull();
    });
  });

  describe('validateDeepLink', () => {
    it('accepts valid nexus links', () => {
      expect(validateDeepLink('nexus://wallet')).toBe(true);
      expect(validateDeepLink('nexus://chat/123')).toBe(true);
      expect(validateDeepLink('nexus://transaction/abc')).toBe(true);
    });

    it('rejects invalid schemes', () => {
      expect(validateDeepLink('http://wallet')).toBe(false);
      expect(validateDeepLink('evil://hack')).toBe(false);
    });

    it('rejects path traversal attempts', () => {
      expect(validateDeepLink('nexus://wallet/../etc/passwd')).toBe(false);
    });

    it('rejects invalid hosts', () => {
      expect(validateDeepLink('nexus://hack')).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/services/notifications/__tests__/router.test.ts
```

Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
import { NotificationPayload, NotificationRoute, NOTIFICATION_ROUTES } from './types';

export const getRouteForNotification = (
  notification: NotificationPayload
): NotificationRoute | null => {
  const action = notification.data?.action;
  if (!action) return null;

  return NOTIFICATION_ROUTES[action] || null;
};

export const validateDeepLink = (url: string): boolean => {
  const allowedSchemes = ['nexus://'];
  const allowedHosts = ['transaction', 'chat', 'wallet', 'settings'];

  try {
    const parsed = new URL(url);

    if (!allowedSchemes.includes(parsed.protocol)) {
      return false;
    }

    if (!allowedHosts.includes(parsed.hostname)) {
      return false;
    }

    if (parsed.pathname.includes('..')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/services/notifications/__tests__/router.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/services/notifications/router.ts
git add src/services/notifications/__tests__/router.test.ts
git commit -m "feat(notifications): add notification router with validation"
```

---

## Task 4: Create Permission Hook

**Files:**
- Create: `src/hooks/useNotifications.ts`
- Create: `src/hooks/__tests__/useNotifications.test.ts`

**Step 1: Write the hook**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/hooks/useNotifications.ts
git commit -m "feat(notifications): add useNotifications hook"
```

---

## Task 5: Update Push Notifications Service

**Files:**
- Modify: `src/services/pushNotifications.ts`

**Step 1: Update the implementation**

```typescript
import OneSignal from 'react-native-onesignal';
import { getRouteForNotification, validateDeepLink } from './notifications/router';
import { getPreferences, savePreferences } from './notifications/storage';
import { NotificationCategory, ANDROID_CHANNELS } from './notifications/types';

const ONE_SIGNAL_APP_ID = 'e7b51ed4-d08f-4224-8fc4-8868d6024f39';

let navigationRef: any = null;

export const setNotificationNavigationRef = (ref: any) => {
  navigationRef = ref;
};

export const initializePushNotifications = async () => {
  try {
    // Initialize OneSignal
    OneSignal.setAppId(ONE_SIGNAL_APP_ID);

    // Load saved preferences
    const prefs = await getPreferences();

    // Apply saved settings
    if (!prefs.pushEnabled) {
      OneSignal.disablePush(true);
    }

    // Set up notification handlers
    setupNotificationHandlers();

    // Sync permission status
    const deviceState = await OneSignal.getDeviceState();
    const hasPermission = deviceState?.hasNotificationPermission ?? false;

    if (prefs.permissionStatus === 'granted' && !hasPermission) {
      // User revoked permission in system settings
      await savePreferences({
        ...prefs,
        permissionStatus: 'denied',
        pushEnabled: false,
      });
    }

    console.log('[PushNotifications] Initialized');
  } catch (error) {
    console.error('[PushNotifications] Initialization failed:', error);
    // Silent fail - will retry on next app open
  }
};

const setupNotificationHandlers = () => {
  // Handle received notifications while app is in foreground
  OneSignal.setNotificationWillShowInForegroundHandler(
    (notificationReceivedEvent) => {
      const notification = notificationReceivedEvent.getNotification();
      console.log('[PushNotifications] Received in foreground:', notification);

      // You can choose to show or suppress based on category
      const category = notification.additionalData?.category;
      if (category === NotificationCategory.MARKETING) {
        // Suppress marketing notifications in foreground
        notificationReceivedEvent.complete(null);
      } else {
        notificationReceivedEvent.complete(notification);
      }
    }
  );

  // Handle opened notifications
  OneSignal.setNotificationOpenedHandler((openedEvent) => {
    const { notification } = openedEvent;
    console.log('[PushNotifications] Opened:', notification);

    handleNotificationTap(notification);
  });
};

const handleNotificationTap = (notification: any) => {
  const { additionalData } = notification;

  if (!additionalData) {
    console.warn('[PushNotifications] No additional data in notification');
    return;
  }

  // Handle deep link if present
  if (additionalData.deeplink && validateDeepLink(additionalData.deeplink)) {
    // Parse and navigate to deep link
    const url = new URL(additionalData.deeplink);
    const screen = url.hostname;
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (navigationRef) {
      navigationRef.navigate(screen, { id: pathParts[0] });
    }
    return;
  }

  // Handle action-based routing
  const route = getRouteForNotification({
    title: notification.title || '',
    body: notification.body || '',
    category: additionalData.category || NotificationCategory.SYSTEM,
    data: additionalData,
  });

  if (route && navigationRef) {
    if (route.clearStack) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: route.screen, params: route.params }],
      });
    } else if (route.modal) {
      navigationRef.navigate('Modal', {
        screen: route.screen,
        params: route.params,
      });
    } else {
      navigationRef.navigate(route.screen, route.params);
    }
  }

  // Analytics tracking
  // analytics.track('notification_opened', {
  //   category: additionalData.category,
  //   action: additionalData.action,
  // });
};

export const requestPushPermission = (): Promise<boolean> => {
  return new Promise((resolve) => {
    OneSignal.promptForPushNotificationsWithUserResponse(async (response) => {
      await savePreferences({
        pushEnabled: response,
        permissionStatus: response ? 'granted' : 'denied',
        lastPromptedAt: Date.now(),
      });
      resolve(response);
    });
  });
};

export const getOneSignalPlayerId = async (): Promise<string | null> => {
  const deviceState = await OneSignal.getDeviceState();
  return deviceState?.userId || null;
};

export const setExternalUserId = (userId: string) => {
  OneSignal.setExternalUserId(userId);
};

export const removeExternalUserId = () => {
  OneSignal.removeExternalUserId();
};

export const disablePushNotifications = (disable: boolean) => {
  OneSignal.disablePush(disable);
};

export const sendTag = (key: string, value: string) => {
  OneSignal.sendTag(key, value);
};

export const deleteTag = (key: string) => {
  OneSignal.deleteTag(key);
};
```

**Step 2: Commit**

```bash
git add src/services/pushNotifications.ts
git commit -m "feat(notifications): enhance push service with routing and error handling"
```

---

## Task 6: Create Soft Ask Component

**Files:**
- Create: `src/components/notifications/SoftAskModal.tsx`

**Step 1: Write the component**

```typescript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SoftAskModalProps {
  visible: boolean;
  onEnable: () => void;
  onDismiss: () => void;
}

export const SoftAskModal: React.FC<SoftAskModalProps> = ({
  visible,
  onEnable,
  onDismiss,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={48} color="#6366f1" />
          </View>

          <Text style={styles.title}>Stay in the Loop</Text>

          <Text style={styles.description}>
            Get notified when:
          </Text>

          <View style={styles.bulletPoints}>
            <View style={styles.bullet}>
              <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
              <Text style={styles.bulletText}>Payments are confirmed</Text>
            </View>
            <View style={styles.bullet}>
              <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
              <Text style={styles.bulletText}>You receive messages</Text>
            </View>
            <View style={styles.bullet}>
              <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
              <Text style={styles.bulletText}>Security alerts occur</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.enableButton} onPress={onEnable}>
            <Text style={styles.enableButtonText}>Enable Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#888',
    marginBottom: 16,
  },
  bulletPoints: {
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bulletText: {
    fontSize: 14,
    color: '#ccc',
  },
  enableButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  enableButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    marginTop: 12,
    paddingVertical: 12,
  },
  dismissButtonText: {
    color: '#666',
    fontSize: 14,
  },
});
```

**Step 2: Commit**

```bash
git add src/components/notifications/SoftAskModal.tsx
git commit -m "feat(notifications): add soft ask modal component"
```

---

## Task 7: Update Settings Screen

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`

**Step 1: Update the implementation**

```typescript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import OneSignal from 'react-native-onesignal';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import ClusterPickerFeature from '../components/cluster/cluster-picker-feature';
import { useNotifications } from '../hooks/useNotifications';

const CategoryRow: React.FC<{
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  locked?: boolean;
}> = ({ label, description, value, onValueChange, locked }) => (
  <View style={styles.categoryRow}>
    <View style={styles.categoryInfo}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryLabel}>{label}</Text>
        {locked && (
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredText}>Required</Text>
          </View>
        )}
      </View>
      <Text style={styles.categoryDescription}>{description}</Text>
    </View>
    {locked ? (
      <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
    ) : (
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#333', true: '#6366f1' }}
        thumbColor={value ? '#fff' : '#888'}
      />
    )}
  </View>
);

export function SettingsScreen() {
  const {
    prefs,
    isLoading,
    requestPermission,
    checkPermissionStatus,
    toggleCategory,
    getPlayerId,
    updatePreferences,
  } = useNotifications();

  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    loadPlayerId();
  }, []);

  const loadPlayerId = async () => {
    const id = await getPlayerId();
    setPlayerId(id);
  };

  const handleMasterToggle = async (value: boolean) => {
    if (value) {
      // Trying to enable
      const hasPermission = await checkPermissionStatus();

      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in system settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
        }
      } else {
        OneSignal.disablePush(false);
        await updatePreferences({ pushEnabled: true });
      }
    } else {
      // Disabling
      OneSignal.disablePush(true);
      await updatePreferences({ pushEnabled: false });
    }
  };

  const copyPlayerId = async () => {
    if (playerId) {
      await Clipboard.setStringAsync(playerId);
      Alert.alert('Copied!', 'Player ID copied to clipboard');
    }
  };

  const showPlayerId = () => {
    if (playerId) {
      Alert.alert('OneSignal Player ID', playerId, [
        { text: 'Copy', onPress: copyPlayerId },
        { text: 'OK', style: 'cancel' },
      ]);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const showPermissionWarning = prefs.permissionStatus === 'denied' && prefs.pushEnabled;

  return (
    <ScrollView style={styles.container}>
      {/* Notifications Section */}
      <Text style={styles.sectionTitle}>Notifications</Text>

      {showPermissionWarning && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={20} color="#f59e0b" />
          <Text style={styles.warningText}>
            Push notifications are disabled in system settings
          </Text>
          <TouchableOpacity onPress={() => Linking.openSettings()}>
            <Text style={styles.warningAction}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.masterToggleRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Text style={styles.settingDescription}>
            Receive alerts about wallet activity and important updates
          </Text>
        </View>
        <Switch
          value={prefs.pushEnabled}
          onValueChange={handleMasterToggle}
          trackColor={{ false: '#333', true: '#6366f1' }}
          thumbColor={prefs.pushEnabled ? '#fff' : '#888'}
        />
      </View>

      {prefs.pushEnabled && (
        <View style={styles.categoriesContainer}>
          <Text style={styles.categoriesHeader}>Notification Types</Text>

          <CategoryRow
            label="Transaction Alerts"
            description="Payment confirmations, sends, and failures"
            value={true}
            onValueChange={() => {}}
            locked
          />

          <CategoryRow
            label="Security & System"
            description="Security alerts and maintenance notices"
            value={true}
            onValueChange={() => {}}
            locked
          />

          <CategoryRow
            label="Chat Messages"
            description="New messages from your conversations"
            value={prefs.categories.chat}
            onValueChange={(value) => toggleCategory('chat', value)}
          />

          <CategoryRow
            label="Promotions & Updates"
            description="New features and promotional offers"
            value={prefs.categories.marketing}
            onValueChange={(value) => toggleCategory('marketing', value)}
          />
        </View>
      )}

      {playerId && (
        <>
          <Text style={styles.sectionTitle}>Device Info</Text>
          <TouchableOpacity style={styles.infoCard} onPress={showPlayerId}>
            <Text style={styles.infoLabel}>OneSignal Player ID</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {playerId}
            </Text>
            <Text style={styles.tapHint}>Tap to view or copy</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Network Section */}
      <Text style={styles.sectionTitle}>Network</Text>
      <View style={styles.clusterContainer}>
        <ClusterPickerFeature />
      </View>

      {/* Info Footer */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          Push notifications powered by OneSignal + Firebase Cloud Messaging
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 24,
    marginBottom: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#f59e0b',
  },
  warningAction: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '500',
  },
  masterToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  categoriesContainer: {
    marginTop: 8,
    paddingLeft: 8,
  },
  categoriesHeader: {
    fontSize: 13,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  categoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  categoryLabel: {
    fontSize: 15,
    color: '#fff',
  },
  requiredBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 10,
    color: '#22c55e',
    fontWeight: '500',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
  },
  infoCard: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'GeistMono-Regular',
  },
  tapHint: {
    fontSize: 11,
    color: '#666',
    marginTop: 12,
  },
  clusterContainer: {
    marginBottom: 16,
  },
  infoSection: {
    marginTop: 32,
    marginBottom: 40,
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    textAlign: 'center',
  },
});
```

**Step 2: Install @expo/vector-icons if not present**

```bash
npm install @expo/vector-icons
```

**Step 3: Commit**

```bash
git add src/screens/SettingsScreen.tsx
git add package.json package-lock.json
git commit -m "feat(notifications): update Settings screen with category toggles"
```

---

## Task 8: Update App.tsx with Navigation Ref

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add navigation ref for notification routing**

Add to imports:
```typescript
import { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { setNotificationNavigationRef } from './services/pushNotifications';
```

Wrap AppNavigator with NavigationContainer and set ref:
```typescript
// Inside App component
const navigationRef = useRef(null);

useEffect(() => {
  setNotificationNavigationRef(navigationRef.current);
}, []);

// In render:
<NavigationContainer ref={navigationRef}>
  <AppNavigator />
</NavigationContainer>
```

**Note:** This assumes AppNavigator is not already wrapped. Check current App.tsx structure first.

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat(notifications): add navigation ref for notification routing"
```

---

## Task 9: Create Notifications Index

**Files:**
- Create: `src/services/notifications/index.ts`

**Step 1: Export all notification services**

```typescript
export * from './types';
export * from './storage';
export * from './router';
```

**Step 2: Commit**

```bash
git add src/services/notifications/index.ts
git commit -m "chore(notifications): add index exports"
```

---

## Task 10: Run Tests and Verify

**Step 1: Run all notification tests**

```bash
npm test -- src/services/notifications/__tests__
```

Expected: All tests pass

**Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Build check**

```bash
npx expo prebuild --clean
```

Expected: Build succeeds (Android only)

**Step 4: Commit**

```bash
git commit -m "test(notifications): verify all tests pass"
```

---

## Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `src/services/notifications/types.ts` | Create | Type definitions and constants |
| `src/services/notifications/storage.ts` | Create | AsyncStorage wrapper |
| `src/services/notifications/router.ts` | Create | Notification routing logic |
| `src/services/notifications/index.ts` | Create | Export barrel |
| `src/hooks/useNotifications.ts` | Create | React hook for notification state |
| `src/components/notifications/SoftAskModal.tsx` | Create | Soft permission request UI |
| `src/services/pushNotifications.ts` | Update | Enhanced with routing and error handling |
| `src/screens/SettingsScreen.tsx` | Update | Category-based settings UI |
| `src/App.tsx` | Update | Navigation ref integration |

---

## Testing Checklist (Manual)

- [ ] Fresh install shows soft ask (if implemented in onboarding)
- [ ] Accept permission → notifications enabled
- [ ] Decline permission → shows "Open Settings" option
- [ ] Background notification → tap navigates to correct screen
- [ ] Killed state notification → opens and navigates correctly
- [ ] Category toggles persist across app restarts
- [ ] Master toggle disables all notifications
- [ ] Player ID displays and copies correctly
- [ ] Transaction alerts always enabled (locked)
- [ ] Marketing starts disabled (user must opt-in)

---

**Plan complete and saved to `docs/plans/2026-02-28-push-notifications-implementation.md`.**

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration
2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
