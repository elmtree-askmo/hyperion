/**
 * Theme configuration for video components
 */

export const theme = {
  colors: {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    accent: '#FFE66D',
    background: '#1A1A2E',
    backgroundLight: '#16213E',
    text: '#FFFFFF',
    textSecondary: '#E0E0E0',
    textAccent: '#FFD369',
  },
  fonts: {
    primary: 'Noto Sans Thai, Inter, system-ui, sans-serif',
    heading: 'Sarabun, Inter, system-ui, sans-serif',
    monospace: 'JetBrains Mono, monospace',
  },
  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
    xxl: 64,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  shadows: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.1)',
    md: '0 4px 16px rgba(0, 0, 0, 0.2)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
};

// Preview configuration for Interactive Viewer (1:1 square for desktop viewing)
export const VIDEO_CONFIG = {
  width: 1024,
  height: 1024,
  fps: 30,
  durationInSeconds: 300, // 5 minutes
  aspectRatio: '1:1', // Square format for desktop preview
};

// Export configuration for MP4 files (9:16 vertical for mobile platforms)
export const EXPORT_VIDEO_CONFIG = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInSeconds: 300, // 5 minutes
  aspectRatio: '9:16', // Vertical format for TikTok, Instagram Reels, YouTube Shorts
};
