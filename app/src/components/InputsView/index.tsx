import React from 'react';
import { getStyles } from './styles';
import { View, Text } from 'react-native';
import { FontFamily } from '../../utils/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FormInputProps, FormInputOption } from './types';

// Import modular input components
import { TextInput } from './TextInput';
import { DateInput } from './DateInput';
import { SelectInput } from './SelectInput';
import { CheckboxInput } from './CheckboxInput';
import { DocumentInput } from './DocumentInput';
import { AttachmentsInput } from './AttachmentsInput';
import { TabSelectionInput } from './TabSelectionInput';

export type { FormInputProps, FormInputOption };

export const FormInput: React.FC<FormInputProps> = (props) => {
  const { types, label, required = false, error, containerStyle } = props;
  const { theme, styles } = useAppTheme(getStyles);

  const renderLabel = (style: any) => {
    return (
      <Text style={style}>
        {label}
        {required && (
          <Text style={{ color: theme.colors.error, fontFamily: FontFamily.bodyBold }}>
            {' *'}
          </Text>
        )}
      </Text>
    );
  };

  if (types === 'checkbox') {
    return (
      <View style={[styles.container, containerStyle]}>
        <CheckboxInput styles={styles} {...props} />
      </View>
    );
  }

  if (types === 'document') {
    return (
      <View style={[styles.container, { marginBottom: 0 }, containerStyle]}>
        <DocumentInput
          theme={theme}
          styles={styles}
          renderLabel={renderLabel}
          {...props}
        />
      </View>
    );
  }

  if (types === 'attachments') {
    return (
      <View style={[styles.container, { marginBottom: 0 }, containerStyle]}>
        <AttachmentsInput
          theme={theme}
          styles={styles}
          renderLabel={renderLabel}
          {...props}
        />
      </View>
    );
  }

  const renderInnerInput = () => {
    if (types === 'tabselection') {
      return <TabSelectionInput theme={theme} styles={styles} {...props} />;
    }
    if (types === 'select') {
      return <SelectInput theme={theme} styles={styles} {...props} />;
    }
    if (types === 'date') {
      return <DateInput theme={theme} styles={styles} {...props} />;
    }
    return null;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {types !== 'text' && types !== 'textarea' && (
        <>
          {label && renderLabel(styles.fieldLabel)}
          {renderInnerInput()}
        </>
      )}

      {(types === 'text' || types === 'textarea') && (
        <>
          {label && renderLabel(styles.fieldLabel)}
          <TextInput styles={styles} {...props} />
        </>
      )}

      {!!error && types !== 'text' && types !== 'textarea' && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

export default FormInput;
