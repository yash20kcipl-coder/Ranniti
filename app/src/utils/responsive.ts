import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

export const rfValue = (size: number): number => {

  const widthRatio = SCREEN_WIDTH / BASE_WIDTH;
  const heightRatio = SCREEN_HEIGHT / BASE_HEIGHT;
  const scale = Math.min(widthRatio, heightRatio);
  const newSize = size * scale;

  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
};


export const scaleWidth = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
export const scaleHeight = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
