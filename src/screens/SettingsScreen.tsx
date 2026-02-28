import React from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { OneSignal } from 'react-native-onesignal';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import ClusterPickerFeature from '../components/cluster/cluster-picker-feature';
import { useNotifications } from '../hooks/useNotifications';

const CategoryRow: React.FC<{
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  locked?: boolean;
}> = ({ label, description, value, onValueChange, locked }) => (
  <View style={styles.categoryRow}>
    <View style={styles.categoryInfo}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryLabel}>{label}</Text>
        {locked && (
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredText}>Required</Text>
          </View>
        )}
      </View>
      <Text style={styles.categoryDescription}>{description}</Text>
    </View>
    {locked ? (
      <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
    ) : (
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#333', true: '#6366f1' }}
        thumbColor={value ? '#fff' : '#888'}
      />
    )}
  </View>
);

export function SettingsScreen() {
  const {
    prefs,
    isLoading,
    requestPermission,
    checkPermissionStatus,
    toggleCategory,
    getPlayerId,
    updatePreferences,
  } = useNotifications();

  const { data: playerId } = useQuery({
    queryKey: ['notifications', 'player-id'],
    queryFn: getPlayerId,
    staleTime: 60_000,
  });

  const handleMasterToggle = async (value: boolean) => {
    try {
      if (value) {
        // Trying to enable
        const hasPermission = await checkPermissionStatus();

        if (!hasPermission) {
          const granted = await requestPermission();
          if (!granted) {
            Alert.alert(
              'Permission Required',
              'Please enable notifications in system settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open Settings',
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
          }
        } else {
          OneSignal.User.pushSubscription.optIn();
          await updatePreferences({ pushEnabled: true });
        }
      } else {
        // Disabling
        OneSignal.User.pushSubscription.optOut();
        await updatePreferences({ pushEnabled: false });
      }
    } catch (err) {
      console.error('Failed to update notification settings:', err);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const copyPlayerId = async () => {
    try {
      if (playerId) {
        await Clipboard.setStringAsync(playerId);
        Alert.alert('Copied!', 'Player ID copied to clipboard');
      }
    } catch (err) {
      console.error('Failed to copy player ID:', err);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const showPlayerId = () => {
    if (playerId) {
      Alert.alert('OneSignal Player ID', playerId, [
        { text: 'Copy', onPress: copyPlayerId },
        { text: 'OK', style: 'cancel' },
      ]);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const showPermissionWarning = prefs.permissionStatus === 'denied' && prefs.pushEnabled;

  return (
    <ScrollView style={styles.container}>
      {/* Notifications Section */}
      <Text style={styles.sectionTitle}>Notifications</Text>

      {showPermissionWarning && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={20} color="#f59e0b" />
          <Text style={styles.warningText}>
            Push notifications are disabled in system settings
          </Text>
          <TouchableOpacity onPress={() => Linking.openSettings()}>
            <Text style={styles.warningAction}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.masterToggleRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Text style={styles.settingDescription}>
            Receive alerts about wallet activity and important updates
          </Text>
        </View>
        <Switch
          value={prefs.pushEnabled}
          onValueChange={handleMasterToggle}
          trackColor={{ false: '#333', true: '#6366f1' }}
          thumbColor={prefs.pushEnabled ? '#fff' : '#888'}
        />
      </View>

      {prefs.pushEnabled && (
        <View style={styles.categoriesContainer}>
          <Text style={styles.categoriesHeader}>Notification Types</Text>

          <CategoryRow
            label="Transaction Alerts"
            description="Payment confirmations, sends, and failures"
            value={true}
            onValueChange={() => {}}
            locked
          />

          <CategoryRow
            label="Security & System"
            description="Security alerts and maintenance notices"
            value={true}
            onValueChange={() => {}}
            locked
          />

          <CategoryRow
            label="Chat Messages"
            description="New messages from your conversations"
            value={prefs.categories.chat}
            onValueChange={(value) => toggleCategory('chat', value)}
          />

          <CategoryRow
            label="Promotions & Updates"
            description="New features and promotional offers"
            value={prefs.categories.marketing}
            onValueChange={(value) => toggleCategory('marketing', value)}
          />
        </View>
      )}

      {playerId && (
        <>
          <Text style={styles.sectionTitle}>Device Info</Text>
          <TouchableOpacity style={styles.infoCard} onPress={showPlayerId}>
            <Text style={styles.infoLabel}>OneSignal Player ID</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {playerId}
            </Text>
            <Text style={styles.tapHint}>Tap to view or copy</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Network Section */}
      <Text style={styles.sectionTitle}>Network</Text>
      <View style={styles.clusterContainer}>
        <ClusterPickerFeature />
      </View>

      {/* Info Footer */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          Push notifications powered by OneSignal + Firebase Cloud Messaging
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 24,
    marginBottom: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#f59e0b',
  },
  warningAction: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '500',
  },
  masterToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  categoriesContainer: {
    marginTop: 8,
    paddingLeft: 8,
  },
  categoriesHeader: {
    fontSize: 13,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  categoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  categoryLabel: {
    fontSize: 15,
    color: '#fff',
  },
  requiredBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 10,
    color: '#22c55e',
    fontWeight: '500',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
  },
  infoCard: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'GeistMono-Regular',
  },
  tapHint: {
    fontSize: 11,
    color: '#666',
    marginTop: 12,
  },
  clusterContainer: {
    marginBottom: 16,
  },
  infoSection: {
    marginTop: 32,
    marginBottom: 40,
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    textAlign: 'center',
  },
});
