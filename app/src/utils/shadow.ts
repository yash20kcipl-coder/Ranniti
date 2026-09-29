import { Platform, ViewStyle } from 'react-native';

export const getShadow = (
  elevation: number = 5,
  shadowColor: string = '#000000',
  shadowOpacity: number = 0.1
): ViewStyle => {
  if (Platform.OS === 'ios') {
    return {
      shadowColor,
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity,
      shadowRadius: elevation,
    };
  } else {
    return {
      elevation,
      shadowColor,
    };
  }
};
