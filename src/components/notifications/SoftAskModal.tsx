import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SoftAskModalProps {
  visible: boolean;
  onEnable: () => void;
  onDismiss: () => void;
}

export const SoftAskModal: React.FC<SoftAskModalProps> = ({
  visible,
  onEnable,
  onDismiss,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={48} color="#6366f1" />
          </View>

          <Text style={styles.title}>Stay in the Loop</Text>

          <Text style={styles.description}>
            Get notified when:
          </Text>

          <View style={styles.bulletPoints}>
            <View style={styles.bullet}>
              <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
              <Text style={styles.bulletText}>Payments are confirmed</Text>
            </View>
            <View style={styles.bullet}>
              <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
              <Text style={styles.bulletText}>You receive messages</Text>
            </View>
            <View style={styles.bullet}>
              <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
              <Text style={styles.bulletText}>Security alerts occur</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.enableButton} onPress={onEnable}>
            <Text style={styles.enableButtonText}>Enable Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#888',
    marginBottom: 16,
  },
  bulletPoints: {
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bulletText: {
    fontSize: 14,
    color: '#ccc',
  },
  enableButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  enableButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    marginTop: 12,
    paddingVertical: 12,
  },
  dismissButtonText: {
    color: '#666',
    fontSize: 14,
  },
});
