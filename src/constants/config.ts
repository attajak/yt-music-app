export const CONFIG = {
  YOUTUBE_URL: "https://m.youtube.com",
  YOUTUBE_MUSIC_URL: "https://music.youtube.com",
  GOOGLE_LOGIN_URL:
    "https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fm.youtube.com",
  GOOGLE_MUSIC_LOGIN_URL:
    "https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fmusic.youtube.com",

  // Custom Mobile User Agent that bypasses Google's disallowed_useragent (WebView check)
  MOBILE_USER_AGENT:
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36",

  // Desktop User Agent for Desktop view
  DESKTOP_USER_AGENT:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",

  THEME: {
    background: "#0F0F0F",
    surface: "#1F1F1F",
    surfaceHover: "#2A2A2A",
    border: "#333333",
    primary: "#FF0000",
    primaryHover: "#CC0000",
    musicAccent: "#FF0033",
    text: "#FFFFFF",
    textSecondary: "#AAAAAA",
    badgeGreen: "#00E676",
    danger: "#FF4444",
  },
};
