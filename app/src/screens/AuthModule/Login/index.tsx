import { loginStyles } from './styles';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { ScrollView } from '../../../components';
import { GetUniqueId } from '../../../utils/device';
import { Button } from '../../../components/Button';
import { useAuth } from '../../../context/AuthContext';
import { SafeView } from '../../../components/SafeView';
import { SCREENS } from '../../../navigation/constants';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { useNavigation } from '@react-navigation/native';
import { createFcmToken } from '../../../utils/notification';
import PermissionsPopUp from '../../../components/Permissions';
import { AppTextInput } from '../../../components/AppTextInput';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { staffLoginAction, parentLoginAction, studentLoginAction } from '../../../store/actions/auth';

import { APP_CONFIG, USER_MOCK_DATA, STUDENT_MOCK_DATA, PARENT_MOCK_DATA_MULTI } from '../../../core/config';

const LOGO = require('../../../assets/images/logo.png');

const Login = ({ route }: any) => {
  const { login } = useAuth();
  const role = route?.params?.role;
  const navigation = useNavigation();
  const dispatch = useDispatch<any>();
  const isStudent = role === 'student';
  const [loading, setLoading] = useState(false);
  const { theme, styles } = useAppTheme(loginStyles);
  const [secureText, setSecureText] = useState(true);
  const defaultUser: any = role === 'teacher' ? USER_MOCK_DATA : role === 'parent' ? PARENT_MOCK_DATA_MULTI : STUDENT_MOCK_DATA;

  const [identifier, setIdentifier] = useState(isStudent ? (defaultUser.admissionNo || '') : (defaultUser.email || ''));
  const [password, setPassword] = useState(defaultUser.password || '');

  const requestUserPermission = async () => { await createFcmToken() };

  const handleLogin = async () => {
    if (!identifier || !password) return;

    setLoading(true); // Immediate visual loading cue while obtaining system info
    const deviceId = await GetUniqueId();
    const fcmResponse = await createFcmToken();

    const basePayload = {
      password,
      deviceId,
      fcmToken: fcmResponse?.token || ""
    };

    const credentials = isStudent
      ? { ...basePayload, admissionNo: identifier }
      : { ...basePayload, email: identifier };

    const callback = async (token: string) => {
      await login(token, role);
    };

    if (role === 'teacher') {
      dispatch(staffLoginAction(credentials, setLoading, callback));
    } else if (role === 'parent') {
      dispatch(parentLoginAction(credentials, setLoading, callback));
    } else {
      dispatch(studentLoginAction(credentials, setLoading, callback));
    }
  };

  return (
    <SafeView style={styles.container}>
      <ScrollView
        isKeyboardAware
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topSection}>
          {/* Decorative BG Effects */}
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />
          <View style={styles.bgCircle3} />
          <View style={styles.bgCircle4} />
          <View style={styles.bgCircle5} />
          <View style={styles.bgCircle6} />

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialDesignIcons name="chevron-left" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.logoCircle}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </View>
        </View>

        <View style={styles.bottomSection}>

          <Text style={styles.welcomeTitle}>Sign In</Text>
          <Text style={styles.welcomeSub}>Please enter your details to login.</Text>

          <View style={styles.formContainer}>
            <AppTextInput
              label={isStudent ? "Admission Number" : "Email"}
              placeholder={isStudent ? "e.g. ADM2023001" : "name@example.com"}
              value={identifier}
              onChangeText={setIdentifier}
              icon={isStudent ? "card-account-details-outline" : "email-outline"}
              autoCapitalize="none"
              keyboardType={isStudent ? "default" : "email-address"}
            />

            <AppTextInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
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

            <TouchableOpacity
              style={styles.forgotBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(SCREENS.FORGOT_PASSWORD as never)}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              disabled={!identifier || !password}
              style={styles.loginBtn}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New here?</Text>
            <TouchableOpacity onPress={() => navigation.navigate(SCREENS.CONTACT_SUPPORT as never)}>
              <Text style={styles.footerLink}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <PermissionsPopUp
        type="notifications"
        onCheck={() => { requestUserPermission() }}
      />
    </SafeView>
  );
};

export default Login;
