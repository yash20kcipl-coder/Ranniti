import React from 'react';
import { SafeView } from './SafeView';
import { useTheme } from 'react-native-paper';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { StyleSheet, ViewStyle, Modal as RNModal, View, TouchableWithoutFeedback, Platform } from 'react-native';

interface ModalProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle | ViewStyle[];
  position?: 'center' | 'right';
  entering?: any;
  exiting?: any;
}

export const Modal = ({
  visible,
  onDismiss,
  children,
  contentContainerStyle,
  position = 'center',
  entering,
  exiting,
}: ModalProps) => {
  const theme = useTheme();
  const isRight = position === 'right';

  const defaultEntering = isRight ? SlideInRight.duration(300) : FadeIn;
  const defaultExiting = isRight ? SlideOutRight.duration(250) : FadeOut;

  return (
    <RNModal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <SafeView hideTop={false} style={styles.safeArea}>
        <View style={[styles.modalOverlay, isRight && styles.modalOverlayRight]}>
          <TouchableWithoutFeedback onPress={onDismiss}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <Animated.View
            entering={entering || defaultEntering}
            exiting={exiting || defaultExiting}
            style={[
              styles.modalContainer,
              isRight && styles.modalContainerRight,
              { backgroundColor: theme.colors.surface },
              contentContainerStyle,
            ]}
          >
            {children}
          </Animated.View>
        </View>
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
  modalOverlayRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
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
  modalContainerRight: {
    padding: 0,
    borderRadius: 0,
    height: '100%',
    shadowOffset: { width: -2, height: 0 },
    elevation: 10,
    flexShrink: 0,
  },
});

