import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './AppNavigator';

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('../utils/thread-id', () => ({
  createNewThreadId: () => 'thread:new-test',
}));

jest.mock('../screens/WalletConnectScreen', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');

  return {
    WalletConnectScreen: ({ onConnected }: { onConnected: () => void }) => (
      <Pressable onPress={onConnected}>
        <Text>wallet-connect</Text>
      </Pressable>
    ),
  };
});

jest.mock('../screens/OnboardingScreen', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');

  return {
    OnboardingScreen: ({ onComplete }: { onComplete: () => void }) => (
      <Pressable onPress={onComplete}>
        <Text>onboarding-complete</Text>
      </Pressable>
    ),
  };
});

jest.mock('../screens', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    ChatScreen: ({ route }: { route?: { params?: { threadId?: string } } }) => (
      <Text>{`Chat thread: ${route?.params?.threadId ?? 'none'}`}</Text>
    ),
    PolicyScreen: () => <Text>Policy mock</Text>,
    ProfileScreen: () => <Text>Profile mock</Text>,
    HistoryScreen: () => <Text>History mock</Text>,
  };
});

describe('AppNavigator', () => {
  it('routes onboarding completion directly to Chat with a new thread', async () => {
    const { getByText, findByText } = render(
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>,
    );

    fireEvent.press(getByText('wallet-connect'));
    fireEvent.press(await findByText('onboarding-complete'));

    expect(await findByText('Chat thread: thread:new-test')).toBeTruthy();
  });
});
