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

      expect(route!.screen).toBe('TransactionDetail');
      expect(route!.params).toEqual({ type: 'received' });
      expect(route!.modal).toBe(true);
    });

    it('routes chat_message to Chat screen', () => {
      const notification: NotificationPayload = {
        title: 'New Message',
        body: 'Hello',
        category: NotificationCategory.CHAT,
        data: { action: 'chat_message' },
      };

      const route = getRouteForNotification(notification);

      expect(route!.screen).toBe('Chat');
      expect(route!.params).toEqual({ navigateToConversation: true });
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
    it('accepts valid kawula links', () => {
      expect(validateDeepLink('kawula://wallet')).toBe(true);
      expect(validateDeepLink('kawula://chat/123')).toBe(true);
      expect(validateDeepLink('kawula://transaction/abc')).toBe(true);
    });

    it('rejects invalid schemes', () => {
      expect(validateDeepLink('http://wallet')).toBe(false);
      expect(validateDeepLink('evil://hack')).toBe(false);
    });

    it('rejects path traversal attempts', () => {
      expect(validateDeepLink('kawula://wallet/../etc/passwd')).toBe(false);
    });

    it('rejects invalid hosts', () => {
      expect(validateDeepLink('kawula://hack')).toBe(false);
    });
  });
});
