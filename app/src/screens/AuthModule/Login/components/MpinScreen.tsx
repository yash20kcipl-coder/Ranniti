import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import toast from '../../../../utils/toast';
import { useLanguage } from '../../../../languages';
import { Button } from '../../../../components/Button';
import { FontFamily } from '../../../../utils/typography';
import { setupMpinAction } from '../../../../store/actions/auth';
import Storage, { STORAGE_KEYS } from '../../../../utils/storage';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialDesignIcons } from '../../../../components/MaterialDesignIcons';

interface MpinScreenProps {
  mode: 'setup' | 'verify';
  onSuccess: () => void;
  onResetMpin?: () => void;
  styles: any;
  theme: any;
}

export const MpinScreen: React.FC<MpinScreenProps> = ({
  mode,
  onSuccess,
  onResetMpin,
  styles,
  theme,
}) => {
  const { t } = useLanguage();
  const [pin, setPin] = useState('');
  const dispatch = useDispatch<any>();
  const [firstPin, setFirstPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'create' | 'confirm'>(mode === 'setup' ? 'create' : 'confirm');

  const handleKeyPress = (digit: string) => {
    if (loading) return;
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        handlePinComplete(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (loading) return;
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const handlePinComplete = async (completedPin: string) => {
    if (mode === 'setup') {
      if (step === 'create') {
        setFirstPin(completedPin);
        setPin('');
        setStep('confirm');
      } else {
        if (completedPin === firstPin) {
          dispatch(
            setupMpinAction(completedPin, setLoading, () => {
              onSuccess();
            })
          );
        } else {
          toast.error(t('mpinMismatch'));
          setPin('');
        }
      }
    } else {
      // Verify mode
      setLoading(true);
      const storedMpin = await Storage.get(STORAGE_KEYS.USER_MPIN);
      if (storedMpin === completedPin) {
        setLoading(false);
        onSuccess();
      } else {
        setLoading(false);
        toast.error(t('mpinVerifyError'));
        setPin('');
      }
    }
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.welcomeTitle}>
        {mode === 'setup'
          ? step === 'create'
            ? t('createMpinTitle')
            : t('confirmMpinTitle')
          : t('enterMpinTitle')}
      </Text>
      <Text style={styles.welcomeSub}>
        {mode === 'setup'
          ? step === 'create'
            ? t('createMpinSubtitle')
            : t('confirmMpinSubtitle')
          : t('enterMpinSubtitle')}
      </Text>

      {/* 4 Digit Indicators */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 16,
          marginVertical: 24,
          marginTop: 0,
        }}
      >
        {[0, 1, 2, 3].map((idx) => {
          const isFilled = pin.length > idx;
          return (
            <View
              key={idx}
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: isFilled ? theme.colors.primary : '#D1D5DB',
                backgroundColor: isFilled ? theme.colors.primary : 'transparent',
              }}
            />
          );
        })}
      </View>

      {/* Activity Indicator / Loader when verifying or setting up */}
      {loading && (
        <View style={{ marginVertical: 8, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      {/* Custom Keypad Layout */}
      <View style={{ gap: 12, marginBottom: 20, opacity: loading ? 0.5 : 1 }}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['', '0', 'delete'],
        ].map((row, rIdx) => (
          <View key={rIdx} style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {row.map((item, cIdx) => {
              if (item === '') {
                return <View key={cIdx} style={{ width: 68, height: 68 }} />;
              }
              if (item === 'delete') {
                return (
                  <TouchableOpacity
                    key={cIdx}
                    onPress={handleDelete}
                    activeOpacity={0.7}
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 34,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <MaterialDesignIcons name="backspace-outline" size={26} color={theme.colors.text} />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={cIdx}
                  onPress={() => handleKeyPress(item)}
                  activeOpacity={0.7}
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 34,
                    backgroundColor: theme.colors.card,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 24, fontFamily: FontFamily.bold, color: theme.colors.text }}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {mode === 'verify' && onResetMpin && (
        <TouchableOpacity
          onPress={onResetMpin}
          activeOpacity={0.7}
          style={{ alignSelf: 'center', marginTop: 12 }}
        >
          <Text style={{ fontSize: 14, color: theme.colors.primary, fontWeight: '600' }}>
            {t('forgotMpin')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
