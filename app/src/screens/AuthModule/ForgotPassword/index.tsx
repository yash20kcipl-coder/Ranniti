import React, { useState } from 'react';
import { forgotPasswordStyles } from './styles';
import { ScrollView } from '../../../components';
import { Button } from '../../../components/Button';
import { SafeView } from '../../../components/SafeView';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TouchableOpacity } from 'react-native';
import { AppTextInput } from '../../../components/AppTextInput';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

import toast from '../../../utils/toast';
import { useDispatch } from 'react-redux';
import { APP_CONFIG } from '../../../core/config';
import { forgotPasswordAction, resetPasswordAction } from '../../../store/actions/auth';

const ForgotPassword = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<any>();
  const [loading, setLoading] = useState(false);
  const { theme, styles } = useAppTheme<ReturnType<typeof forgotPasswordStyles>>(forgotPasswordStyles);

  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  const handleSendOTP = () => {
    if (!identifier) return;
    dispatch(forgotPasswordAction(identifier, setLoading, () => setStep(2)));
  };

  const handleResetPassword = () => {
    if (!otp || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    dispatch(resetPasswordAction(
      { identifier, otp, newPassword },
      setLoading,
      () => navigation.goBack()
    ));
  };

  return (
    <SafeView style={styles.container}>
      <ScrollView
        isKeyboardAware
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topSection}>
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />
          <View style={styles.bgCircle3} />
          <View style={styles.bgCircle4} />
          <View style={styles.bgCircle5} />
          <View style={styles.bgCircle6} />

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backButton}
            onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
          >
            <MaterialDesignIcons name="chevron-left" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.logoCircle}>
            <MaterialDesignIcons name={step === 1 ? "shield-key-outline" : "lock-reset"} size={56} color={theme.colors.primary} />
          </View>
          <Text style={styles.brandName}>{APP_CONFIG.schoolName?.replace(" International", "\nInternational")}</Text>
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.welcomeTitle}>{step === 1 ? "Forgot Password" : "Reset Password"}</Text>
          <Text style={styles.welcomeSub}>
            {step === 1
              ? "Enter your email or admission number to receive a verification code."
              : "Enter the verification code sent to your email and your new password."}
          </Text>

          <View style={styles.formContainer}>
            {step === 1 ? (
              <>
                <AppTextInput
                  label="Email / Admission Number"
                  placeholder="e.g. name@example.com"
                  value={identifier}
                  onChangeText={setIdentifier}
                  icon="email-outline"
                  autoCapitalize="none"
                  keyboardType="default"
                />

                <Button
                  title="Send Verification Code"
                  onPress={handleSendOTP}
                  loading={loading}
                  disabled={!identifier}
                  style={styles.submitBtn}
                />
              </>
            ) : (
              <>
                <AppTextInput
                  label="Verification Code (OTP)"
                  placeholder="e.g. 123456"
                  value={otp}
                  onChangeText={setOtp}
                  icon="message-processing-outline"
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <AppTextInput
                  label="New Password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  icon="lock-outline"
                  secureTextEntry={secureText}
                  rightIcon={
                    <TouchableOpacity onPress={() => setSecureText(!secureText)} hitSlop={15}>
                      <MaterialDesignIcons
                        name={secureText ? "eye" : "eye-off"}
                        size={22}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  }
                />

                <AppTextInput
                  label="Confirm Password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  icon="lock-check-outline"
                  secureTextEntry={secureText}
                  rightIcon={
                    <TouchableOpacity onPress={() => setSecureText(!secureText)} hitSlop={15}>
                      <MaterialDesignIcons
                        name={secureText ? "eye" : "eye-off"}
                        size={22}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  }
                />

                <Button
                  title="Update Password"
                  onPress={handleResetPassword}
                  loading={loading}
                  disabled={!otp || !newPassword || !confirmPassword || otp.length < 5}
                  style={styles.submitBtn}
                />
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeView>
  );
};

export default ForgotPassword;
