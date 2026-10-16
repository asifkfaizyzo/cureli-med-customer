// src/features/cart/components/RecommendationSection.tsx (do not remove this comment)
// src/features/cart/components/RecommendationSection.tsx

import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../../../theme/ThemeContext";
import { useCartStore } from "../../../store/cartStore";
import { useShopMedicines } from "../../marketplace/hooks/useShopMedicines";
import { ProductCard } from "../../marketplace/components/ProductCard";
import { RECOMMENDATIONS_LIMIT } from "../../../constants/config";

// EnrichedBranchMedicine extends EnrichedMedicine with listing fields.
// ProductCard expects EnrichedMedicine for its onPress prop.
// We widen the handler to accept EnrichedBranchMedicine (a subtype)
// and cast to satisfy ProductCard's narrower prop type.
import type { EnrichedBranchMedicine } from "../../marketplace/hooks/useShopMedicines";
import type { EnrichedMedicine } from "../../../types/medicine";

export function RecommendationSection() {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const items = useCartStore((s) => s.items);
  const cartPharmacy = useCartStore((s) => s.cartPharmacy);

  const pharmacy = cartPharmacy();

  const cartVariantIds = useMemo(
    () => new Set(items.map((i) => i.variantId)),
    [items],
  );

  // Primary category from first cart item that has one
  const primaryCategory = useMemo(() => {
    for (const item of items) {
      if (item.category) return item.category;
    }
    return null;
  }, [items]);

  // ── Fetch 1: same branch, any medicines ──────────────────
  // useShopMedicines does not support category filtering via its
  // current API (search param is free-text, not category).
  // We fetch the branch medicines and filter by category client-side.
  // This is acceptable at limit=6 — no extra network cost.
  const branchFetch = useShopMedicines(
    pharmacy?.shopId ?? "",
    pharmacy?.branchId ?? "",
    "",
    // Fetch more than we need so client-side category filter has enough
    // candidates to find 6 matches without a second request.
    RECOMMENDATIONS_LIMIT * 4,
  );

  // ── Derive final list ─────────────────────────────────────
  // Priority:
  //   1. Same branch + same category (client-side filtered)
  //   2. Same branch + any category  (fallback when category yields nothing)
  //   3. Empty → section hidden
  //
  // Cart items are always excluded from recommendations.
  const recommendations = useMemo(() => {
    const all = branchFetch.medicines.filter(
      (m) => !cartVariantIds.has(m.variantId),
    );

    if (primaryCategory) {
      const sameCategory = all.filter(
        (m) => m.category?.toLowerCase() === primaryCategory.toLowerCase(),
      );
      if (sameCategory.length > 0) {
        return sameCategory.slice(0, RECOMMENDATIONS_LIMIT);
      }
    }

    // Fallback: any medicine from same branch
    return all.slice(0, RECOMMENDATIONS_LIMIT);
  }, [branchFetch.medicines, cartVariantIds, primaryCategory]);

  const cardWidth = Math.floor((screenWidth - 48) / 2.4);

  // ProductCard.onPress expects (medicine: EnrichedMedicine) => void.
  // EnrichedBranchMedicine extends EnrichedMedicine, so the cast is safe.
  const handlePress = useCallback((medicine: EnrichedMedicine) => {
    router.push(`/product/${medicine.skuId}` as any);
  }, []);

  const keyExtractor = useCallback(
    (item: EnrichedBranchMedicine) => item.variantId,
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: EnrichedBranchMedicine }) => (
      <ProductCard
        medicine={item as EnrichedMedicine}
        width={cardWidth}
        onPress={handlePress}
      />
    ),
    [cardWidth, handlePress],
  );

  // Hide if no pharmacy context, still loading, or no results
  if (!pharmacy || branchFetch.isLoading || recommendations.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      {/* ── Section header with accent ── */}
      <View style={styles.headerWrap}>
        <View style={styles.headerLeft}>
          <View style={[styles.leftAccent, { backgroundColor: colors.brand.primary }]} />
          <View style={{ flex: 1 }}>
            
            <View style={styles.titleRow}>
              <View style={[styles.titleIconWrap, { backgroundColor: colors.background.tint }]}>
                <Ionicons name="storefront-outline" size={13} color={colors.brand.primary} />
              </View>
              <Text
                style={[styles.title, { color: colors.text.primary }]}
                numberOfLines={1}
              >
                Also available at{" "}
                <Text style={{ fontFamily: "Inter_700Bold" }}>
                  {pharmacy.shopName}
                </Text>
              </Text>
            </View>
          </View>
        </View>
        
      </View>

      <FlatList
        data={recommendations}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
  },
  headerWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  leftAccent: {
    width: 3,
    height: 32,
    borderRadius: 2,
    marginTop: 2,
  },
  microLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flex: 1,
  },
  titleIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  titleUnderline: {
    height: 2,
    borderRadius: 1,
    opacity: 0.08,
    marginTop: 8,
    marginLeft: 13,
  },
  rail: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 4,
  },
});