import { NotificationPayload, NotificationRoute, NOTIFICATION_ROUTES } from './types';

export const getRouteForNotification = (
  notification: NotificationPayload
): NotificationRoute | null => {
  const action = notification.data?.action;
  if (!action) return null;

  return NOTIFICATION_ROUTES[action] || null;
};

export const validateDeepLink = (url: string): boolean => {
  const allowedSchemes = ['nexus:'];
  const allowedHosts = ['transaction', 'chat', 'wallet', 'settings'];

  // Check for path traversal attempts before parsing
  if (url.includes('..')) {
    return false;
  }

  try {
    const parsed = new URL(url);

    if (!allowedSchemes.includes(parsed.protocol)) {
      return false;
    }

    if (!allowedHosts.includes(parsed.hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};
