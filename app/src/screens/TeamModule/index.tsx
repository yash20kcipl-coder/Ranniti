import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { fetchTeamMembersAction, addTeamMemberAction } from '../../store/actions/team';
import { useLanguage } from '../../languages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { teamStyles } from './styles';
import { SafeImage } from '../../components/SafeImage';
import { AppTextInput } from '../../components/AppTextInput';
import { Shield, UserPlus } from 'lucide-react-native';

export const AddTeamMemberScreen: React.FC = () => {
  const dispatch = useDispatch<any>();
  const { t } = useLanguage();
  const { theme, styles } = useAppTheme<ReturnType<typeof teamStyles>>(teamStyles);

  const { members } = useSelector((state: RootState) => state.team);
  const auth = useSelector((state: RootState) => state.auth);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ac_leader' | 'sub_leader' | 'supporter'>('sub_leader');
  const [assignedAc, setAssignedAc] = useState('Hawa Mahal Assembly');
  const [assignedBooth, setAssignedBooth] = useState('Booth #12');

  useEffect(() => {
    dispatch(fetchTeamMembersAction());
  }, [dispatch]);

  const handleAddMember = () => {
    if (!name || !mobile) return;
    dispatch(
      addTeamMemberAction(
        {
          name,
          mobile,
          email,
          role,
          assignedAc,
          assignedBooth,
        },
        () => {
          setIsAddModalOpen(false);
          setName('');
          setMobile('');
          setEmail('');
        }
      )
    );
  };

  const userRole = auth.role || 'pc_leader';
  const roleOptions = [
    ...(userRole === 'pc_leader' ? [{ label: t('acLeader'), value: 'ac_leader' as const }] : []),
    { label: t('subLeader'), value: 'sub_leader' as const },
    { label: t('supporter'), value: 'supporter' as const },
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listPadding}
        renderItem={({ item }: { item: any }) => (
          <View style={styles.card}>
            <SafeImage src={item.avatar} alt={item.name} style={styles.avatar} />
            <View style={styles.infoCol}>
              <View style={styles.roleBadge}>
                <Shield {...({ size: 12, color: '#1E40AF' } as any)} />
                <Text style={styles.roleText}>{item.roleLabel}</Text>
              </View>
              <Text style={styles.nameText}>{item.name}</Text>
              <Text style={styles.subText}>
                {item.mobile} • {item.email}
              </Text>
              <Text style={styles.areaText}>
                {item.assignedAc} ({item.assignedBooth})
              </Text>
            </View>
          </View>
        )}
      />

      {/* Floating Add Member FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setIsAddModalOpen(true)} activeOpacity={0.85}>
        <UserPlus {...({ size: 24, color: '#FFFFFF' } as any)} />
      </TouchableOpacity>

      {/* Add Team Member Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="slide" onRequestClose={() => setIsAddModalOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsAddModalOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('teamManagementTitle')}</Text>

            <AppTextInput
              label={t('fullName')}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Rahul Sharma"
            />

            <AppTextInput
              label={t('phoneNumber')}
              value={mobile}
              onChangeText={setMobile}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
            />

            {/* Role Selector Pills */}
            <Text style={styles.roleSelectLabel}>Select Role</Text>
            <View style={styles.roleRow}>
              {roleOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.rolePill, role === opt.value && styles.rolePillActive]}
                  onPress={() => setRole(opt.value)}
                >
                  <Text style={[styles.rolePillText, role === opt.value && styles.rolePillTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <AppTextInput
              label={t('assignedAc')}
              value={assignedAc}
              onChangeText={setAssignedAc}
              placeholder="Assigned Assembly Constituency"
            />

            <AppTextInput
              label={t('assignedBooth')}
              value={assignedBooth}
              onChangeText={setAssignedBooth}
              placeholder="Assigned Booth Number(s)"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddModalOpen(false)}>
                <Text style={styles.cancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddMember}>
                <Text style={styles.submitText}>{t('add')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default AddTeamMemberScreen;
