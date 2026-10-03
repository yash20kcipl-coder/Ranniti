import React, { useEffect } from 'react';
import { Pressable, View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { MaterialDesignIcons } from '../MaterialDesignIcons';
import { FormInputProps } from './types';

interface CheckboxInputComponentProps extends FormInputProps {
  styles: any;
}

export const CheckboxInput: React.FC<CheckboxInputComponentProps> = ({
  label,
  value,
  onChange,
  editable = true,
  styles,
}) => {
  const checkScale = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    checkScale.value = withSpring(value ? 1 : 0, { damping: 12 });
  }, [value, checkScale]);

  const handleCheckboxPress = () => {
    if (!editable) return;
    onChange(!value);
  };

  const checkboxIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: checkScale.value }],
    };
  });

  return (
    <Pressable style={styles.checkboxContainer} onPress={handleCheckboxPress}>
      <View style={[styles.checkboxBox, value && styles.checkboxActive]}>
        <Animated.View style={checkboxIconStyle}>
          <MaterialDesignIcons name="check" size={14} color="#FFFFFF" />
        </Animated.View>
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </Pressable>
  );
};

export default CheckboxInput;
