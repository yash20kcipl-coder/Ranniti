import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import { addVoterAction, updateVoterAction } from '../../store/actions/voters';
import { useLanguage } from '../../languages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Theme } from '../../constants/theme';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';
import { AppTextInput } from '../../components/AppTextInput';
import { Button } from '../../components/Button';
import { ArrowLeft, User, Phone, MapPin, Award, Check } from 'lucide-react-native';
import toast from '../../utils/toast';

const GENDERS = ['Male', 'Female', 'Other'];
const POLITICAL_VIEWS = ['Favorable', 'Neutral', 'Unfavorable', 'Opposite', 'Pending'];
const PARTIES = ['Party A', 'Party B', 'Independent', 'Undecided'];

import { addEditVoterStyles } from './styles';

export const AddEditVoterScreen: React.FC<any> = ({ navigation, route }) => {
  const dispatch = useDispatch<any>();
  const { t } = useLanguage();
  const { styles } = useAppTheme<ReturnType<typeof addEditVoterStyles>>(addEditVoterStyles);

  const existingVoter = route?.params?.voter;
  const isEditing = Boolean(existingVoter);

  const [name, setName] = useState(existingVoter?.name || '');
  const [relativeName, setRelativeName] = useState(existingVoter?.relativeName || '');
  const [age, setAge] = useState(existingVoter?.age ? String(existingVoter.age) : '');
  const [gender, setGender] = useState(existingVoter?.gender || 'Male');
  const [epicNo, setEpicNo] = useState(existingVoter?.epicNo || '');
  const [mobile, setMobile] = useState(existingVoter?.mobile || '');
  const [pcName, setPcName] = useState(existingVoter?.pcName || 'Jaipur PC');
  const [acName, setAcName] = useState(existingVoter?.acName || 'Hawa Mahal AC');
  const [wardNo, setWardNo] = useState(existingVoter?.wardNo || 'Ward 14');
  const [boothNo, setBoothNo] = useState(existingVoter?.boothNo || 'Booth #12');
  const [address, setAddress] = useState(existingVoter?.address || '');
  const [supportingParty, setSupportingParty] = useState(existingVoter?.supportingParty || 'Party A');
  const [politicalView, setPoliticalView] = useState(existingVoter?.politicalView || 'Pending');

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter voter name');
      return;
    }

    const payload = {
      ...(isEditing ? { id: existingVoter.id } : {}),
      name,
      relativeName,
      age: parseInt(age, 10) || 18,
      gender: gender as any,
      epicNo,
      mobile,
      pcName,
      acName,
      wardNo,
      boothNo,
      address,
      supportingParty,
      politicalView: politicalView as any,
    };

    if (isEditing) {
      dispatch(updateVoterAction(payload, () => navigation.goBack()));
    } else {
      dispatch(addVoterAction(payload, () => navigation.goBack()));
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft {...({ size: 20, color: "#0F172A" } as any)} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Voter' : 'Add New Voter'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Personal Details Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal Details</Text>

          <AppTextInput
            label="Full Name *"
            placeholder="e.g. Ramesh Kumar Sharma"
            value={name}
            onChangeText={setName}
          />

          <AppTextInput
            label="Father / Husband Name"
            placeholder="e.g. Late Mohan Lal Sharma"
            value={relativeName}
            onChangeText={setRelativeName}
          />

          <View style={styles.row}>
            <View style={styles.flex1}>
              <AppTextInput
                label="Age"
                placeholder="e.g. 45"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />
            </View>

            <View style={styles.flex1}>
              <AppTextInput
                label="EPIC / Voter ID No"
                placeholder="e.g. RJ14829102"
                value={epicNo}
                onChangeText={setEpicNo}
              />
            </View>
          </View>

          {/* Gender Selector */}
          <Text style={styles.inputLabel}>Gender</Text>
          <View style={styles.pillRow}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.pill, gender === g && styles.activePill]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.pillText, gender === g && styles.activePillText]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <AppTextInput
            label="Mobile Number"
            placeholder="+9198290XXXXX"
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={setMobile}
          />
        </View>

        {/* Location & Booth Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Constituency & Booth Info</Text>

          <AppTextInput
            label="PC Name (Parliamentary)"
            placeholder="e.g. Jaipur PC"
            value={pcName}
            onChangeText={setPcName}
          />

          <AppTextInput
            label="AC Name (Assembly)"
            placeholder="e.g. Hawa Mahal AC"
            value={acName}
            onChangeText={setAcName}
          />

          <View style={styles.row}>
            <View style={styles.flex1}>
              <AppTextInput
                label="Ward No"
                placeholder="e.g. Ward 14"
                value={wardNo}
                onChangeText={setWardNo}
              />
            </View>

            <View style={styles.flex1}>
              <AppTextInput
                label="Booth No"
                placeholder="e.g. Booth #12"
                value={boothNo}
                onChangeText={setBoothNo}
              />
            </View>
          </View>

          <AppTextInput
            label="Address"
            placeholder="House/Street address"
            multiline
            numberOfLines={3}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Political Affinity Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Political Affinity</Text>

          {/* Supporting Party */}
          <Text style={styles.inputLabel}>Supporting Party</Text>
          <View style={styles.pillRow}>
            {PARTIES.map((party) => (
              <TouchableOpacity
                key={party}
                style={[styles.pill, supportingParty === party && styles.activePill]}
                onPress={() => setSupportingParty(party)}
              >
                <Text style={[styles.pillText, supportingParty === party && styles.activePillText]}>
                  {party}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Political View */}
          <Text style={styles.inputLabel}>Political View</Text>
          <View style={styles.pillRow}>
            {POLITICAL_VIEWS.map((view) => (
              <TouchableOpacity
                key={view}
                style={[styles.pill, politicalView === view && styles.activePill]}
                onPress={() => setPoliticalView(view)}
              >
                <Text style={[styles.pillText, politicalView === view && styles.activePillText]}>
                  {view}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title={isEditing ? 'Save Changes' : 'Save Voter'}
          onPress={handleSave}
          style={styles.saveBtn}
        />
      </ScrollView>
    </View>
  );
};

export default AddEditVoterScreen;
