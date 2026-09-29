import React from 'react';
import { SafeView } from './SafeView';
import { useTheme } from 'react-native-paper';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { StyleSheet, ViewStyle, Modal as RNModal, View, TouchableWithoutFeedback, Platform } from 'react-native';

interface ModalProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle | ViewStyle[];
  entering?: any;
  exiting?: any;
}

export const Modal = ({
  visible,
  onDismiss,
  children,
  contentContainerStyle,
  entering = FadeIn,
  exiting = FadeOut,
}: ModalProps) => {
  const theme = useTheme();

  return (
    <RNModal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <SafeView hideTop={false} style={styles.safeArea}>
        <TouchableWithoutFeedback onPress={onDismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                entering={entering}
                exiting={exiting}
                style={[
                  styles.modalContainer,
                  { backgroundColor: theme.colors.surface },
                  contentContainerStyle,
                ]}
              >
                {children}
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </SafeView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  modalContainer: {
    padding: 20,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flexShrink: 1,
  },
});
