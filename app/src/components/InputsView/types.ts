import { StyleProp, ViewStyle, TextInputProps } from 'react-native';

export interface FormInputOption {
  label: string;
  value: any;
  icon?: string;
  color?: string;
  bg?: string;
}

export interface FormInputProps extends Omit<TextInputProps, 'onChange' | 'value'> {
  types: 'text' | 'textarea' | 'select' | 'date' | 'checkbox' | 'tabselection' | 'document' | 'attachments';
  label: string;
  value: any;
  placeholder?: string;
  options?: FormInputOption[];
  onChange: (value: any) => void;
  editable?: boolean;
  required?: boolean;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  mode?: 'single' | 'range';
  icon?: string;
  holidays?: any[];
}
