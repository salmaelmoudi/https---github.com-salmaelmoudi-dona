// Run this script to fix your dependencies
const { execSync } = require('child_process');

console.log('Fixing Expo dependencies...');

try {
  // Fix all dependencies at once
  console.log('Running expo doctor --fix-dependencies');
  execSync('npx expo doctor --fix-dependencies', { stdio: 'inherit' });
  
  console.log('\nInstalling specific packages...');
  execSync('npx expo install expo-status-bar expo-image-picker expo-location react-native-maps react-native-safe-area-context react-native-screens @react-native-async-storage/async-storage', { stdio: 'inherit' });
  
  console.log('\nDependencies fixed successfully!');
} catch (error) {
  console.error('Error fixing dependencies:', error.message);
}