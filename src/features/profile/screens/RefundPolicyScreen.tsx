// src/features/profile/screens/RefundPolicyScreen.tsx (do not remove this comment)
import React from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";

const LAST_UPDATED = "October 2026";

const SECTIONS = [
  {
    title: "1. Order Cancellation by Customer",
    body: "Customers may cancel an order through the Cureli application or by contacting Cureli Customer Support.\n\n" +
      "• Before Order Processing: If the customer cancels the order before the pharmacy/shop has started processing or preparing the order, it will be cancelled with no cancellation fee. For prepaid orders, the eligible amount will be refunded to the original payment method.\n\n" +
      "• After Order Processing but Before Dispatch: If the order has already been accepted and prepared by the pharmacy but has not yet been handed over for delivery, cancellation may be accepted depending on the status. Cureli may verify the cancellation request with the partner pharmacy.\n\n" +
      "• After Dispatch / Out for Delivery: Once the order has been handed over to the delivery partner, cancellation may not be possible. If the customer refuses delivery, refunds (if applicable) will be determined based on order status and applicable laws.",
  },
  {
    title: "2. Refund for Cancelled Orders",
    body: "For eligible prepaid orders, refunds will normally be initiated by Cureli within 2–5 business days after cancellation is approved. The actual time for the amount to appear in the customer’s account may depend on the bank, card issuer, UPI provider, or payment gateway. Refunds will be made to the original payment method.",
  },
  {
    title: "3. Medicines and Prescription Products",
    body: "Because medicines may be prescription-based and are subject to strict pharmaceutical regulations, cancellation and return eligibility depend heavily on the stage of order processing.\n\n" +
      "Once a medicine order has been dispatched or delivered, returns or refunds are restricted except where permitted or required by applicable law, including:\n" +
      "• Wrong product supplied\n" +
      "• Damaged or expired product received\n" +
      "• Product received in unacceptable condition\n" +
      "• Missing product/item\n" +
      "• Other verified fulfillment issues\n\n" +
      "Please report such issues to Customer Support as soon as possible after delivery.",
  },
  {
    title: "4. Non-Medicine Products",
    body: "For eligible non-medicine products such as pet-care or other healthcare products, returns/refunds may be accepted subject to the product category, condition of the product, and applicable return policy. Products must be unused, unopened, and in their original packaging.",
  },
  {
    title: "5. Orders Cancelled by Cureli or Partner Pharmacy",
    body: "Cureli or its pharmacy partners may cancel an order in circumstances such as product unavailability, verification issues with the prescription, pricing/inventory errors, delivery service unavailability, or other circumstances beyond reasonable control. For prepaid orders, a full refund will be automatically initiated to the original payment method.",
  },
  {
    title: "6. Refund Processing",
    body: "Once a refund is approved, Cureli will initiate the refund within the applicable processing period. The time taken for the refund to reflect in your account depends on your payment provider or financial institution.",
  },
  {
    title: "7. Customer Support",
    body: "For cancellation or refund assistance, customers can contact Cureli through:\n\n" +
      "• Email: info@cureliofficial.com\n" +
      "• In-App Support: Raise a ticket via Profile → Support & Tickets\n\n" +
      "Cureli will handle customer complaints and refund requests in accordance with applicable consumer protection and e-commerce regulations.",
  },
];

export function RefundPolicyScreen() {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top"]}
    >
      {/* Header */}
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
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="arrow-back"
            size={22}
            color={colors.text.primary}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text.primary, fontFamily: "Inter_700Bold" },
          ]}
        >
          Cancellation & Refund
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >


        {/* Sections */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text.primary, fontFamily: "Inter_700Bold" },
              ]}
            >
              {section.title}
            </Text>
            <Text
              style={[
                styles.sectionBody,
                { color: colors.text.secondary, fontFamily: "Inter_400Regular" },
              ]}
            >
              {section.body}
            </Text>
          </View>
        ))}

        {/* Footer */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background.tint,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          <Text
            style={[
              styles.footerText,
              { color: colors.text.muted, fontFamily: "Inter_400Regular" },
            ]}
          >
            © 2026 Cureli ORB Pvt. Ltd. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  headerTitle: { fontSize: 16 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  introCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  introText: { flex: 1, gap: 2 },
  introTitle: { fontSize: 15 },
  introSubtitle: { fontSize: 12 },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  noticeText: { fontSize: 12, flex: 1 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 14 },
  sectionBody: { fontSize: 13, lineHeight: 20 },
  footer: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 12,
  },
  footerText: { fontSize: 11, textAlign: "center" },
});