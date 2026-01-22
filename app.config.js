// Load environment variables from .env file
require('dotenv').config();

module.exports = {
  expo: {
    name: "Plainly",
    slug: "plainly-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.plainly.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.plainly.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    scheme: "plainly",
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://dfkngfxkkgzuqfvewaal.supabase.co",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_0Z4LLdKqWobhp3twyIT4qQ_3NtfA5Jg",
      aiService: process.env.EXPO_PUBLIC_AI_SERVICE || "groq",
      groqApiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || undefined,
      minRelevanceThreshold: parseInt(process.env.EXPO_PUBLIC_MIN_RELEVANCE_THRESHOLD || "20", 10)
    }
  }
};
