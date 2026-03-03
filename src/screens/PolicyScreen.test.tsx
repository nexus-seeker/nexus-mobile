import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('../contexts/PolicyContext', () => ({
  usePolicy: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: () => null,
}));

const { usePolicy } = require('../contexts/PolicyContext');
const { PolicyScreen } = require('./PolicyScreen');

describe('PolicyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (usePolicy as jest.Mock).mockReturnValue({
      policy: {
        dailyLimitSol: 1,
        dailySpentSol: 0.4,
        allowedProtocols: ['JUPITER', 'SPL_TRANSFER'],
        isActive: true,
      },
      isReady: true,
      isSaving: false,
      lastError: null,
      lastSyncSignature: null,
      savePolicy: jest.fn().mockResolvedValue({
        ok: true,
        synced: true,
        error: null,
      }),
      clearPolicyError: jest.fn(),
    });
  });

  it('shows usage summary with percent consumed', () => {
    const { getByText } = render(<PolicyScreen />);

    expect(getByText('Usage today')).toBeTruthy();
    expect(getByText('40.0% used')).toBeTruthy();
  });

  it('keeps save disabled until policy form is changed', () => {
    const { getByTestId, getByPlaceholderText } = render(<PolicyScreen />);

    const saveButton = getByTestId('policy-save-button');
    expect(Boolean(saveButton.props.accessibilityState?.disabled)).toBe(true);

    fireEvent.changeText(getByPlaceholderText('0.00'), '1.5');

    const updatedSaveButton = getByTestId('policy-save-button');
    expect(Boolean(updatedSaveButton.props.accessibilityState?.disabled)).toBe(false);
  });
});
