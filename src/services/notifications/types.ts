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
    threadId?: string;
    recommendationId?: string;
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
  proactive_action: {
    screen: 'Chat',
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
