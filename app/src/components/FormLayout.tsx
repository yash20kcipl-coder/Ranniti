import React from 'react';
import { Button } from './Button';
import { SafeView } from './SafeView';
import { AppHeader } from './AppHeader';
import { useAppTheme } from '../hooks/useAppTheme';
import { View, ScrollView, StyleSheet, StyleProp, ViewStyle } from 'react-native';

export interface FormButtonConfig {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  backgroundColor?: string;
  textColor?: string;
}

interface FormLayoutProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  children: React.ReactNode;
  buttons?: FormButtonConfig[];
  contentStyle?: StyleProp<ViewStyle>;
}

export const FormLayout: React.FC<FormLayoutProps> = ({
  title,
  showBack = true,
  onBack,
  children,
  buttons = [],
  contentStyle,
}) => {
  const { theme } = useAppTheme();

  return (
    <SafeView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader title={title} showBack={showBack} onBack={onBack} noShadow />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={[styles.content, contentStyle]}>
          {children}
        </View>
      </ScrollView>

      {/* Integrated Form Footer Action Row using the common Button component */}
      {buttons && buttons.length > 0 && (
        <View style={[styles.footerContainer, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          {buttons.map((btn, index) => (
            <Button
              key={index}
              title={btn.title}
              onPress={btn.onPress}
              loading={btn.loading}
              disabled={btn.disabled}
              variant={btn.variant || 'primary'}
              style={[
                styles.footerBtn,
                btn.backgroundColor ? { backgroundColor: btn.backgroundColor, borderColor: btn.backgroundColor } : undefined,
              ]}
              textStyle={btn.textColor ? { color: btn.textColor } : undefined}
            />
          ))}
        </View>
      )}
    </SafeView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 15,
  },
  footerContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
  },
});

export default FormLayout;
