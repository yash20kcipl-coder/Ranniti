module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: [
    "./node_modules/@react-native-documents/picker/jest/build/jest/setup.js",
    "./node_modules/@react-native-documents/viewer/jest/build/jest/setup.js"
  ]
};
