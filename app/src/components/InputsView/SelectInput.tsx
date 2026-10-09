import React, { useMemo } from 'react';
import { FormInputProps } from './types';
import { Theme } from '../../constants/theme';
import { AppDropdown, DropdownOption } from '../AppDropdown';

interface SelectInputComponentProps extends Partial<FormInputProps> {
  theme: Theme;
  styles: any;
  dropdownPosition?: 'auto' | 'top' | 'bottom';
  disabled?: boolean;
}

export const SelectInput: React.FC<SelectInputComponentProps> = ({
  value,
  placeholder,
  options = [],
  onChange,
  disabled,
  error,
  theme,
}) => {
  const dropdownOptions = useMemo<DropdownOption[]>(() => {
    return options.map((opt) => ({
      id: String(opt.value),
      label: opt.label,
    }));
  }, [options]);

  return (
    <AppDropdown
      placeholder={placeholder || 'Select option...'}
      value={value !== undefined && value !== null ? String(value) : ''}
      options={dropdownOptions}
      onSelect={(val) => onChange?.(val)}
      disabled={disabled}
      buttonStyle={
        error
          ? { borderColor: theme.colors.error, backgroundColor: theme.colors.surface }
          : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border || '#E2E8F0' }
      }
      containerStyle={{ marginBottom: 0 }}
      mode="modal"
      searchable={options.length > 8}
    />
  );
};

export default SelectInput;
