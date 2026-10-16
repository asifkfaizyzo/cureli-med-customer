// src/features/cart/components/PatientPickerSheet.tsx (do not remove this comment)
// src/features/cart/components/PatientPickerSheet.tsx

import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "../../../store/authStore";
import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";
import { useMembers } from "../../profile/hooks/useMembers";
import type { CheckoutPatient, UserSex } from "../../../types/auth";
import type { FamilyMember } from "../../../types/members";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

// ── Types ─────────────────────────────────────────────────────

interface PatientPickerSheetProps {
  visible: boolean;
  selectedPatient: CheckoutPatient | null;
  onSelect: (patient: CheckoutPatient) => void;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────

const SEX_LABEL: Record<UserSex, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function computeAge(dobStr: string): number {
  const dob = new Date(dobStr);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

// ── Single patient row ────────────────────────────────────────

function PatientRow({
  name,
  subtitle,
  isSelected,
  onSelect,
  onEdit,
  isSelf,
}: {
  name: string;
  subtitle: string;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  isSelf?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.75}
      style={[
        styles.patientRow,
        {
          backgroundColor: isSelected
            ? colors.background.tint
            : colors.background.card,
          borderColor: isSelected ? brandColor : colors.border.default,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${name}, ${subtitle}`}
    >
      {/* Visual Type Indicator */}
      <View
        style={[
          styles.patientIcon,
          {
            backgroundColor: isSelected
              ? hexToRgba(brandColor, 0.15)
              : colors.background.tint,
          },
        ]}
      >
        <Ionicons
          name={isSelf ? "person" : "people-outline"}
          size={18}
          color={isSelected ? brandColor : colors.text.muted}
        />
      </View>

      {/* Primary Details Block */}
      <View style={styles.patientText}>
        <Text
          style={[
            styles.patientLabel,
            {
              color: isSelected ? brandColor : colors.text.primary,
              fontFamily: "Inter_600SemiBold",
            },
          ]}
          numberOfLines={1}
        >
          {name}
          {isSelf ? (
            <Text
              style={[
                styles.selfBadge,
                { color: colors.text.faint, fontFamily: "Inter_400Regular" },
              ]}
            >
              {" "}(You)
            </Text>
          ) : null}
        </Text>
        <Text
          style={[
            styles.patientLine,
            { color: colors.text.muted, fontFamily: "Inter_400Regular" },
          ]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>

      {/* Micro-Minimal Top-Right Edit Pen Icon (members only) */}
      {onEdit ? (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          activeOpacity={0.5}
          style={styles.editButton}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          accessibilityLabel="Edit member"
        >
          <Ionicons
            name="create-outline"
            size={16}
            color={isSelected ? brandColor : colors.text.muted}
            style={{ opacity: isSelected ? 0.9 : 0.6 }}
          />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

// ── Sheet ─────────────────────────────────────────────────────

export function PatientPickerSheet({
  visible,
  selectedPatient,
  onSelect,
  onClose,
}: PatientPickerSheetProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const user = useAuthStore((s) => s.user);
  const { members, isLoading } = useMembers();

  // ── Build "Myself" patient from user ─────────────────────
  const myselfPatient: CheckoutPatient | null = (() => {
    if (!user?.full_name || !user?.date_of_birth || !user?.sex) return null;
    return {
      is_self: true,
      name: user.full_name,
      age: computeAge(user.date_of_birth),
      sex: user.sex,
    };
  })();

  // ── Build patient from family member ─────────────────────
  const memberToPatient = useCallback(
    (member: FamilyMember): CheckoutPatient => ({
      is_self: false,
      name: member.name,
      age: member.age,
      sex: member.sex,
    }),
    [],
  );

  // ── Check if a patient matches the selected one ───────────
  const isPatientSelected = useCallback(
    (patient: CheckoutPatient): boolean => {
      if (!selectedPatient) return false;
      return (
        patient.is_self === selectedPatient.is_self &&
        patient.name === selectedPatient.name
      );
    },
    [selectedPatient],
  );

  const handleSelectMyself = useCallback(() => {
    if (!myselfPatient) return;
    onSelect(myselfPatient);
    onClose();
  }, [myselfPatient, onSelect, onClose]);

  const handleSelectMember = useCallback(
    (member: FamilyMember) => {
      onSelect(memberToPatient(member));
      onClose();
    },
    [onSelect, onClose, memberToPatient],
  );

  const handleEditMember = useCallback(() => {
    onClose();
    setTimeout(() => {
      router.push("/profile/members" as any);
    }, 250);
  }, [onClose]);

  const handleAddMember = useCallback(() => {
    onClose();
    setTimeout(() => {
      router.push("/profile/members" as any);
    }, 250);
  }, [onClose]);

  // ── Content ───────────────────────────────────────────────
  const renderContent = () => {
    if (isLoading && !myselfPatient) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text
            style={[
              styles.centerText,
              { color: colors.text.muted, fontFamily: "Inter_400Regular" },
            ]}
          >
            Loading…
          </Text>
        </View>
      );
    }

    if (!myselfPatient && members.length === 0 && !isLoading) {
      return (
        <View style={styles.centerContent}>
          <MaterialIcons
            name="person-off"
            size={44}
            color={colors.text.faint}
          />
          <Text
            style={[
              styles.centerText,
              {
                color: colors.text.secondary,
                fontFamily: "Inter_600SemiBold",
              },
            ]}
          >
            No patients available
          </Text>
          <Text
            style={[
              styles.centerSub,
              { color: colors.text.muted, fontFamily: "Inter_400Regular" },
            ]}
          >
            Add a family member to continue
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      >
        {/* Myself */}
        {myselfPatient ? (
          <PatientRow
            name={myselfPatient.name}
            subtitle={`${SEX_LABEL[myselfPatient.sex]} · ${myselfPatient.age} yrs`}
            isSelected={isPatientSelected(myselfPatient)}
            onSelect={handleSelectMyself}
            isSelf
          />
        ) : null}

        {/* Loading members below myself */}
        {isLoading && myselfPatient ? (
          <View style={styles.inlineLoadingRow}>
            <ActivityIndicator size="small" color={brandColor} />
            <Text
              style={[
                styles.inlineLoadingText,
                { color: colors.text.muted, fontFamily: "Inter_400Regular" },
              ]}
            >
              Loading members…
            </Text>
          </View>
        ) : null}

        {/* Family members */}
        {!isLoading &&
          members.map((member) => {
            const patient = memberToPatient(member);
            return (
              <PatientRow
                key={member.id}
                name={member.name}
                subtitle={`${SEX_LABEL[member.sex]} · ${member.age} yrs`}
                isSelected={isPatientSelected(patient)}
                onSelect={() => handleSelectMember(member)}
                onEdit={handleEditMember}
              />
            );
          })}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* ── Backdrop ──────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
        accessibilityLabel="Close patient picker"
      />

      {/* ── Sheet ─────────────────────────────────────────── */}
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background.page,
            maxHeight: MAX_SHEET_HEIGHT,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* ── Drag handle ───────────────────────────────── */}
        <View style={styles.dragHandleRow}>
          <View
            style={[
              styles.dragHandle,
              { backgroundColor: colors.border.default },
            ]}
          />
        </View>

        {/* ── Header ────────────────────────────────────── */}
        <View
          style={[
            styles.sheetHeader,
            {
              borderBottomColor: colors.border.subtle,
            },
          ]}
        >
          <Text
            style={[
              styles.sheetTitle,
              { color: colors.text.primary, fontFamily: "Inter_700Bold" },
            ]}
          >
            Who is this for?
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={22} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* ── Patient list ─────────────────────────────── */}
        <View style={styles.contentArea}>{renderContent()}</View>

        {/* ── Add new member ──────────────────────────── */}
        <View
          style={[
            styles.addNewContainer,
            {
              borderTopColor: colors.border.subtle,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleAddMember}
            activeOpacity={0.75}
            style={[
              styles.addNewButton,
              {
                borderColor: brandColor,
                backgroundColor: colors.background.tint,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add family member"
          >
            <Ionicons name="person-add-outline" size={18} color={brandColor} />
            <Text
              style={[
                styles.addNewText,
                { color: brandColor, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              Add family member
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
  },
  dragHandleRow: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 17 },
  contentArea: {
    flexShrink: 1,
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  centerText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  centerSub: {
    fontSize: 13,
    textAlign: "center",
  },
  list: {
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },

  // ── Patient row ──
  patientRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 32, // defensive buffer space for absolute corner button
  },
  patientIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  patientText: {
    flex: 1,
    gap: 2,
  },
  patientLabel: { fontSize: 14 },
  selfBadge: { fontSize: 12 },
  patientLine: { fontSize: 12, lineHeight: 17 },
  editButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },

  // ── Inline loading (shown below "myself" while members load) ──
  inlineLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  inlineLoadingText: {
    fontSize: 13,
  },

  // ── Add new ──
  addNewContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  addNewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
  },
  addNewText: { fontSize: 14 },
});