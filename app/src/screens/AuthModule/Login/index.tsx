import { loginStyles } from './styles';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { ScrollView } from '../../../components';
import { Button } from '../../../components/Button';
import { GetUniqueId } from '../../../utils/device';
import { SCREENS } from '../../../navigation/constants';
import { SafeView } from '../../../components/SafeView';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { useNavigation } from '@react-navigation/native';
import { loginAction } from '../../../store/actions/auth';
import { createFcmToken } from '../../../utils/notification';
import PermissionsPopUp from '../../../components/Permissions';
import { AppTextInput } from '../../../components/AppTextInput';
import { View, Text, TouchableOpacity, Image } from 'react-native';
const RANNITI_LOGO = require('../../../assets/images/ranniti-logo.png');
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

const Login = ({ route }: any) => {
  const navigation = useNavigation();
  const dispatch = useDispatch<any>();
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const [password, setPassword] = useState("123456");
  const [identifier, setIdentifier] = useState('9876543210');
  const { theme, styles } = useAppTheme<ReturnType<typeof loginStyles>>(loginStyles);

  const requestUserPermission = async () => {
    await createFcmToken();
  };

  const handleLogin = async () => {
    if (!identifier || !password) return;

    setLoading(true);
    const deviceId = await GetUniqueId();
    const fcmResponse = await createFcmToken();
    dispatch(loginAction({
      phone: identifier, pass: password,
      fcmToken: fcmResponse?.token || '', deviceId,
    }, setLoading,));
  };

  return (
    <SafeView style={styles.container}>
      <ScrollView
        isKeyboardAware
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Hero Section */}
        <View style={styles.topSection}>
          {/* Decorative Glow Elements */}
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />
          <View style={styles.bgCircle3} />
          <View style={styles.bgCircle4} />
          <View style={styles.bgCircle5} />

          {/* Back Action Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialDesignIcons name="chevron-left" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Ranniti Logo Wrapper */}
          <View style={styles.logoCardInner}>
            <Image
              source={RANNITI_LOGO}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandSubtitle}>Political Campaign Platform</Text>
        </View>

        {/* Bottom Form Card */}
        <View style={styles.bottomSection}>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSub}>
            Please enter your phone number and password to login.
          </Text>

          <View style={styles.formContainer}>
            {/* Phone / Identifier Input */}
            <View style={[styles.formContainer, { gap: 5 }]}>
              <AppTextInput
                icon="phone"
                value={identifier}
                label="Phone Number"
                autoCapitalize="none"
                keyboardType="phone-pad"
                onChangeText={setIdentifier}
                placeholder="Enter 10-digit mobile number"
              />

              {/* Password Input */}
              <AppTextInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                icon="lock"
                secureTextEntry={secureText}
                containerStyle={{ marginBottom: 0 }}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setSecureText(!secureText)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <MaterialDesignIcons
                      name={secureText ? 'eye' : 'eye-off'}
                      size={22}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                }
              />
            </View>

            {/* Forgot Password Button */}
            <TouchableOpacity
              style={styles.forgotBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(SCREENS.FORGOT_PASSWORD as never)}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Submit Action Button */}
            <Button
              title="Sign In"
              loading={loading}
              onPress={handleLogin}
              style={styles.loginBtn}
              disabled={!identifier || !password}
            />
          </View>

          {/* Footer Contact Support Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Need help logging in?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate(SCREENS.CONTACT_SUPPORT as never)}
              activeOpacity={0.7}
            >
              <Text style={styles.footerLink}>Contact Support</Text>
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
