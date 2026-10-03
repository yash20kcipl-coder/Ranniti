import React from 'react';
import { FormInputProps } from './types';
import { Theme } from '../../constants/theme';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';
import { View, Pressable, Text } from 'react-native';
import { MaterialDesignIcons } from '../MaterialDesignIcons';

interface TabSelectionInputComponentProps extends FormInputProps {
  theme: Theme;
  styles: any;
}

export const TabSelectionInput: React.FC<TabSelectionInputComponentProps> = ({
  value,
  options,
  onChange,
  editable = true,
  theme,
  styles,
}) => {
  return (
    <View style={[
      { flexDirection: 'row', gap: 10, flexWrap: 'wrap', width: '100%' },
      !editable && styles.segmentContainerDisabled
    ]}>
      {options?.map((opt, idx) => {
        const isActive = value === opt.value;
        const activeColor = opt.color ? opt.color : theme.colors.primary;

        return (
          <Pressable
            key={idx}
            disabled={!editable}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 12,
              borderWidth: 1,
              backgroundColor: isActive ? activeColor + '12' : theme.colors.surface,
              borderColor: isActive ? activeColor : theme.colors.border,
            }}
            onPress={() => editable && onChange(opt.value)}
          >
            {opt.icon && (
              <MaterialDesignIcons
                name={opt.icon as any}
                size={16}
                color={isActive ? activeColor : theme.colors.textSecondary}
              />
            )}
            {opt.label && (
              <Text
                numberOfLines={1}
                style={[
                  styles.segmentLabel,
                  {
                    color: isActive ? activeColor : theme.colors.textSecondary,
                    fontFamily: isActive ? FontFamily.medium : FontFamily.body,
                    fontSize: rfValue(12.5),
                  }
                ]}
              >
                {opt.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

export default TabSelectionInput;
