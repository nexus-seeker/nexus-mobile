# Push Notifications & In-App Settings - Design Document

**Date:** 2026-02-28
**Scope:** Android Only (Phase 1)
**Status:** Approved

---

## 1. Architecture & Notification Categories

### Category Definitions

```typescript
enum NotificationCategory {
  TRANSACTION = 'transaction',  // Always ON - payment received, sent, failed
  CHAT = 'chat',                // Default ON - new messages
  MARKETING = 'marketing',      // Default OFF - promotions, updates
  SYSTEM = 'system',            // Always ON - security alerts, maintenance
}
```

### Smart Defaults Matrix

| Category | Default | User Toggle | Priority | Android Channel |
|----------|---------|-------------|----------|-----------------|
| Transaction | ON | No | High | `transactions_critical` |
| Chat | ON | Yes | High | `chat_messages` |
| Marketing | OFF | Yes | Low | `marketing_updates` |
| System | ON | No | High | `system_alerts` |

### Notification Payload Structure

```typescript
interface NotificationPayload {
  title: string;
  body: string;
  category: NotificationCategory;
  data: {
    action: 'navigate' | 'open_url' | 'none';
    screen?: string;
    params?: Record<string, any>;
    deeplink?: string;
  };
  android: {
    channelId: string;
    priority: 'high' | 'default' | 'low';
  };
}
```

---

## 2. Permission Strategy (Soft Ask Pattern)

### Problem
Auto-prompt on launch = 30-40% opt-in rates
Soft ask pattern = 60-80% opt-in rates

### Flow

1. **During Onboarding**: Show educational screen explaining value
2. **User Taps "Enable"**: Trigger native Android permission dialog
3. **User Taps "Maybe Later"**: Re-ask at meaningful moments:
   - After first successful transaction
   - After sending first message
   - Always available in Settings

### Permission State Machine

```
Unknown → Soft Asked → System Asked → Granted
              ↓              ↓
          Declined       Declined (respect, offer settings link)
```

---

## 3. Deep Linking & Navigation

### Notification-to-Screen Mapping

```typescript
const NOTIFICATION_ROUTES: Record<string, NotificationRoute> = {
  'transaction_received': {
    screen: 'TransactionDetail',
    params: { type: 'received' },
    modal: true
  },
  'transaction_sent': {
    screen: 'TransactionDetail',
    params: { type: 'sent' },
    modal: true
  },
  'transaction_failed': {
    screen: 'TransactionRetry',
    modal: true
  },
  'chat_message': {
    screen: 'Chat',
    params: { navigateToConversation: true }
  },
  'promo_feature': {
    screen: 'FeatureHighlight',
    modal: true
  },
  'security_alert': {
    screen: 'SecurityAlert',
    clearStack: true
  },
};
```

### Deep Link URL Scheme

```
nexus://transaction/{id}           → Transaction detail
nexus://chat/{conversationId}      → Chat conversation
nexus://settings/notifications     → Notification settings
nexus://wallet                     → Main wallet screen
```

---

## 4. Android Notification Channels

### Channel Configuration

```typescript
const ANDROID_CHANNELS = [
  {
    id: 'transactions_critical',
    name: 'Transaction Alerts',
    description: 'Critical payment notifications',
    importance: 'high',
    sound: true,
    vibration: true,
  },
  {
    id: 'chat_messages',
    name: 'Chat Messages',
    description: 'New messages',
    importance: 'high',
    sound: true,
    vibration: true,
  },
  {
    id: 'system_alerts',
    name: 'Security & System',
    description: 'Security alerts',
    importance: 'high',
    sound: true,
    vibration: true,
  },
  {
    id: 'marketing_updates',
    name: 'Promotions & Updates',
    description: 'Optional updates',
    importance: 'low',
    sound: false,
    vibration: false,
  }
];
```

---

## 5. Error Handling & Reliability

### Error Categories

| Error Type | Handling Strategy |
|------------|-------------------|
| Initialization Failure | Silent fail, retry on next app open |
| Permission Denied | Respect decision, offer settings deep-link |
| Network Failure | Queue locally, exponential backoff retry |
| Token Refresh | Auto-retry, OneSignal handles internally |

### Exponential Backoff

```typescript
const retryWithBackoff = async (operation, maxRetries = 5) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await operation();
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i + 1) * 1000;
      await sleep(delay);
    }
  }
};
```

---

## 6. Settings UI

### Screen Structure

```
Settings
├── Push Notifications (Master Toggle)
│   └── Shows permission status
├── When enabled:
│   ├── Transaction Alerts (Locked ON)
│   ├── Security & System (Locked ON)
│   ├── Chat Messages (Toggle, default ON)
│   └── Promotions (Toggle, default OFF)
├── Device ID (OneSignal Player ID)
└── Open System Settings (if permission denied)
```

### Visual States

| State | Visual Treatment |
|-------|-----------------|
| Locked ON | Toggle disabled, green checkmark, "Required" label |
| Enabled | Toggle active, user can change |
| Disabled | Toggle off, user can enable |
| Permission Denied | Warning banner + "Open Settings" button |

---

## 7. Security & Privacy

### Principles

- **Minimize PII in payloads**: Never send wallet addresses or balances in notification body
- **OneSignal ID ≠ User ID**: Player ID is anonymous; map via backend
- **Opt-in for marketing**: Marketing OFF by default (GDPR/CCPA)

### Secure Payload Example

```typescript
// ❌ BAD
{ title: "Payment", body: "Received 2.5 SOL from 7xKp3..." }

// ✅ GOOD
{ title: "Payment Received", body: "You received a new payment" }
```

### Deep Link Validation

```typescript
const validateDeepLink = (url: string): boolean => {
  const allowedSchemes = ['nexus://'];
  const allowedHosts = ['transaction', 'chat', 'wallet', 'settings'];

  try {
    const parsed = new URL(url);
    return allowedSchemes.includes(parsed.protocol) &&
           allowedHosts.includes(parsed.hostname) &&
           !parsed.pathname.includes('..');
  } catch {
    return false;
  }
};
```

---

## 8. Testing Strategy

### Unit Tests

- Notification routing logic
- Payload validation
- Deep link validation

### Integration Tests

- OneSignal initialization
- Permission flow
- Navigation on notification tap

### Manual Testing Checklist

| Test Case | Priority |
|-----------|----------|
| Fresh install → permission prompt | P0 |
| Accept permission → send test | P0 |
| Decline permission → try toggle | P0 |
| Background → tap notification | P0 |
| Killed state → tap notification | P0 |
| Toggle category OFF → verify | P1 |
| Revoke system permission | P1 |
| Airplane mode → restore | P2 |

---

## 9. Environment Configuration

### OneSignal

- **Development Mode**: For debug builds
- **Production Mode**: For release builds

### Firebase Cloud Messaging

- Server key configured in OneSignal dashboard
- `google-services.json` in project root
- `eas.json` includes env var for builds

---

## 10. Analytics Events

```typescript
// Track notification lifecycle
'analytics.track('notification_received', { category, messageId });
'analytics.track('notification_displayed', { category, foreground });
'analytics.track('notification_tapped', { category, timeToOpen });
'analytics.track('notification_routing', { targetScreen, success });
'analytics.track('permission_granted');
'analytics.track('permission_denied');
'analytics.track('category_toggled', { category, enabled });
```

---

## Next Steps

1. Create implementation plan
2. Update existing code to match design
3. Add Android notification channels
4. Implement soft ask permission flow
5. Add notification routing
6. Update Settings screen with category toggles
7. Write tests
8. Manual testing on Android devices
