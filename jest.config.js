module.exports = {
  preset: "jest-expo",
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/android/",
    "<rootDir>/ios/",
    "<rootDir>/.worktrees/",
  ],
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native|react-native|@react-navigation|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|@solana/.*|@noble/.*)",
  ],
};
