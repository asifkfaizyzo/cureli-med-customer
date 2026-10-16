// src/features/cart/components/PatientSelectorCard.tsx (do not remove this comment)
// src/features/cart/components/PatientSelectorCard.tsx

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { Spacing } from '../../../theme/spacing';
import type { CheckoutPatient, UserSex } from '../../../types/auth';

const SEX_LABEL: Record<UserSex, string> = {
  MALE:   'Male',
  FEMALE: 'Female',
  OTHER:  'Other',
};

interface PatientSelectorCardProps {
  patient: CheckoutPatient | null;
  onPress: () => void;
}

export function PatientSelectorCard({
  patient,
  onPress,
}: PatientSelectorCardProps) {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const hasPatient = patient !== null;
  const accentColor = hasPatient ? colors.brand.primary : colors.status.warning;

  return (
    <View style={styles.cardOuter}>
      {/* ── Left accent bar (purple = selected, warning = needs selection) ── */}
      <View style={[styles.leftAccent, { backgroundColor: accentColor }]} />

      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.background.card,
            borderColor: hasPatient ? colors.border.subtle : colors.status.warningBorder,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.75}
        accessibilityLabel="Select who this order is for"
      >
        {/* ── Icon badge ── */}
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: hasPatient
                ? colors.background.tint
                : colors.status.warningBg,
            },
          ]}
        >
          <Ionicons
            name={hasPatient ? 'person' : 'person-add-outline'}
            size={18}
            color={hasPatient ? brandColor : colors.status.warning}
          />
        </View>

        {/* ── Content ── */}
        <View style={styles.content}>
          <Text style={[styles.microLabel, { color: accentColor }]}>
            PATIENT
          </Text>
          {hasPatient ? (
            <>
              <Text
                style={[styles.patientName, { color: colors.text.primary }]}
                numberOfLines={1}
              >
                {patient!.name}
                {patient!.is_self ? (
                  <Text style={[styles.selfTag, { color: colors.text.faint }]}>
                    {' '}(You)
                  </Text>
                ) : null}
              </Text>
              <Text style={[styles.meta, { color: colors.text.muted }]}>
                {SEX_LABEL[patient!.sex]} · {patient!.age} yrs
              </Text>
            </>
          ) : (
            <Text style={[styles.placeholder, { color: colors.status.warning }]}>
              Select who this is for
            </Text>
          )}
        </View>

        {/* ── Chevron ── */}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.text.faint}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Card shell with left accent ──
  cardOuter: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    shadowColor: '#090025',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  leftAccent: {
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    padding: 14,
    paddingLeft: 12,
    borderWidth: 1,
    gap: 12,
  },

  // ── Icon badge (rounded square, matching title icon pattern) ──
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // ── Content ──
  content: {
    flex: 1,
    gap: 1,
  },
  microLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  patientName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  selfTag: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  placeholder: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  meta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
});