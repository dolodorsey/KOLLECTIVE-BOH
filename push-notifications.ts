// ============================================================
// PUSH NOTIFICATIONS SETUP - Expo Notifications
// File: lib/push-notifications.ts
// ============================================================

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationToken {
  userId: string;
  token: string;
  device: {
    brand: string;
    modelName: string;
    osName: string;
    osVersion: string;
  };
}

/**
 * Register device for push notifications
 * Returns Expo push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  let token = null;

  // Check if physical device
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permissions not granted');
    return null;
  }

  // Get Expo push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-expo-project-id',
    });
    token = tokenData.data;
    console.log('✅ Expo Push Token:', token);
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }

  // Platform-specific configuration
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'KOLLECTIVE Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFD700',
      sound: 'default',
    });
  }

  return token;
}

/**
 * Save push token to Supabase
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  try {
    const deviceInfo = {
      brand: Device.brand || 'Unknown',
      modelName: Device.modelName || 'Unknown',
      osName: Device.osName || 'Unknown',
      osVersion: Device.osVersion || 'Unknown',
    };

    // Store in profiles or separate push_tokens table
    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        expo_push_token: token,
        device_info: deviceInfo,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,expo_push_token'
      });

    if (error) {
      console.error('Failed to save push token:', error);
      throw error;
    }

    console.log('✅ Push token saved to database');
  } catch (error) {
    console.error('Error saving push token:', error);
    throw error;
  }
}

/**
 * Remove push token (on logout)
 */
export async function removePushToken(userId: string, token: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .match({ user_id: userId, expo_push_token: token });

    if (error) throw error;
    console.log('✅ Push token removed');
  } catch (error) {
    console.error('Error removing push token:', error);
  }
}

/**
 * Send local notification (for testing)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: any
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
      badge: 1,
    },
    trigger: null, // Send immediately
  });
}

/**
 * Schedule notification for later
 */
export async function scheduleNotification(
  title: string,
  body: string,
  trigger: Date | number,
  data?: any
): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger:
      typeof trigger === 'number'
        ? { seconds: trigger }
        : { date: trigger },
  });

  return notificationId;
}

/**
 * Cancel scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Setup notification listeners
 * Call this in App.tsx or root component
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  // Listener for notifications received while app is foregrounded
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('📩 Notification received:', notification);
      onNotificationReceived?.(notification);
    }
  );

  // Listener for when user taps on notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('👆 Notification tapped:', response);
      onNotificationResponse?.(response);
    }
  );

  // Cleanup function
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

// ============================================================
// NOTIFICATION TYPES FOR KOLLECTIVE
// ============================================================

export enum NotificationType {
  // CASPER GROUP
  ORDER_RECEIVED = 'order_received',
  ORDER_READY = 'order_ready',
  RESERVATION_CONFIRMED = 'reservation_confirmed',
  INVENTORY_LOW = 'inventory_low',
  DAILY_SALES_REPORT = 'daily_sales_report',
  
  // HUGLIFE
  EVENT_REMINDER = 'event_reminder',
  TICKET_PURCHASE = 'ticket_purchase',
  VIP_UPGRADE = 'vip_upgrade',
  EVENT_CANCELLED = 'event_cancelled',
  
  // UMBRELLA GROUP
  SERVICE_REQUEST = 'service_request',
  SERVICE_COMPLETED = 'service_completed',
  LEAD_RECEIVED = 'lead_received',
  
  // SYSTEM
  WORKFLOW_FAILED = 'workflow_failed',
  TASK_ASSIGNED = 'task_assigned',
  ALERT_CRITICAL = 'alert_critical',
  TEAM_MESSAGE = 'team_message',
  
  // GENERAL
  BROADCAST = 'broadcast',
  ANNOUNCEMENT = 'announcement',
}

export interface KollectiveNotification {
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    entityId?: string;
    entityName?: string;
    actionUrl?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    [key: string]: any;
  };
}

/**
 * Send notification via backend (calls n8n or Supabase function)
 */
export async function sendKollectiveNotification(
  notification: KollectiveNotification,
  userIds: string[]
): Promise<void> {
  try {
    // Call Supabase Edge Function or n8n webhook
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        notification,
        userIds,
      },
    });

    if (error) throw error;
    console.log('✅ Notification sent to backend');
  } catch (error) {
    console.error('Failed to send notification:', error);
    throw error;
  }
}
