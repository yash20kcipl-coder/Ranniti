import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { ScrollView } from './ScrollView';
import { CustomImage } from './CustomImage';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import React, { useState, useEffect } from 'react';
import { searchParentsAction } from '../store/actions/student';
import { MaterialDesignIcons } from './MaterialDesignIcons';

const { width } = Dimensions.get('window');

interface ParentAssociationModalProps {
  visible: boolean;
  onClose: () => void;
  onSkip: () => void;
  onSelectParent: (parent: any) => void;
}

export const ParentAssociationModal: React.FC<ParentAssociationModalProps> = ({
  visible,
  onClose,
  onSkip,
  onSelectParent,
}) => {
  const { theme, styles } = useAppTheme(createStyles);
  const [isLookupMode, setIsLookupMode] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Semantic color overrides that remain constant accent across themes
  const ACCENT_GREEN = theme.colors.primary;
  const ACCENT_BLUE = theme.colors.info;

  useEffect(() => {
    if (!visible) {
      setIsLookupMode(false);
      setQuery('');
      setResults([]);
    }
  }, [visible]);

  const dispatch = useDispatch<any>();

  useEffect(() => {
    if (!isLookupMode || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await dispatch(searchParentsAction(query));
        setResults(data || []);
      } catch (err) {
        console.error('Backend parent search intercept failed:', err);
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [query, isLookupMode, dispatch]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <ScrollView
        isKeyboardAware
        useThemeBackground={false}
        style={styles.scrollContainer}
        contentContainerStyle={styles.backdrop}
      >
        {/* Dynamic Particle Glow in Background top */}
        <View style={[styles.glowOrb, { backgroundColor: isLookupMode ? ACCENT_GREEN + '15' : ACCENT_BLUE + '10' }]} />

        <View style={styles.contentWrapper}>
          {!isLookupMode ? (
            <>
              <View style={styles.header}>
                <View style={[styles.mainIconContainer, { borderColor: ACCENT_GREEN + '40' }]}>
                  <View style={[styles.mainIconGlow, { backgroundColor: ACCENT_GREEN + '20' }]} />
                  <MaterialDesignIcons name="account-group" size={34} color={ACCENT_GREEN} />
                </View>
                <Text style={[styles.visionTitle, { fontFamily: FontFamily.extraBold }]}>
                  Parent Association
                </Text>
                <Text style={[styles.visionSubtitle, { fontFamily: FontFamily.medium }]}>
                  Is this student a sibling of an existing student, or is their parent already in our system?
                </Text>
              </View>

              <View style={styles.optionsGrid}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsLookupMode(true)}
                  style={styles.visionCard}
                >
                  <View style={[styles.visionIconBox, { backgroundColor: ACCENT_GREEN + '15' }]}>
                    <MaterialDesignIcons name="magnify" size={24} color={ACCENT_GREEN} />
                  </View>
                  <Text style={[styles.visionCardTitle, { fontFamily: FontFamily.extraBold }]}>
                    Yes, Parent Exists
                  </Text>
                  <Text style={[styles.visionCardDesc, { fontFamily: FontFamily.body }]}>
                    Search our system and auto-populate guardian data to keep the family unit together.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onSkip}
                  style={styles.visionCard}
                >
                  <View style={[styles.visionIconBox, { backgroundColor: ACCENT_BLUE + '15' }]}>
                    <MaterialDesignIcons name="account-outline" size={24} color={ACCENT_BLUE} />
                  </View>
                  <Text style={[styles.visionCardTitle, { fontFamily: FontFamily.extraBold }]}>
                    No, New Family
                  </Text>
                  <Text style={[styles.visionCardDesc, { fontFamily: FontFamily.body }]}>
                    Create a brand new parent footprint alongside the new student enrollment.
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeGhostBtn}>
                <Text style={[styles.closeGhostText, { fontFamily: FontFamily.medium }]}>Go Back</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.searchInterface}>
              <View style={styles.searchHeader}>
                <Text style={[styles.visionTitleSmall, { fontFamily: FontFamily.extraBold }]}>
                  Locate Existing Parent
                </Text>
                <Text style={[styles.visionSubtitleSmall, { fontFamily: FontFamily.medium }]}>
                  Enter parent's name or registered phone number
                </Text>
              </View>

              <View style={styles.searchGlassBox}>
                <MaterialDesignIcons name="magnify" size={22} color={theme.colors.textSecondary} />
                <TextInput
                  style={[styles.searchGlassInput, { fontFamily: FontFamily.medium }]}
                  placeholder="Search query..."
                  placeholderTextColor={theme.colors.textSecondary + '90'}
                  value={query}
                  onChangeText={setQuery}
                  autoFocus
                  selectionColor={ACCENT_GREEN}
                />
                {loading ? (
                  <ActivityIndicator size="small" color={ACCENT_GREEN} />
                ) : query.length > 0 ? (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <MaterialDesignIcons name="close-circle" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <FlatList
                data={results}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingVertical: 10 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onSelectParent(item)}
                    style={styles.resultGlassCard}
                  >
                    <CustomImage
                      uri={item.avatar}
                      placeholderType="avatar"
                      style={styles.resultAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resName, { fontFamily: FontFamily.heading }]}>{item.name}</Text>
                      <Text style={[styles.resMeta, { fontFamily: FontFamily.body }]}>{item.phone}</Text>
                    </View>
                    <View style={[styles.selectPill, { backgroundColor: ACCENT_GREEN + '15' }]}>
                      <Text style={[styles.selectPillText, { fontFamily: FontFamily.bodyBold, color: ACCENT_GREEN }]}>LINK</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={styles.emptySearchBox}>
                    <MaterialDesignIcons name="text-search" size={40} color={theme.colors.textSecondary + '40'} />
                    <Text style={[styles.emptySearchText, { fontFamily: FontFamily.body }]}>
                      {query.length < 2 ? 'Start typing to explore records...' : (loading ? 'Connecting to server...' : 'Found zero matches.')}
                    </Text>
                  </View>
                )}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsLookupMode(false)}
                style={styles.backActionBtn}
              >
                <MaterialDesignIcons name="arrow-left" size={16} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.backActionText, { fontFamily: FontFamily.medium }]}>Return to Pathways</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </Modal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backdrop: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOrb: {
    position: 'absolute',
    top: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.6,
    transform: [{ scale: 1.5 }],
  },
  contentWrapper: {
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  mainIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  mainIconGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  visionTitle: {
    fontSize: rfValue(26),
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  visionSubtitle: {
    fontSize: rfValue(13),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  optionsGrid: {
    width: '100%',
    gap: 16,
  },
  visionCard: {
    width: '100%',
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadowColor || '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  visionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  visionCardTitle: {
    fontSize: rfValue(18),
    color: theme.colors.text,
    marginBottom: 6,
  },
  visionCardDesc: {
    fontSize: rfValue(12),
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  closeGhostBtn: {
    marginTop: 30,
    padding: 10,
  },
  closeGhostText: {
    color: theme.colors.textSecondary,
    fontSize: rfValue(14),
    textDecorationLine: 'underline',
  },
  searchInterface: {
    width: '100%',
    height: '80%',
  },
  searchHeader: {
    marginBottom: 20,
  },
  visionTitleSmall: {
    fontSize: rfValue(22),
    color: theme.colors.text,
    marginBottom: 4,
  },
  visionSubtitleSmall: {
    fontSize: rfValue(13),
    color: theme.colors.textSecondary,
  },
  searchGlassBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    height: 54,
    marginBottom: 20,
  },
  searchGlassInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: rfValue(15),
    marginLeft: 10,
  },
  resultGlassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  resultAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 14,
  },
  resName: {
    color: theme.colors.text,
    fontSize: rfValue(15),
    marginBottom: 2,
  },
  resMeta: {
    color: theme.colors.textSecondary,
    fontSize: rfValue(12),
  },
  selectPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectPillText: {
    fontSize: rfValue(10),
    letterSpacing: 1,
  },
  emptySearchBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySearchText: {
    color: theme.colors.textSecondary,
    fontSize: rfValue(13),
    marginTop: 12,
  },
  backActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    marginTop: 10,
  },
  backActionText: {
    color: theme.colors.textSecondary,
    fontSize: rfValue(14),
  },
});
