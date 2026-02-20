module.exports = {
  preset: "jest-expo",
  testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/"],
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native|react-native|@react-navigation|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|@solana/.*|@noble/.*)",
  ],
};
