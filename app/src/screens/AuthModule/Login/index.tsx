import { loginStyles } from './styles';
import { useDispatch } from 'react-redux';
import { useLanguage } from '../../../languages';
import { ScrollView } from '../../../components';
import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/Button';
import { GetUniqueId } from '../../../utils/device';
import { MpinScreen } from './components/MpinScreen';
import { SCREENS } from '../../../navigation/constants';
import { SafeView } from '../../../components/SafeView';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { useNavigation } from '@react-navigation/native';
import { createFcmToken } from '../../../utils/notification';
import Storage, { STORAGE_KEYS } from '../../../utils/storage';
import PermissionsPopUp from '../../../components/Permissions';
import { AppTextInput } from '../../../components/AppTextInput';
import { OtpVerifySection } from './components/OtpVerifySection';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { navigateToDashboard } from '../../../navigation/navigationUtils';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { sendOtpAction, verifyOtpAction, verifyMpinAction, fetchProfileAndRoleAccessAction } from '../../../store/actions/auth';

const RANNITI_LOGO = require('../../../assets/images/ranniti-logo.png');

type StepState = 'phone' | 'otp' | 'mpin_setup' | 'mpin_verify';
type LoginMode = 'otp' | 'mpin';

const Login = () => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const dispatch = useDispatch<any>();
  const [loading, setLoading] = useState(false);
  const [mpinInput, setMpinInput] = useState('');
  const [step, setStep] = useState<StepState>('phone');
  const [identifier, setIdentifier] = useState('7990088388');
  const [loginMode, setLoginMode] = useState<LoginMode>('otp');
  const { theme, styles } = useAppTheme<ReturnType<typeof loginStyles>>(loginStyles);

  useEffect(() => {
    checkExistingMpinStatus();
  }, []);

  const checkExistingMpinStatus = async () => {
    try {
      const isMpinSet = await Storage.get(STORAGE_KEYS.IS_MPIN_SET);
      const storedToken = await Storage.get(STORAGE_KEYS.TOKEN);
      if (isMpinSet && storedToken) {
        setStep('mpin_verify');
      }
    } catch {
      // Default to phone
    }
  };

  const requestUserPermission = async () => {
    await createFcmToken();
  };

  const handleSendOtp = () => {
    if (!identifier || identifier.length < 10) return;
    dispatch(
      sendOtpAction(identifier, setLoading, () => {
        setStep('otp');
      })
    );
  };

  const handleVerifyOtp = async (otpCode: string) => {
    const deviceId = await GetUniqueId();
    const fcmResponse = await createFcmToken();

    dispatch(
      verifyOtpAction(
        {
          mobile: identifier,
          otp: otpCode,
          fcmToken: fcmResponse?.token || '',
          deviceId,
        },
        setLoading,
        async (user) => {
          const isMpinSet = await Storage.get(STORAGE_KEYS.IS_MPIN_SET);
          if (isMpinSet) {
            await dispatch(fetchProfileAndRoleAccessAction(true));
          } else {
            setStep('mpin_setup');
          }
        }
      )
    );
  };

  const handleMpinServerLogin = () => {
    if (!identifier || identifier.length < 10 || !mpinInput || mpinInput.length !== 4) return;
    dispatch(
      verifyMpinAction(
        {
          mobile: identifier,
          mpin: mpinInput,
        },
        setLoading,
        async () => {
          await dispatch(fetchProfileAndRoleAccessAction(true));
          handleMpinSuccess();
        }
      )
    );
  };

  const handleMpinSuccess = async () => {
    const storedRole = await Storage.get(STORAGE_KEYS.ROLE);
    await dispatch(fetchProfileAndRoleAccessAction(true));
    navigateToDashboard(storedRole || 'supporter');
  };

  const handleResetMpin = () => {
    setStep('phone');
    setLoginMode('otp');
  };

  return (
    <SafeView style={styles.container}>
      <ScrollView
        isKeyboardAware
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Hero Section */}
        <View style={styles.topSection}>
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />
          <View style={styles.bgCircle3} />
          <View style={styles.bgCircle4} />
          <View style={styles.bgCircle5} />

          {navigation.canGoBack() && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialDesignIcons name="chevron-left" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <View style={styles.logoCardInner}>
            <Image source={RANNITI_LOGO} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.brandSubtitle}>{t('politicalCampaignPlatform') || 'Political Campaign Platform'}</Text>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {step === 'phone' && (
            <View style={styles.formContainer}>
              {/* Option Selector: Login via OTP or MPIN */}
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: theme.colors.background,
                  borderRadius: 10,
                  padding: 4,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setLoginMode('otp')}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    backgroundColor: loginMode === 'otp' ? theme.colors.primary : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: loginMode === 'otp' ? '#FFFFFF' : theme.colors.textSecondary,
                    }}
                  >
                    {t('loginWithOtp')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setLoginMode('mpin')}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    backgroundColor: loginMode === 'mpin' ? theme.colors.primary : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: loginMode === 'mpin' ? '#FFFFFF' : theme.colors.textSecondary,
                    }}
                  >
                    {t('loginWithMpin')}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.welcomeTitle}>
                {loginMode === 'otp' ? t('otpLoginTitle') : t('enterMpinTitle')}
              </Text>
              <Text style={styles.welcomeSub}>
                {loginMode === 'otp' ? t('otpLoginSubtitle') : t('enterMpinSubtitle')}
              </Text>

              <AppTextInput
                icon="phone"
                value={identifier}
                label={t('phoneNumber')}
                autoCapitalize="none"
                keyboardType="phone-pad"
                maxLength={10}
                onChangeText={setIdentifier}
                placeholder={t('enterMobileNumber')}
              />

              {loginMode === 'mpin' && (
                <AppTextInput
                  icon="lock"
                  value={mpinInput}
                  label={t('enterMpinTitle')}
                  autoCapitalize="none"
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  onChangeText={setMpinInput}
                  placeholder={t('enterMpinPlaceholder')}
                />
              )}

              {loginMode === 'otp' ? (
                <Button
                  title={t('getOtp')}
                  loading={loading}
                  onPress={handleSendOtp}
                  style={styles.loginBtn}
                  disabled={!identifier || identifier.length < 10 || loading}
                />
              ) : (
                <Button
                  title={t('login')}
                  loading={loading}
                  onPress={handleMpinServerLogin}
                  style={styles.loginBtn}
                  disabled={!identifier || identifier.length < 10 || mpinInput.length !== 4 || loading}
                />
              )}
            </View>
          )}

          {step === 'otp' && (
            <OtpVerifySection
              mobile={identifier}
              loading={loading}
              onVerify={handleVerifyOtp}
              onResend={handleSendOtp}
              onBack={() => setStep('phone')}
              styles={styles}
              theme={theme}
            />
          )}

          {(step === 'mpin_setup' || step === 'mpin_verify') && (
            <MpinScreen
              mode={step === 'mpin_setup' ? 'setup' : 'verify'}
              onSuccess={handleMpinSuccess}
              onResetMpin={handleResetMpin}
              styles={styles}
              theme={theme}
            />
          )}

          {/* Footer Contact Support */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('needHelpLoggingIn') || 'Need help logging in?'}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate(SCREENS.CONTACT_SUPPORT as never)}
              activeOpacity={0.7}
            >
              <Text style={styles.footerLink}>{t('contactSupport') || 'Contact Support'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <PermissionsPopUp
        type="notifications"
        onCheck={() => {
          requestUserPermission();
        }}
      />
    </SafeView>
  );
};

export default Login;
