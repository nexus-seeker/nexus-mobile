import { getRouteForDeepLink, getRouteForNotification, validateDeepLink } from '../router';
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

    it('routes proactive_action notification to Chat with thread and recommendation ids', () => {
      const notification: NotificationPayload = {
        title: 'Action ready',
        body: 'Review now',
        category: NotificationCategory.CHAT,
        data: {
          action: 'proactive_action',
          threadId: 'thread-1',
          recommendationId: 'rec-1',
        } as NotificationPayload['data'],
      };

      const route = getRouteForNotification(notification);

      expect(route?.screen).toBe('Chat');
      expect(route?.params).toEqual({ threadId: 'thread-1', recommendationId: 'rec-1' });
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

  describe('getRouteForDeepLink', () => {
    it('maps chat deep link host to Chat route with threadId', () => {
      const route = getRouteForDeepLink('kawula://chat/thread-9');

      expect(route).toEqual({
        screen: 'Chat',
        params: { threadId: 'thread-9' },
      });
    });

    it('maps wallet deep link host to Profile route', () => {
      const route = getRouteForDeepLink('kawula://wallet');

      expect(route).toEqual({ screen: 'Profile' });
    });

    it('returns null for invalid deep links', () => {
      expect(getRouteForDeepLink('http://wallet')).toBeNull();
    });
  });
});
