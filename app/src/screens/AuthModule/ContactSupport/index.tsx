import React, { useEffect } from 'react';
import { contactSupportStyles } from './styles';
import { useLanguage } from '../../../languages';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { SafeView, ScrollView } from '../../../components';
import { fetchContactInfoAction } from '../../../store/actions/support';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { openEmailComposer, openPhoneDialer } from '../../../utils/linkingUtils';

const ContactSupport = () => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const { theme, styles } = useAppTheme<ReturnType<typeof contactSupportStyles>>(contactSupportStyles);

  const dispatch = useDispatch<any>();
  const { contactInfo, loading } = useSelector((state: any) => state.support);

  const email = contactInfo?.email || 'support@school.edu';
  const phone = contactInfo?.phone || '+1 (234) 567-890';

  useEffect(() => {
    dispatch(fetchContactInfoAction());
  }, [dispatch]);

  const handleEmail = () => {
    openEmailComposer(email, 'App Login Issue');
  };

  const handlePhone = () => {
    openPhoneDialer(phone);
  };

  return (
    <SafeView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
            onPress={() => navigation.goBack()}
          >
            <MaterialDesignIcons name="chevron-left" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.logoCircle}>
            <MaterialDesignIcons name="headset" size={56} color="#FFFFFF" />
          </View>
          <Text style={styles.brandName}>{t('supportTeam') || 'Support Team'}</Text>
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.welcomeTitle}>{t('contactUs') || 'Contact Us'}</Text>
          <Text style={styles.welcomeSub}>
            {t('contactSupportDesc') || 'Having trouble logging in or resetting your password? Get in touch with our team directly.'}
          </Text>

          <View style={styles.contactContainer}>
            <TouchableOpacity style={styles.contactCard} onPress={handleEmail} activeOpacity={0.7}>
              <View style={styles.iconContainer}>
                <MaterialDesignIcons name="email-outline" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.contactLabel}>{t('emailUs') || 'Email Us'}</Text>
              {loading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Text style={styles.contactValue}>{email}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactCard} onPress={handlePhone} activeOpacity={0.7}>
              <View style={styles.iconContainer}>
                <MaterialDesignIcons name="phone-outline" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.contactLabel}>{t('callUs') || 'Call Us'}</Text>
              {loading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Text style={styles.contactValue}>{phone}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeView>
  );
};

export default ContactSupport;
