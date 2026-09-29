import React from 'react';
import { Theme } from '../../constants/theme';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';

interface AccentedSectionProps {
  title: string;
  accentColor: string;
  children?: React.ReactNode;
  text?: string;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export const AccentedSection: React.FC<AccentedSectionProps> = ({
  title,
  accentColor,
  children,
  text,
  textStyle,
  containerStyle,
}) => {
  const { styles } = useAppTheme(getStyles);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Header with vertical accent bar */}
      <View style={styles.header}>
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Accented Card Body */}
      <View style={[styles.card, { backgroundColor: accentColor + '05', borderColor: accentColor + '15' }]}>
        {text ? (
          <Text style={[styles.text, textStyle]}>{text}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accentBar: {
    width: 4,
    height: 14,
    borderRadius: 2,
    marginRight: 8,
  },
  title: {
    fontSize: rfValue(11),
    fontFamily: FontFamily.extraBold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
  card: {
    flexGrow: 1,
    borderWidth: 1,
    padding: 18,
    borderRadius: 18,
  },
  text: {
    fontSize: rfValue(13),
    fontFamily: FontFamily.body,
    color: theme.colors.text,
  },
});
