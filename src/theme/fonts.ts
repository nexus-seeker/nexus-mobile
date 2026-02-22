import { useFonts } from 'expo-font';

export const FONT_FAMILY = {
  regular: 'Geist-Regular',
  medium: 'Geist-Medium',
  semibold: 'Geist-SemiBold',
  bold: 'Geist-Bold',
  mono: 'GeistMono-Regular',
} as const;

export function useAppFonts() {
  const [fontsLoaded, fontError] = useFonts({
    'Geist-Regular': require('../../assets/fonts/Geist-Regular.otf'),
    'Geist-Medium': require('../../assets/fonts/Geist-Medium.otf'),
    'Geist-SemiBold': require('../../assets/fonts/Geist-SemiBold.otf'),
    'Geist-Bold': require('../../assets/fonts/Geist-Bold.otf'),
    'GeistMono-Regular': require('../../assets/fonts/GeistMono-Regular.otf'),
  });

  return { fontsLoaded, fontError };
}
