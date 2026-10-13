// src/features/marketplace/components/GradientHeader.tsx (do not remove this comment)
// src/features/marketplace/components/GradientHeader.tsx

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '../../../theme/typography';

import { Typography } from '../../../theme/typography';
import { Spacing } from '../../../theme/spacing';
import { useTheme } from '../../../theme/ThemeContext';
import { HEADER_HEIGHT } from '../constants/marketplace.constants';

import { SearchBar } from './SearchBar';
import { PrescriptionButton } from './PrescriptionButton';
import { CartButton } from './CartButton';
import { AddressDropdown } from './AddressDropdown';
import { useDeliveryLocation } from '../../../hooks/useDeliveryLocation';
import { useNotificationStore } from '../../../store/notificationStore';

// ── Constants ────────────────────────────────────────────────

const FADE_STRIP_HEIGHT = 28;

const LOGO = require('../../../../assets/images/cureliwhitenew.png');

// ── Props ─────────────────────────────────────────────────────

interface GradientHeaderProps {
  onPressSearch?: () => void;
  onPressPrescription?: () => void;
  onPressCart?: () => void;
  onPressNotifications?: () => void;
}

// ── Subcomponent: location pill ───────────────────────────────

interface LocationPillProps {
  isResolving: boolean;
  hasLocation: boolean;
  area: string;
  addressLine: string;
  source: string;
  dropdownVisible: boolean;
  onPress: () => void;
  onGradientText: string;
  onGradientTextMuted: string;
  onGradientTextSubtle: string;
  pillBg: string;
  pillBorder: string;
  locationGps: string;
  locationSaved: string;
  locationNone: string;
}

const LocationPill = React.memo(function LocationPill({
  isResolving,
  hasLocation,
  area,
  addressLine,
  source,
  dropdownVisible,
  onPress,
  onGradientText,
  onGradientTextMuted,
  onGradientTextSubtle,
  pillBg,
  pillBorder,
  locationGps,
  locationSaved,
  locationNone,
}: LocationPillProps) {
  const locationIcon =
    source === 'gps'
      ? 'navigate'
      : source === 'saved'
        ? 'location'
        : 'location-outline';

  const iconColor =
    source === 'gps'
      ? locationGps
      : source === 'saved'
        ? locationSaved
        : locationNone;

  const areaLabel = isResolving
    ? 'Detecting location…'
    : hasLocation
      ? area
      : 'Set delivery location';

  const lineLabel = isResolving
    ? 'Please wait…'
    : hasLocation
      ? addressLine
      : 'Tap to set your address';

  return (
    <TouchableOpacity
      style={[
        styles.locationPill,
        {
          backgroundColor: pillBg,
          borderColor: pillBorder,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={
        hasLocation
          ? `Delivering to ${area}. Tap to change.`
          : 'Set delivery location'
      }
      accessibilityState={{ expanded: dropdownVisible }}
    >
      <View style={styles.locationTextStack}>
        <View style={styles.locationAreaRow}>
          {isResolving ? (
            <ActivityIndicator size={11} color={onGradientTextMuted} />
          ) : (
            <Ionicons name={locationIcon} size={14} color={iconColor} />
          )}

          <Text
            style={[styles.locationAreaText, { color: onGradientText }]}
            numberOfLines={1}
          >
            {areaLabel}
          </Text>

          <Ionicons
            name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
            size={11}
            color={onGradientTextSubtle}
          />
        </View>

        <Text
          style={[styles.locationLineText, { color: onGradientTextSubtle }]}
          numberOfLines={1}
        >
          {lineLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// ── Main component ────────────────────────────────────────────

function GradientHeaderBase({
  onPressSearch,
  onPressPrescription,
  onPressCart,
  onPressNotifications, // kept in props so HomeScreen doesn't break
}: GradientHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { location, isResolving } = useDeliveryLocation();

  // ── Notification logic kept intact (used by other screens / future UI) ──
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);

  // Fetch unread count when header mounts
  React.useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Suppress unused-var warnings while bell UI is hidden
  void onPressNotifications;
  void unreadCount;

  const [dropdownVisible, setDropdownVisible] = useState(false);

  const hasLocation =
    location.source === 'gps' || location.source === 'saved';

  const toggleDropdown = useCallback(() => {
    setDropdownVisible((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setDropdownVisible(false);
  }, []);

  const h = colors.header;
  const gradientColors: [string, string] = [h.gradientFrom, h.gradientTo];

  return (
    <>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.gradient,
          {
            height: HEADER_HEIGHT + insets.top,
            paddingTop: insets.top,
          },
        ]}
      >
        {/* ── Top row ── */}
        <View style={styles.topRow}>
          <View style={styles.brand}>
            <Image
              source={LOGO}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="Cureli logo"
            />
            <Text style={[styles.wordmark, { color: h.onGradientText }]}>
              Cureli
            </Text>
          </View>

          {/*
            ── Notification bell (hidden for now) ──
            Kept here commented so we can re-enable it later without rewiring.

            {onPressNotifications && (
              <TouchableOpacity
                onPress={onPressNotifications}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                style={[
                  styles.bellButton,
                  {
                    backgroundColor: h.pillBg,
                    borderColor: h.pillBorder,
                  },
                ]}
              >
                <Ionicons
                  name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
                  size={19}
                  color={h.onGradientText}
                />
                {unreadCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>
                      {unreadCount > 99 ? '99+' : String(unreadCount)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          */}

          <LocationPill
            isResolving={isResolving}
            hasLocation={hasLocation}
            area={location.area}
            addressLine={location.addressLine}
            source={location.source}
            dropdownVisible={dropdownVisible}
            onPress={toggleDropdown}
            onGradientText={h.onGradientText}
            onGradientTextMuted={h.onGradientTextMuted}
            onGradientTextSubtle={h.onGradientTextSubtle}
            pillBg={h.pillBg}
            pillBorder={h.pillBorder}
            locationGps={h.locationGps}
            locationSaved={h.locationSaved}
            locationNone={h.locationNone}
          />
        </View>

        {/* ── Bottom row ── */}
        <View style={styles.searchRow}>
          <View style={styles.searchFlex}>
            <SearchBar onPress={onPressSearch} variant="header-tinted" />
          </View>

          <PrescriptionButton onPress={onPressPrescription} />
          {/* <CartButton onPress={onPressCart} /> */}
        </View>
      </LinearGradient>

      <View
        style={[
          styles.fadeStrip,
          {
            top: HEADER_HEIGHT + insets.top,
            height: FADE_STRIP_HEIGHT,
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[h.gradientTo, colors.background.trans]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.fadeStripGradient}
        />
      </View>

      <AddressDropdown visible={dropdownVisible} onClose={closeDropdown} />
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.base,
  },

  fadeStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
  },
  fadeStripGradient: {
    flex: 1,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  wordmark: {
    ...Typography.wordmark,
    fontSize: 40,
    lineHeight: Platform.OS === 'ios' ? 58 : 34,
    letterSpacing: -0.3,
    fontFamily:
      Platform.OS === 'ios'
        ? FontFamily.amulyaBold
        : FontFamily.amulya,
    ...(Platform.OS === 'android'
      ? { fontWeight: '800' as const }
      : {}),
  },

  // ── Bell button styles (kept for when we re-enable the bell) ──
  // bellButton: {
  //   width: 38,
  //   height: 38,
  //   borderRadius: 12,
  //   borderWidth: 1,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   position: 'relative',
  // },
  // bellBadge: {
  //   position: 'absolute',
  //   top: -3,
  //   right: -3,
  //   minWidth: 18,
  //   height: 18,
  //   borderRadius: 9,
  //   backgroundColor: '#FF3B30',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   paddingHorizontal: 4,
  //   borderWidth: 2,
  //   borderColor: '#FFFFFF',
  // },
  // bellBadgeText: {
  //   fontSize: 9.5,
  //   fontWeight: '800',
  //   color: '#FFFFFF',
  //   lineHeight: 12,
  //   textAlign: 'center',
  // },

  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '40%',
  },
  locationTextStack: {
    flex: 1,
    gap: 1,
  },
  locationAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    justifyContent: 'flex-end',
  },
  locationAreaText: {
    ...Typography.smallMedium,
    flexShrink: 1,
    textAlign: 'right',
  },
  locationLineText: {
    ...Typography.caption,
    textAlign: 'right',
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchFlex: {
    flex: 1,
  },
});

export { HEADER_HEIGHT };
export const GradientHeader = React.memo(GradientHeaderBase);

















// // src/features/marketplace/components/GradientHeader.tsx (do not remove this comment)
// // src/features/marketplace/components/GradientHeader.tsx

// import React, { useCallback, useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   Image,
//   Platform,
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { FontFamily, Typography } from '../../../theme/typography';
// import { Spacing } from '../../../theme/spacing';
// import { useTheme } from '../../../theme/ThemeContext';
// import { HEADER_HEIGHT } from '../constants/marketplace.constants';

// import { SearchBar } from './SearchBar';
// import { PrescriptionButton } from './PrescriptionButton';
// import { CartButton } from './CartButton';
// import { AddressDropdown } from './AddressDropdown';
// import { useDeliveryLocation } from '../../../hooks/useDeliveryLocation';
// import { useNotificationStore } from '../../../store/notificationStore';

// // ── Constants ────────────────────────────────────────────────

// const FADE_STRIP_HEIGHT = 28;

// const LOGO = require('../../../../assets/images/cureliwhitenew.png');

// // ── Props ─────────────────────────────────────────────────────

// interface GradientHeaderProps {
//   onPressSearch?: () => void;
//   onPressPrescription?: () => void;
//   onPressCart?: () => void;
//   onPressNotifications?: () => void;
// }

// // ── Subcomponent: Location Pill ───────────────────────────────

// interface LocationPillProps {
//   isResolving: boolean;
//   hasLocation: boolean;
//   area: string;
//   addressLine: string;
//   source: string;
//   dropdownVisible: boolean;
//   onPress: () => void;
//   onGradientText: string;
//   onGradientTextMuted: string;
//   onGradientTextSubtle: string;
//   pillBg: string;
//   pillBorder: string;
//   locationGps: string;
//   locationSaved: string;
//   locationNone: string;
// }

// const LocationPill = React.memo(function LocationPill({
//   isResolving,
//   hasLocation,
//   area,
//   addressLine,
//   source,
//   dropdownVisible,
//   onPress,
//   onGradientText,
//   onGradientTextMuted,
//   onGradientTextSubtle,
//   pillBg,
//   pillBorder,
//   locationGps,
//   locationSaved,
//   locationNone,
// }: LocationPillProps) {
//   const locationIcon =
//     source === 'gps'
//       ? 'navigate'
//       : source === 'saved'
//         ? 'location'
//         : 'location-outline';

//   const iconColor =
//     source === 'gps'
//       ? locationGps
//       : source === 'saved'
//         ? locationSaved
//         : locationNone;

//   const areaLabel = isResolving
//     ? 'Detecting location…'
//     : hasLocation
//       ? area
//       : 'Set location';

//   const lineLabel = isResolving
//     ? 'Please wait…'
//     : hasLocation
//       ? addressLine
//       : 'Tap to set address';

//   return (
//     <TouchableOpacity
//       style={[
//         styles.locationPill,
//         {
//           backgroundColor: pillBg,
//           borderColor: pillBorder,
//         },
//       ]}
//       onPress={onPress}
//       activeOpacity={0.75}
//       accessibilityRole="button"
//       accessibilityLabel={
//         hasLocation
//           ? `Delivering to ${area}. Tap to change.`
//           : 'Set delivery location'
//       }
//       accessibilityState={{ expanded: dropdownVisible }}
//     >
//       <View style={styles.locationTextStack}>
//         <View style={styles.locationAreaRow}>
//           {isResolving ? (
//             <ActivityIndicator size={11} color={onGradientTextMuted} />
//           ) : (
//             <Ionicons name={locationIcon} size={13} color={iconColor} />
//           )}

//           <Text
//             style={[styles.locationAreaText, { color: onGradientText }]}
//             numberOfLines={1}
//           >
//             {areaLabel}
//           </Text>

//           <Ionicons
//             name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
//             size={11}
//             color={onGradientTextSubtle}
//           />
//         </View>

//         <Text
//           style={[styles.locationLineText, { color: onGradientTextSubtle }]}
//           numberOfLines={1}
//         >
//           {lineLabel}
//         </Text>
//       </View>
//     </TouchableOpacity>
//   );
// });

// // ── Main Component ────────────────────────────────────────────

// function GradientHeaderBase({
//   onPressSearch,
//   onPressPrescription,
//   onPressCart,
//   onPressNotifications,
// }: GradientHeaderProps) {
//   const insets = useSafeAreaInsets();
//   const { colors } = useTheme();
//   const { location, isResolving } = useDeliveryLocation();

//   const unreadCount = useNotificationStore((s) => s.unreadCount);
//   const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);

//   // Fetch unread count when header mounts
//   React.useEffect(() => {
//     fetchUnreadCount();
//   }, [fetchUnreadCount]);

//   const [dropdownVisible, setDropdownVisible] = useState(false);

//   const hasLocation =
//     location.source === 'gps' || location.source === 'saved';

//   const toggleDropdown = useCallback(() => {
//     setDropdownVisible((prev) => !prev);
//   }, []);

//   const closeDropdown = useCallback(() => {
//     setDropdownVisible(false);
//   }, []);

//   const h = colors.header;
//   const gradientColors: [string, string] = [h.gradientFrom, h.gradientTo];

//   return (
//     <>
//       <LinearGradient
//         colors={gradientColors}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 0, y: 1 }}
//         style={[
//           styles.gradient,
//           {
//             height: HEADER_HEIGHT + insets.top,
//             paddingTop: insets.top,
//           },
//         ]}
//       >
//         {/* ── Top Row ── */}
//         <View style={styles.topRow}>
//           <View style={styles.brand}>
//             <Image
//               source={LOGO}
//               style={styles.logoImage}
//               resizeMode="contain"
//               accessibilityLabel="Cureli logo"
//             />
//             <Text style={[styles.wordmark, { color: h.onGradientText }]}>
//               Cureli
//             </Text>
//           </View>

//           <View style={styles.topRight}>
//             {onPressNotifications && (
//               <TouchableOpacity
//                 onPress={onPressNotifications}
//                 activeOpacity={0.7}
//                 accessibilityRole="button"
//                 accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
//                 style={[
//                   styles.bellButton,
//                   {
//                     backgroundColor: h.pillBg,
//                     borderColor: h.pillBorder,
//                   },
//                 ]}
//               >
//                 <Ionicons
//                   name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
//                   size={19}
//                   color={h.onGradientText}
//                 />
//                 {unreadCount > 0 && (
//                   <View style={styles.bellBadge}>
//                     <Text style={styles.bellBadgeText}>
//                       {unreadCount > 99 ? '99+' : String(unreadCount)}
//                     </Text>
//                   </View>
//                 )}
//               </TouchableOpacity>
//             )}

//             <LocationPill
//               isResolving={isResolving}
//               hasLocation={hasLocation}
//               area={location.area}
//               addressLine={location.addressLine}
//               source={location.source}
//               dropdownVisible={dropdownVisible}
//               onPress={toggleDropdown}
//               onGradientText={h.onGradientText}
//               onGradientTextMuted={h.onGradientTextMuted}
//               onGradientTextSubtle={h.onGradientTextSubtle}
//               pillBg={h.pillBg}
//               pillBorder={h.pillBorder}
//               locationGps={h.locationGps}
//               locationSaved={h.locationSaved}
//               locationNone={h.locationNone}
//             />
//           </View>
//         </View>

//         {/* ── Bottom Row ── */}
//         <View style={styles.searchRow}>
//           <View style={styles.searchFlex}>
//             <SearchBar onPress={onPressSearch} variant="header-tinted" />
//           </View>

//           <PrescriptionButton onPress={onPressPrescription} />
//           {/* {onPressCart && <CartButton onPress={onPressCart} />} */}
//         </View>
//       </LinearGradient>

//       {/* ── Subtle bottom gradient fade strip ── */}
//       <View
//         style={[
//           styles.fadeStrip,
//           {
//             top: HEADER_HEIGHT + insets.top,
//             height: FADE_STRIP_HEIGHT,
//           },
//         ]}
//         pointerEvents="none"
//       >
//         <LinearGradient
//           colors={[h.gradientTo, colors.background.trans]}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 0, y: 1 }}
//           style={styles.fadeStripGradient}
//         />
//       </View>

//       <AddressDropdown visible={dropdownVisible} onClose={closeDropdown} />
//     </>
//   );
// }

// // ── Styles ────────────────────────────────────────────────────

// const styles = StyleSheet.create({
//   gradient: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 100,
//     justifyContent: 'space-between',
//     paddingBottom: Spacing.sm + 4,
//     paddingHorizontal: Spacing.base,
//   },

//   fadeStrip: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     zIndex: 99,
//   },
//   fadeStripGradient: {
//     flex: 1,
//   },

//   // ── Top Bar ──
//   topRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginTop: Spacing.xs,
//     minHeight: 48,
//   },
//   brand: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 2,
//     flexShrink: 0,
//   },
//   logoImage: {
//     width: 44,
//     height: 44,
//   },
//   wordmark: {
//     ...Typography.wordmark,
//     fontSize: 34,
//     lineHeight: Platform.OS === 'ios' ? 44 : 36,
//     letterSpacing: -0.4,
//     fontFamily:
//       Platform.OS === 'ios'
//         ? FontFamily.amulyaBold
//         : FontFamily.amulya,
//     ...(Platform.OS === 'android' ? { fontWeight: '800' as const } : {}),
//   },

//   topRight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     flexShrink: 1,
//     justifyContent: 'flex-end',
//   },

//   // ── Bell Button ──
//   bellButton: {
//     width: 38,
//     height: 38,
//     borderRadius: 12,
//     borderWidth: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     position: 'relative',
//   },
//   bellBadge: {
//     position: 'absolute',
//     top: -3,
//     right: -3,
//     minWidth: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: '#FF3B30',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 4,
//     borderWidth: 2,
//     borderColor: '#FFFFFF',
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 1.5 },
//         shadowOpacity: 0.25,
//         shadowRadius: 2,
//       },
//       android: {
//         elevation: 3,
//       },
//     }),
//   },
//   bellBadgeText: {
//     fontSize: 9.5,
//     fontWeight: '800',
//     color: '#FFFFFF',
//     lineHeight: 12,
//     textAlign: 'center',
//   },

//   // ── Location Pill ──
//   locationPill: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     borderWidth: 1,
//     borderRadius: 12,
//     paddingHorizontal: 9,
//     paddingVertical: 5,
//     flexShrink: 1,
//     maxWidth: 185,
//   },
//   locationTextStack: {
//     flex: 1,
//     justifyContent: 'center',
//     gap: 1,
//   },
//   locationAreaRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 3,
//     justifyContent: 'flex-end',
//   },
//   locationAreaText: {
//     ...Typography.smallMedium,
//     fontSize: 12,
//     fontWeight: '600',
//     flexShrink: 1,
//     textAlign: 'right',
//   },
//   locationLineText: {
//     ...Typography.caption,
//     fontSize: 10,
//     textAlign: 'right',
//   },

//   // ── Bottom Bar ──
//   searchRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: Spacing.sm,
//     marginTop: Spacing.xs,
//   },
//   searchFlex: {
//     flex: 1,
//   },
// });

// export { HEADER_HEIGHT };
// export const GradientHeader = React.memo(GradientHeaderBase);