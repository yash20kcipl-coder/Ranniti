import React from 'react';
import { AppTextInput } from '../AppTextInput';
import { FormInputProps } from './types';

interface TextInputComponentProps extends FormInputProps {
  styles: any;
}

export const TextInput: React.FC<TextInputComponentProps> = ({
  types,
  value,
  placeholder,
  onChange,
  editable = true,
  error,
  styles,
  label: _label,
  ...rest
}) => {
  return (
    <AppTextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      editable={editable}
      multiline={types === 'textarea'}
      numberOfLines={types === 'textarea' ? undefined : undefined}
      inputStyle={types === 'textarea' ? styles.textareaInput : undefined}
      containerStyle={{ marginBottom: 0 }}
      error={error}
      {...rest}
    />
  );
};

export default TextInput;
