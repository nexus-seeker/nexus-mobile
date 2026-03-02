import { NotificationPayload, NotificationRoute, NOTIFICATION_ROUTES } from './types';

const DEEP_LINK_ROUTE_MAP: Record<string, NotificationRoute['screen']> = {
  transaction: 'History',
  chat: 'Chat',
  wallet: 'Profile',
  settings: 'Policy',
};

export const getRouteForNotification = (
  notification: NotificationPayload
): NotificationRoute | null => {
  const action = notification.data?.action;
  if (!action) return null;

  if (action === 'proactive_action') {
    const params: Record<string, string> = {};
    if (notification.data.threadId) {
      params.threadId = notification.data.threadId;
    }
    if (notification.data.recommendationId) {
      params.recommendationId = notification.data.recommendationId;
    }

    return {
      screen: 'Chat',
      params: Object.keys(params).length > 0 ? params : undefined,
    };
  }

  return NOTIFICATION_ROUTES[action] || null;
};

export const getRouteForDeepLink = (url: string): NotificationRoute | null => {
  if (!validateDeepLink(url)) {
    return null;
  }

  const parsed = new URL(url);
  const screen = DEEP_LINK_ROUTE_MAP[parsed.hostname];
  if (!screen) {
    return null;
  }

  const pathParts = parsed.pathname.split('/').filter(Boolean);
  if (parsed.hostname === 'chat') {
    return {
      screen,
      ...(pathParts[0] ? { params: { threadId: pathParts[0] } } : {}),
    };
  }

  if (parsed.hostname === 'transaction') {
    return {
      screen,
      ...(pathParts[0] ? { params: { id: pathParts[0] } } : {}),
    };
  }

  return { screen };
};

export const validateDeepLink = (url: string): boolean => {
  const allowedSchemes = ['kawula:'];
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
