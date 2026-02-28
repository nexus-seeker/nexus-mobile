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
