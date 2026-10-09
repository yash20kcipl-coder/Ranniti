import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../../languages';
import { Button } from '../../../../components/Button';
import { AUTH_CONFIG } from '../../../../constants/authConfig';
import { OtpInput } from 'react-native-otp-entry';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialDesignIcons } from '../../../../components/MaterialDesignIcons';

interface OtpVerifySectionProps {
  mobile: string;
  loading: boolean;
  onVerify: (otp: string) => void;
  onResend: () => void;
  onBack: () => void;
  styles: any;
  theme: any;
}

export const OtpVerifySection: React.FC<OtpVerifySectionProps> = ({
  mobile,
  loading,
  onVerify,
  onResend,
  onBack,
  styles,
  theme,
}) => {
  const { t } = useLanguage();
  const [otp, setOtp] = useState(AUTH_CONFIG.IS_OTP_DEMO_MODE ? "1234" : "");
  const [timer, setTimer] = useState<number>(AUTH_CONFIG.OTP_RESEND_TIMEOUT_SEC);

  useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleResendClick = () => {
    if (timer > 0) return;
    setTimer(AUTH_CONFIG.OTP_RESEND_TIMEOUT_SEC);
    onResend();
  };

  return (
    <View style={styles.formContainer}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onBack}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 4 }}
      >
        <MaterialDesignIcons name="arrow-left" size={20} color={theme.colors.primary} />
        <Text style={{ fontSize: 14, color: theme.colors.primary, fontWeight: '600' }}>
          Change Phone Number ({mobile})
        </Text>
      </TouchableOpacity>

      <Text style={styles.welcomeTitle}>{t('enterOtpTitle')}</Text>
      <Text style={[styles.welcomeSub, { marginBottom: 10 }]}>
        {t('enterOtpSubtitle')} +91 {mobile}
      </Text>

      {/* Modern OTP Input Field with react-native-otp-entry */}
      <View style={{ marginBottom: 10 }}>
        <OtpInput
          numberOfDigits={4}
          focusColor={theme.colors.primary}
          focusStickBlinkingDuration={500}
          onTextChange={(code) => setOtp(code)}
          onFilled={(code) => onVerify(code)}
          theme={{
            containerStyle: { marginVertical: 12 },
            pinCodeContainerStyle: {
              width: 58,
              height: 58,
              borderRadius: 12,
              backgroundColor: theme.colors.card,
              borderColor: '#D1D5DB',
              borderWidth: 1.5,
            },
            pinCodeTextStyle: {
              fontSize: 22,
              fontWeight: '700',
              color: theme.colors.text,
            },
            focusStickStyle: {
              backgroundColor: theme.colors.primary,
            },
            focusedPinCodeContainerStyle: {
              borderColor: theme.colors.primary,
              borderWidth: 2,
            },
          }}
        />
      </View>

      {/* Resend OTP Section */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        {timer > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.primary + '12',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              gap: 6,
            }}
          >
            <MaterialDesignIcons name="clock-outline" size={16} color={theme.colors.primary} />
            <Text style={{ fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' }}>
              {t('resendOtpIn')}{' '}
              <Text style={{ fontWeight: '700', color: theme.colors.primary }}>
                {timer < 10 ? `0${timer}` : timer}s
              </Text>
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleResendClick}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.primary + '15',
              paddingHorizontal: 16,
              paddingVertical: 9,
              borderRadius: 20,
              gap: 6,
            }}
          >
            <MaterialDesignIcons name="refresh" size={18} color={theme.colors.primary} />
            <Text style={{ fontSize: 14, color: theme.colors.primary, fontWeight: '700' }}>
              {t('resendOtp')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Verify Button */}
      <Button
        title={t('verifyOtp')}
        loading={loading}
        onPress={() => onVerify(otp)}
        disabled={otp.length !== 4 || loading}
        style={styles.loginBtn}
      />
    </View>
  );
};
