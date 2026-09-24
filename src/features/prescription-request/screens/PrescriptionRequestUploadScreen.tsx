// src/features/prescription-request/screens/PrescriptionRequestUploadScreen.tsx (do not remove this comment)
// src/features/prescription-request/screens/PrescriptionRequestUploadScreen.tsx
// Step 1 — Upload prescription or medicine photos + choose delivery address

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  UIManager,
  LayoutAnimation,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useDialog } from "../../../components/Dialog/DialogProvider";
import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import { usePrescriptionRequestStore } from "../../../store/prescriptionRequestStore";
import { prescriptionRequestApi } from "../api/prescriptionRequest.api";
import { useAddresses } from "../../profile/hooks/useAddresses";
import { AddressPickerSheet } from "../../cart/components/AddressPickerSheet";
import { useDeliveryLocationStore } from "../../../store/deliveryLocationStore";

// Enable layout animations on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Types ─────────────────────────────────────────────────────────────────────

type PendingAsset = {
  uri: string;
  fileName?: string;
  mimeType?: string;
};

// ── Animated Hero Illustration ────────────────────────────────────────────────
// Displays an animated dual-card visual (Prescription vs Medicine Pack) with a scan beam

function PrescriptionUploadHeroIllustration({ colors }: { colors: any }) {
  // Floating animations
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  // Pulse animation for "OR" badge
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Laser scan beam translation
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Floating card 1 (Prescription)
    const loopFloat1 = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: -6,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // 2. Floating card 2 (Medicine pack) - slightly delayed
    const loopFloat2 = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: -7,
          duration: 2100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 2100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // 3. Pulse "OR" badge
    const loopPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // 4. Scanning laser beam
    const loopScan = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    loopFloat1.start();
    loopFloat2.start();
    loopPulse.start();
    loopScan.start();

    return () => {
      loopFloat1.stop();
      loopFloat2.stop();
      loopPulse.stop();
      loopScan.stop();
    };
  }, [floatAnim1, floatAnim2, pulseAnim, scanAnim]);

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 116],
  });

  return (
    <View
      style={[
        styles.heroContainer,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.default,
        },
      ]}
    >
      {/* Background soft ambient gradient */}
      <LinearGradient
        colors={[
          colors.brand.primary + "12",
          colors.background.tint + "40",
          "transparent",
        ]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Visual stage with Prescription + OR + Medicine */}
      <View style={styles.heroVisualStage}>
        {/* Animated Laser Scan Beam */}
        <Animated.View
          style={[
            styles.scanBeam,
            {
              backgroundColor: colors.brand.primary,
              shadowColor: colors.brand.primary,
              transform: [{ translateY: scanTranslateY }],
            },
          ]}
        />

        {/* Card 1: Doctor Prescription */}
        <Animated.View
          style={[
            styles.heroVisualCard,
            {
              backgroundColor: colors.background.page,
              borderColor: colors.border.brand + "70",
              transform: [{ translateY: floatAnim1 }],
            },
          ]}
        >
          <View
            style={[
              styles.cardHeaderIcon,
              { backgroundColor: colors.brand.primary + "18" },
            ]}
          >
            <MaterialCommunityIcons
              name="file-document-edit-outline"
              size={22}
              color={colors.brand.primary}
            />
          </View>
          <View style={styles.cardLines}>
            <View
              style={[
                styles.cardLine,
                { width: "75%", backgroundColor: colors.brand.primary + "35" },
              ]}
            />
            <View
              style={[
                styles.cardLine,
                { width: "90%", backgroundColor: colors.border.default },
              ]}
            />
            <View
              style={[
                styles.cardLine,
                { width: "60%", backgroundColor: colors.border.default },
              ]}
            />
          </View>
          <View
            style={[
              styles.cardBadge,
              { backgroundColor: colors.brand.primary + "15" },
            ]}
          >
            <Text
              style={[styles.cardBadgeText, { color: colors.brand.primary }]}
            >
              Doctor Rx
            </Text>
          </View>
        </Animated.View>

        {/* Middle: OR Badge */}
        <Animated.View
          style={[
            styles.orCircle,
            {
              backgroundColor: colors.brand.primary,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Text style={styles.orText}>OR</Text>
        </Animated.View>

        {/* Card 2: Medicine Box / Blister Strip */}
        <Animated.View
          style={[
            styles.heroVisualCard,
            {
              backgroundColor: colors.background.page,
              borderColor: colors.status.infoBorder ?? (colors.brand.primary + "70"),
              transform: [{ translateY: floatAnim2 }],
            },
          ]}
        >
          <View
            style={[
              styles.cardHeaderIcon,
              { backgroundColor: "#0284C718" },
            ]}
          >
            <MaterialCommunityIcons
              name="pill-multiple"
              size={22}
              color="#0284C7"
            />
          </View>

          {/* Mini pill strip representation */}
          <View style={styles.stripGrid}>
            <View style={[styles.stripDot, { backgroundColor: "#0284C740" }]} />
            <View style={[styles.stripDot, { backgroundColor: "#0284C740" }]} />
            <View style={[styles.stripDot, { backgroundColor: "#0284C740" }]} />
            <View style={[styles.stripDot, { backgroundColor: "#0284C740" }]} />
          </View>

          <View
            style={[
              styles.cardBadge,
              { backgroundColor: "#0284C715" },
            ]}
          >
            <Text style={[styles.cardBadgeText, { color: "#0284C7" }]}>
              Medicine Strip
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Hero Headings */}
      <View style={styles.heroTextSection}>
        <Text style={[styles.heroHeading, { color: colors.text.primary }]}>
          Prescription or Medicine Photo
        </Text>
        <Text style={[styles.heroDescription, { color: colors.text.secondary }]}>
          Upload your <Text style={styles.heroHighlight}>doctor's prescription</Text> or simply snap a clear photo of the <Text style={styles.heroHighlight}>medicine box or strip</Text>.
        </Text>
      </View>

      {/* Feature Pills */}
      <View style={styles.featureChipsRow}>
        <View
          style={[
            styles.featureChip,
            { backgroundColor: colors.background.tint },
          ]}
        >
          <Ionicons
            name="camera-outline"
            size={13}
            color={colors.text.brand}
          />
          <Text
            style={[styles.featureChipText, { color: colors.text.brand }]}
          >
            Snap Strip/Box
          </Text>
        </View>

        <View
          style={[
            styles.featureChip,
            { backgroundColor: colors.background.tint },
          ]}
        >
          <Ionicons
            name="document-text-outline"
            size={13}
            color={colors.text.brand}
          />
          <Text
            style={[styles.featureChipText, { color: colors.text.brand }]}
          >
            Prescription / PDF
          </Text>
        </View>

        
      </View>
    </View>
  );
}

// ── PendingThumbnail ──────────────────────────────────────────────────────────

function PendingThumbnail({
  asset,
  colors,
}: {
  asset: PendingAsset;
  colors: any;
}) {
  const isPdf = asset.mimeType === "application/pdf";

  return (
    <View
      style={[
        styles.fileThumbnail,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.brand,
          borderStyle: "dashed",
        },
      ]}
    >
      {!isPdf ? (
        <Image
          source={{ uri: asset.uri }}
          style={[styles.thumbnailImage, { opacity: 0.3 }]}
          resizeMode="cover"
        />
      ) : (
        <MaterialIcons
          name="picture-as-pdf"
          size={28}
          color="#E53935"
          style={{ opacity: 0.3 }}
        />
      )}

      <View style={styles.pendingOverlay}>
        <ActivityIndicator size="small" color={colors.brand.primary} />
      </View>

      <Text
        style={[styles.fileName, { color: colors.text.faint }]}
        numberOfLines={1}
      >
        {asset.fileName ?? "Uploading…"}
      </Text>
    </View>
  );
}

// ── PrescriptionRequestUploadScreen ──────────────────────────────────────────

export function PrescriptionRequestUploadScreen() {
  const { colors } = useTheme();
  const { alert: showAlert } = useDialog();

  const {
    uploadedFiles,
    isUploading,
    uploadError,
    selectedAddressId,
    currentRequestId,
    addUploadedFile,
    removeUploadedFile,
    setUploading,
    setUploadError,
    setSelectedAddress,
    reset,
  } = usePrescriptionRequestStore();

  const { addresses } = useAddresses();
  const deliveryLocation = useDeliveryLocationStore((s) => s.location);

  const [addressSheetVisible, setAddressSheetVisible] = useState(false);
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([]);

  // ── Address resolution ──────────────────────────────────────────────────

  const effectiveAddressId =
    selectedAddressId ?? deliveryLocation.addressId ?? null;

  const resolvedAddress = effectiveAddressId
    ? addresses.find((a) => a.id === effectiveAddressId)
    : (addresses.find((a) => a.is_default) ?? addresses[0]);

  useEffect(() => {
    if (!selectedAddressId) {
      if (deliveryLocation.addressId) {
        setSelectedAddress(deliveryLocation.addressId);
      } else if (resolvedAddress) {
        setSelectedAddress(resolvedAddress.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddressSheetClose = useCallback(() => {
    setAddressSheetVisible(false);
    const newAddressId = useDeliveryLocationStore.getState().location.addressId;
    if (newAddressId) {
      setSelectedAddress(newAddressId);
    }
  }, [setSelectedAddress]);

  // ── Upload ──────────────────────────────────────────────────────────────

  const remainingSlots = 5 - uploadedFiles.length;
  const canUploadMore = remainingSlots > 0 && !isUploading;
  const canProceed =
    uploadedFiles.length > 0 && !!resolvedAddress && !isUploading;

  const handleUpload = useCallback(
    async (source: "gallery" | "camera" | "document") => {
      if (!canUploadMore) return;

      let assets: PendingAsset[] = [];

      if (source === "gallery") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          await showAlert({
            title: "Permission Required",
            message: "Please allow gallery access.",
            confirmLabel: "OK",
          });
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          selectionLimit: remainingSlots,
          quality: 0.85,
        });
        if (!result.canceled) {
          assets = result.assets.map((a) => ({
            uri: a.uri,
            fileName: a.fileName ?? undefined,
            mimeType: a.mimeType ?? undefined,
          }));
        }
      } else if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          await showAlert({
            title: "Permission Required",
            message: "Please allow camera access.",
            confirmLabel: "OK",
          });
          return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
        if (!result.canceled) {
          assets = result.assets.map((a) => ({
            uri: a.uri,
            fileName: a.fileName ?? undefined,
            mimeType: a.mimeType ?? undefined,
          }));
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["application/pdf", "image/*"],
          copyToCacheDirectory: true,
          multiple: remainingSlots > 1,
        });
        if (!result.canceled) {
          assets = result.assets.map((a) => ({
            uri: a.uri,
            fileName: a.name,
            mimeType: a.mimeType ?? "application/pdf",
          }));
        }
      }

      if (assets.length === 0) return;

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const slicedAssets = assets.slice(0, remainingSlots);
      setPendingAssets(slicedAssets);
      setUploading(true);
      setUploadError(null);

      try {
        for (const asset of slicedAssets) {
          const formData = new FormData();
          formData.append("files", {
            uri: asset.uri,
            name: asset.fileName ?? `prescription_${Date.now()}.jpg`,
            type: asset.mimeType ?? "image/jpeg",
          } as any);

          const res = await prescriptionRequestApi.uploadFiles(formData);
          const uploaded = res.data?.data?.files ?? [];

          for (const file of uploaded) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            addUploadedFile({ ...file, uri: asset.uri });
          }

          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setPendingAssets((prev) => prev.filter((p) => p.uri !== asset.uri));
        }
      } catch (err: any) {
        console.error("[PrescriptionUpload] Upload error:", {
          message: err?.message,
          response: err?.response?.data,
          status: err?.response?.status,
        });
        setPendingAssets([]);
        const msg =
          err?.response?.data?.message ?? "Upload failed. Please try again.";
        setUploadError(msg);
      } finally {
        setUploading(false);
        setPendingAssets([]);
      }
    },
    [
      canUploadMore,
      remainingSlots,
      addUploadedFile,
      setUploading,
      setUploadError,
      showAlert,
    ],
  );

  const handleRemoveFile = useCallback(
    (fileKey: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      removeUploadedFile(fileKey);
    },
    [removeUploadedFile]
  );

  const handleNext = useCallback(() => {
    if (!canProceed) return;
    if (resolvedAddress) setSelectedAddress(resolvedAddress.id);
    router.push("/prescription-request/pharmacies" as any);
  }, [canProceed, resolvedAddress, setSelectedAddress]);

  // ── Derived display values ──────────────────────────────────────────────

  const totalInFlight = uploadedFiles.length + pendingAssets.length;
  const showGrid = uploadedFiles.length > 0 || pendingAssets.length > 0;

  const gridSectionTitle = isUploading
    ? `Uploading… (${uploadedFiles.length} of ${totalInFlight})`
    : `Uploaded (${uploadedFiles.length}/5)`;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top"]}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background.card,
            borderBottomColor: colors.border.default,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Upload Prescription / Medicine
        </Text>
        <View style={styles.stepIndicator}>
          <Text style={[styles.stepText, { color: colors.text.muted }]}>
            1 of 2
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ── Active request banner ────────────────────────────────── */}
        {currentRequestId !== null && (
          <View
            style={[
              styles.banner,
              { backgroundColor: colors.status.successBg },
            ]}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color={colors.status.success}
            />
            <Text
              style={[
                styles.bannerText,
                { color: colors.text.primary, fontFamily: "Inter_400Regular" },
              ]}
            >
              You have an active request in progress.
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push(`/prescription-request/${currentRequestId}` as any)
              }
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.bannerCta,
                  { color: colors.brand.primary, fontFamily: "Inter_700Bold" },
                ]}
              >
                View
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={reset}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.text.faint}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Draft resume banner ──────────────────────────────────── */}
        {uploadedFiles.length > 0 && currentRequestId === null && (
          <View
            style={[
              styles.banner,
              {
                backgroundColor: colors.background.tint,
                borderColor: colors.border.brand,
                borderWidth: 1,
              },
            ]}
          >
            <Ionicons
              name="document-text-outline"
              size={16}
              color={colors.text.brand}
            />
            <Text
              style={[
                styles.bannerText,
                { color: colors.text.primary, fontFamily: "Inter_400Regular" },
              ]}
            >
              Draft resumed from your last visit.
            </Text>
            <TouchableOpacity onPress={reset} activeOpacity={0.7}>
              <Text
                style={[
                  styles.bannerCta,
                  {
                    color: colors.status.error,
                    fontFamily: "Inter_600SemiBold",
                  },
                ]}
              >
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Animated Illustration Hero Card ──────────────────────── */}
        <PrescriptionUploadHeroIllustration colors={colors} />

        {/* ── File grid (confirmed + pending) ──────────────────────── */}
        {showGrid && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              {gridSectionTitle}
            </Text>
            <View style={styles.fileGrid}>
              {/* Confirmed uploads */}
              {uploadedFiles.map((file) => (
                <View
                  key={file.file_key}
                  style={[
                    styles.fileThumbnail,
                    {
                      backgroundColor: colors.background.card,
                      borderColor: colors.border.default,
                    },
                  ]}
                >
                  {file.uri && file.mime_type !== "application/pdf" ? (
                    <Image
                      source={{ uri: file.uri }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <MaterialIcons
                      name="picture-as-pdf"
                      size={28}
                      color="#E53935"
                    />
                  )}
                  <Text
                    style={[styles.fileName, { color: colors.text.faint }]}
                    numberOfLines={1}
                  >
                    {file.original_name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveFile(file.file_key)}
                    style={styles.removeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.status.error}
                    />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Pending uploads */}
              {pendingAssets.map((asset) => (
                <PendingThumbnail
                  key={asset.uri}
                  asset={asset}
                  colors={colors}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Upload error ─────────────────────────────────────────── */}
        {uploadError && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.status.errorBg,
                borderColor: colors.status.errorBorder,
              },
            ]}
          >
            <Ionicons
              name="warning-outline"
              size={14}
              color={colors.status.error}
            />
            <Text style={[styles.errorText, { color: colors.status.error }]}>
              {uploadError}
            </Text>
          </View>
        )}

        {/* ── Upload options ───────────────────────────────────────── */}
        {canUploadMore && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              {uploadedFiles.length === 0
                ? "Add prescription or medicine photo"
                : `Add more (${remainingSlots} left)`}
            </Text>
            <View style={styles.uploadOptions}>
              {(
                [
                  {
                    icon: "camera-outline" as const,
                    label: "Camera",
                    source: "camera" as const,
                  },
                  {
                    icon: "images-outline" as const,
                    label: "Gallery",
                    source: "gallery" as const,
                  },
                  {
                    icon: "document-outline" as const,
                    label: "Document",
                    source: "document" as const,
                  },
                ] as const
              ).map((opt) => (
                <TouchableOpacity
                  key={opt.source}
                  onPress={() => handleUpload(opt.source)}
                  disabled={isUploading}
                  activeOpacity={0.75}
                  style={[
                    styles.uploadOption,
                    {
                      backgroundColor: colors.background.card,
                      borderColor: isUploading
                        ? colors.border.subtle
                        : colors.border.default,
                      opacity: isUploading ? 0.5 : 1,
                    },
                  ]}
                >
                  {isUploading ? (
                    <ActivityIndicator size={22} color={colors.text.brand} />
                  ) : (
                    <Ionicons
                      name={opt.icon}
                      size={22}
                      color={colors.text.brand}
                    />
                  )}
                  <Text
                    style={[
                      styles.uploadOptionLabel,
                      { color: colors.text.secondary },
                    ]}
                  >
                    {isUploading ? "Uploading…" : opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Delivery address ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Delivery address
          </Text>
          <TouchableOpacity
            onPress={() => setAddressSheetVisible(true)}
            activeOpacity={0.8}
            style={[
              styles.addressCard,
              {
                backgroundColor: colors.background.card,
                borderColor: resolvedAddress
                  ? colors.border.default
                  : colors.status.warning + "80",
              },
            ]}
          >
            <Ionicons
              name="location-outline"
              size={18}
              color={
                resolvedAddress ? colors.text.brand : colors.status.warning
              }
            />
            <View style={styles.addressText}>
              {resolvedAddress ? (
                <>
                  <Text
                    style={[
                      styles.addressLabel,
                      { color: colors.text.primary },
                    ]}
                  >
                    {resolvedAddress.label}
                  </Text>
                  <Text
                    style={[styles.addressLine, { color: colors.text.muted }]}
                    numberOfLines={1}
                  >
                    {resolvedAddress.address_line_1}, {resolvedAddress.city}
                  </Text>
                </>
              ) : (
                <Text
                  style={[
                    styles.addressLabel,
                    { color: colors.status.warning },
                  ]}
                >
                  Select delivery address
                </Text>
              )}
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.text.faint}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Next button ──────────────────────────────────────────────── */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background.card,
            borderTopColor: colors.border.subtle,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleNext}
          disabled={!canProceed}
          activeOpacity={0.85}
          style={[
            styles.nextBtn,
            {
              backgroundColor: canProceed
                ? colors.brand.primary
                : colors.background.tint,
            },
          ]}
        >
          <Text
            style={[
              styles.nextBtnText,
              { color: canProceed ? "#fff" : colors.text.faint },
            ]}
          >
            Next — Select Pharmacies
          </Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color={canProceed ? "#fff" : colors.text.faint}
          />
        </TouchableOpacity>
      </View>

      {/* ── Address picker sheet ─────────────────────────────────────── */}
      {addressSheetVisible && (
        <AddressPickerSheet
          visible={addressSheetVisible}
          onClose={handleAddressSheetClose}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  stepIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  stepText: { fontSize: 12, fontFamily: "Inter_500Medium" },

  content: { padding: Spacing.base, paddingBottom: 120, gap: Spacing.lg },

  // Banners
  banner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.xs,
  },
  bannerText: { flex: 1, fontSize: 13 },
  bannerCta: { fontSize: 13 },

  // Hero Animated Card
  heroContainer: {
    borderRadius: Radius.xl ?? 18,
    borderWidth: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.base,
    alignItems: "center",
    overflow: "hidden",
    gap: Spacing.md,
  },
  heroVisualStage: {
    width: "100%",
    height: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    gap: Spacing.md,
  },
  scanBeam: {
    position: "absolute",
    top: -5,
    left: "10%",
    right: "10%",
    height: 2,
    borderRadius: 1,
    opacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 10,
  },
  heroVisualCard: {
    width: 108,
    height: 104,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.xs,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.full ?? 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLines: {
    width: "100%",
    gap: 4,
    alignItems: "center",
  },
  cardLine: {
    height: 3,
    borderRadius: 2,
  },
  stripGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 36,
    gap: 4,
    justifyContent: "center",
  },
  stripDot: {
    width: 12,
    height: 6,
    borderRadius: 3,
  },
  cardBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
  },
  orCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 5,
  },
  orText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  heroTextSection: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.xs,
  },
  heroHeading: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  heroDescription: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  heroHighlight: {
    fontFamily: "Inter_600SemiBold",
  },
  featureChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: 2,
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full ?? 16,
  },
  featureChipText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },

  // Section
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  // File grid
  fileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  fileThumbnail: {
    width: 88,
    height: 100,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbnailImage: { width: "100%", height: 64 },
  fileName: {
    fontSize: 9,
    textAlign: "center",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  removeBtn: { position: "absolute", top: 2, right: 2 },

  // Pending thumbnail overlay
  pendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.45)",
  },

  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },

  // Upload options
  uploadOptions: { flexDirection: "row", gap: Spacing.sm },
  uploadOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  uploadOptionLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },

  // Address
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  addressText: { flex: 1 },
  addressLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  addressLine: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.md,
  },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});