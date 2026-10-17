import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const MEDIA_CHANNEL_ID = 'yt-media-playback-channel';
export const NOTIFICATION_ID = 'yt-dual-media-notification';

export const CATEGORY_PLAYING = 'yt-media-category-playing';
export const CATEGORY_PAUSED = 'yt-media-category-paused';

export const ACTION_PREV = 'ACTION_PREV';
export const ACTION_PLAY_PAUSE = 'ACTION_PLAY_PAUSE';
export const ACTION_NEXT = 'ACTION_NEXT';
export const ACTION_OPEN = 'ACTION_OPEN';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.LOW,
  }),
});

let isInitialized = false;

/**
 * Initializes notification channel (Android) and categories with action buttons
 */
export async function initMediaNotifications() {
  if (isInitialized) return;

  try {
    // 1. Request permission if needed
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return;
    }

    // 2. Setup Android Notification Channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(MEDIA_CHANNEL_ID, {
        name: 'Media Playback Controls',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: null,
        sound: undefined,
        enableLights: false,
        enableVibrate: false,
        showBadge: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    // 3. Register Action Categories: Playing state (showing Pause button)
    await Notifications.setNotificationCategoryAsync(CATEGORY_PLAYING, [
      {
        identifier: ACTION_PREV,
        buttonTitle: '⏮ Prev',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: ACTION_PLAY_PAUSE,
        buttonTitle: '⏸ Pause',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: ACTION_NEXT,
        buttonTitle: '⏭ Next',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: ACTION_OPEN,
        buttonTitle: '📱 Open',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    // 4. Register Action Categories: Paused state (showing Play button)
    await Notifications.setNotificationCategoryAsync(CATEGORY_PAUSED, [
      {
        identifier: ACTION_PREV,
        buttonTitle: '⏮ Prev',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: ACTION_PLAY_PAUSE,
        buttonTitle: '▶ Play',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: ACTION_NEXT,
        buttonTitle: '⏭ Next',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: ACTION_OPEN,
        buttonTitle: '📱 Open',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    isInitialized = true;
  } catch (err) {
    console.error('Failed to initialize media notifications:', err);
  }
}

interface MediaNotificationParams {
  title: string;
  artist?: string;
  isPlaying: boolean;
  tab: 'youtube' | 'music';
}

/**
 * Updates or shows the media control notification in the notification bar
 */
export async function updateMediaNotification({
  title,
  artist,
  isPlaying,
  tab,
}: MediaNotificationParams) {
  try {
    await initMediaNotifications();

    const displayTitle = title && title.trim().length > 0
      ? title.trim()
      : (tab === 'youtube' ? 'YouTube' : 'YouTube Music');

    const appName = tab === 'youtube' ? 'YouTube' : 'YouTube Music';
    const displayBody = artist && artist.trim().length > 0
      ? `${artist.trim()} • ${appName}`
      : `${isPlaying ? '▶ Playing' : '⏸ Paused'} • ${appName}`;

    const categoryIdentifier = isPlaying ? CATEGORY_PLAYING : CATEGORY_PAUSED;

    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: {
        title: displayTitle,
        body: displayBody,
        categoryIdentifier,
        data: { type: 'MEDIA_CONTROL', tab },
        sticky: isPlaying,
        autoDismiss: false,
        color: tab === 'youtube' ? '#FF0000' : '#FF0033',
        priority: Notifications.AndroidNotificationPriority.LOW,
      },
      trigger: null, // show immediately
    });
  } catch (err) {
    console.error('Error updating media notification:', err);
  }
}

/**
 * Dismisses the media notification
 */
export async function dismissMediaNotification() {
  try {
    await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
  } catch {
    // Ignore error if notification doesn't exist
  }
}

/**
 * Adds listener for notification action button presses
 */
export function setupMediaNotificationListener(
  onAction: (action: 'PREV' | 'PLAY_PAUSE' | 'NEXT' | 'OPEN') => void
) {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const actionId = response.actionIdentifier;
    if (actionId === ACTION_PREV) {
      onAction('PREV');
    } else if (actionId === ACTION_PLAY_PAUSE) {
      onAction('PLAY_PAUSE');
    } else if (actionId === ACTION_NEXT) {
      onAction('NEXT');
    } else if (actionId === ACTION_OPEN || actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      onAction('OPEN');
    }
  });

  return () => {
    subscription.remove();
  };
}
