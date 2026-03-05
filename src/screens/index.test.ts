jest.mock('./ChatScreen', () => ({
  ChatScreen: () => null,
}));

jest.mock('./ConversationListScreen', () => ({
  ConversationListScreen: () => null,
}));

jest.mock('./PolicyScreen', () => ({
  PolicyScreen: () => null,
}));

jest.mock('./HistoryScreen', () => ({
  HistoryScreen: () => null,
}));

jest.mock('./ProfileScreen', () => ({
  ProfileScreen: () => null,
}));

import * as screens from './index';

describe('screens barrel exports', () => {
  it('does not export ConversationListScreen', () => {
    expect('ConversationListScreen' in screens).toBe(false);
  });
});
