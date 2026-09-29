import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { TextInput as PaperTextInput, TextInputProps as PaperTextInputProps } from 'react-native-paper';

interface CustomTextInputProps extends PaperTextInputProps {
  containerStyle?: ViewStyle;
}

export const TextInput = ({ containerStyle: _containerStyle, style, mode = 'outlined', ...props }: CustomTextInputProps) => {
  return (
    <PaperTextInput
      mode={mode}
      style={[styles.input, style]}
      outlineStyle={mode === 'outlined' ? styles.outline : undefined}
      {...props}
    />
  );
};

// Attach sub-components so <TextInput.Icon /> and <TextInput.Affix /> still work
TextInput.Icon = PaperTextInput.Icon;
TextInput.Affix = PaperTextInput.Affix;

const styles = StyleSheet.create({
  input: {
    marginBottom: 16,
  },
  outline: {
    borderRadius: 12,
  },
});
