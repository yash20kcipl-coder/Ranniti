import React from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { MaterialDesignIcons } from './MaterialDesignIcons';
import { useAppTheme } from '../hooks/useAppTheme';
import { FontFamily } from '../utils/typography';
import { rfValue } from '../utils/responsive';

export interface NoDataProps {
  text?: string;
  description?: string;
  visible?: boolean;
  size?: number;
  icon?: string;
  image?: ImageSourcePropType;
  iconColor?: string;
}

const NoData: React.FC<NoDataProps> = ({
  text = "No Data Found",
  description = "",
  visible = true,
  size = 50, // Default icon size
  icon = "file-document-outline",
  image = undefined,
  iconColor = undefined,
}) => {
  const { theme } = useAppTheme();

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={[
        styles.iconContainer,
        {
          borderColor: iconColor ? `${iconColor}30` : `${theme.colors.primary}30`,
          backgroundColor: iconColor ? `${iconColor}14` : `${theme.colors.primary}14`,
        }
      ]}>
        {image ? (
          <Image source={image} style={{ width: size * 1.5, height: size * 1.5, resizeMode: 'contain' }} />
        ) : (
          <MaterialDesignIcons name={icon as any} size={size} color={iconColor || theme.colors.primary} />
        )}
      </View>
      <Text style={[styles.text, { color: theme.colors.text }]}>{text}</Text>
      {description ? (
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{description}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  text: {
    textAlign: "center",
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(16),
  },
  description: {
    marginTop: 5,
    textAlign: "center",
    fontFamily: FontFamily.body,
    fontSize: rfValue(14),
  },
});

export default NoData;
