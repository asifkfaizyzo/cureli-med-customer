// src/features/notifications/screens/NotificationsScreen.tsx

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '../../../theme/ThemeContext';
import { Spacing } from '../../../theme/spacing';
import { Radius } from '../../../theme/radius';

import {
  fetchInbox,
  markAsRead,
  markAllAsRead,
  type InboxNotification,
} from '../api/notifications.api';
import { NotificationCard } from '../components/NotificationCard';
import { handleNotificationTap } from '../../../utils/notificationTap';
import { useNotificationStore } from '../../../store/notificationStore';
import { useLayoutStore } from '../../../store/layoutStore';

// ── Category tab definitions ─────────────────────────────────────────────────

interface CategoryTab {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const CATEGORY_TABS: CategoryTab[] = [
  { key: 'all',                  label: 'All',           icon: 'notifications-none' },
  { key: 'order_updates',        label: 'Orders',        icon: 'local-shipping' },
  { key: 'promotions',           label: 'Offers',        icon: 'local-offer' },
  { key: 'prescription_updates', label: 'Prescriptions', icon: 'medication' },
  { key: 'system_messages',      label: 'System',        icon: 'info-outline' },
];

const PAGE_SIZE = 20;

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  category,
  colors,
}: {
  category: string;
  colors: any;
}) {
  const label =
    category === 'all'
      ? 'All caught up!'
      : `No ${category.replace(/_/g, ' ')} yet`;

  const subtitle =
    category === 'all'
      ? "You don't have any notifications right now.\nWe'll let you know when something comes up."
      : `When you receive ${category.replace(/_/g, ' ')} notifications,\nthey'll appear here.`;

  return (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconWrap,
          { backgroundColor: colors.background.tint },
        ]}
      >
        <Ionicons
          name="notifications-off-outline"
          size={40}
          color={colors.text.disabled}
        />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
        {label}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.text.muted }]}>
        {subtitle}
      </Text>
    </View>
  );
}

// ── Section header (date grouping) ───────────────────────────────────────────

function SectionDivider({
  label,
  colors,
}: {
  label: string;
  colors: any;
}) {
  return (
    <View style={styles.sectionDivider}>
      <Text style={[styles.sectionLabel, { color: colors.text.muted }]}>
        {label}
      </Text>
      <View style={[styles.sectionLine, { backgroundColor: colors.border.subtle }]} />
    </View>
  );
}

// ── Date grouping helper ─────────────────────────────────────────────────────

function getDateGroup(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  if (date >= todayStart) return 'Today';
  if (date >= yesterdayStart) return 'Yesterday';
  if (date >= weekStart) return 'This Week';
  return 'Earlier';
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;
  const bottomTabBarHeight = useLayoutStore((s) => s.bottomTabBarHeight);

  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const isLoadingRef = useRef(false);

  // ── Load notifications ─────────────────────────────────────────────────

  const loadNotifications = useCallback(
    async (pageNum: number, category: string, append: boolean) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;

      try {
        const result = await fetchInbox({
          page: pageNum,
          limit: PAGE_SIZE,
          category: category === 'all' ? undefined : category,
        });

        if (append) {
          setNotifications((prev) => [...prev, ...result.notifications]);
        } else {
          setNotifications(result.notifications);
        }

        setHasMore(result.pagination.has_more);
        setUnreadCount(result.unread_count);
      } catch (err) {
        console.error('[Notifications] Load failed:', err);
      } finally {
        isLoadingRef.current = false;
      }
    },
    [setUnreadCount],
  );

  // ── Initial load ───────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await loadNotifications(1, activeCategory, false);
      setIsLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Category change ────────────────────────────────────────────────────

  const handleCategoryChange = useCallback(
    async (category: string) => {
      if (category === activeCategory) return;

      setActiveCategory(category);
      setPage(1);
      setHasMore(true);
      setIsLoading(true);
      setNotifications([]);
      await loadNotifications(1, category, false);
      setIsLoading(false);
    },
    [activeCategory, loadNotifications],
  );

  // ── Pull to refresh ────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    await loadNotifications(1, activeCategory, false);
    setIsRefreshing(false);
  }, [activeCategory, loadNotifications]);

  // ── Infinite scroll ────────────────────────────────────────────────────

  const handleEndReached = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await loadNotifications(nextPage, activeCategory, true);
    setIsLoadingMore(false);
  }, [hasMore, isLoadingMore, isLoading, page, activeCategory, loadNotifications]);

  // ── Tap notification ───────────────────────────────────────────────────

  const handleNotificationPress = useCallback(
    async (notification: InboxNotification) => {
      if (!notification.is_read) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n,
          ),
        );

        markAsRead([notification.id])
          .then((result) => setUnreadCount(result.unread_count))
          .catch(() => {});
      }

      handleNotificationTap(notification.data);
    },
    [setUnreadCount],
  );

  // ── Mark all as read ───────────────────────────────────────────────────

  const handleMarkAllRead = useCallback(async () => {
    if (isMarkingAll) return;

    setIsMarkingAll(true);
    try {
      const result = await markAllAsRead();

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
          read_at: n.read_at ?? new Date().toISOString(),
        })),
      );
      setUnreadCount(result.unread_count);
    } catch (err) {
      console.error('[Notifications] Mark all read failed:', err);
    } finally {
      setIsMarkingAll(false);
    }
  }, [isMarkingAll, setUnreadCount]);

  // ── Derived state ──────────────────────────────────────────────────────

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ── Build list data with section dividers ──────────────────────────────

  type ListItem =
    | { type: 'notification'; data: InboxNotification }
    | { type: 'section'; label: string; id: string };

  const listData = React.useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];
    let lastGroup = '';

    for (const n of notifications) {
      const group = getDateGroup(n.created_at);
      if (group !== lastGroup) {
        items.push({ type: 'section', label: group, id: `section-${group}` });
        lastGroup = group;
      }
      items.push({ type: 'notification', data: n });
    }

    return items;
  }, [notifications]);

  // ── Render ─────────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'section') {
        return <SectionDivider label={item.label} colors={colors} />;
      }
      return (
        <NotificationCard
          notification={item.data}
          onPress={handleNotificationPress}
        />
      );
    },
    [colors, handleNotificationPress],
  );

  const renderFooter = () => {
    if (!isLoadingMore) return <View style={{ height: bottomTabBarHeight + 24 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={brandColor} />
        <View style={{ height: bottomTabBarHeight + 16 }} />
      </View>
    );
  };

  // ── Loading state ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={['top']}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background.card,
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                },
                android: { elevation: 3 },
              }),
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Notifications
          </Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={['top']}
    >
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background.card,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
              },
              android: { elevation: 3 },
            }),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.6}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View
              style={[styles.headerBadge, { backgroundColor: brandColor }]}
            >
              <Text style={styles.headerBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              disabled={isMarkingAll}
              activeOpacity={0.6}
              style={styles.markAllButton}
            >
              {isMarkingAll ? (
                <ActivityIndicator size="small" color={brandColor} />
              ) : (
                <MaterialIcons
                  name="done-all"
                  size={20}
                  color={brandColor}
                />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Category tabs ── */}
      <View
        style={[
          styles.tabsWrapper,
          {
            backgroundColor: colors.background.card,
            borderBottomColor: colors.border.subtle,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: isActive
                      ? brandColor
                      : colors.background.page,
                    borderColor: isActive
                      ? brandColor
                      : colors.border.default,
                  },
                ]}
                onPress={() => handleCategoryChange(tab.key)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={tab.icon}
                  size={14}
                  color={isActive ? '#ffffff' : colors.text.muted}
                  style={styles.tabIcon}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? '#ffffff' : colors.text.secondary,
                      fontFamily: isActive
                        ? 'Inter_600SemiBold'
                        : 'Inter_400Regular',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Notification list ── */}
      <FlatList
        data={listData}
        keyExtractor={(item) =>
          item.type === 'section' ? item.id : item.data.id
        }
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <EmptyState category={activeCategory} colors={colors} />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={brandColor}
            colors={[brandColor]}
            progressViewOffset={8}
          />
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Header ────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
  },
  headerBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    lineHeight: 14,
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },

  // ── Tabs ──────────────────────────────────────────────────────────────
  tabsWrapper: {
    borderBottomWidth: 1,
    paddingBottom: 2,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabIcon: {
    marginTop: 1,
  },
  tabLabel: {
    fontSize: 13,
    lineHeight: 18,
  },

  // ── List ──────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  listEmpty: {
    flexGrow: 1,
  },
  footerLoader: {
    paddingVertical: 12,
    alignItems: 'center',
  },

  // ── Section dividers ──────────────────────────────────────────────────
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sectionLine: {
    flex: 1,
    height: 1,
  },

  // ── Empty state ───────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 10,
    minHeight: 340,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});