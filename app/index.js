import 'react-native-gesture-handler';
import App from './App';
import { name as appName } from './app.json';
import { AppRegistry, LogBox } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

enableScreens(true);

configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
});

// Suppress known Reanimated v4.6.0 carousel dependency warning (Issue #953)
const originalWarn = console.warn;
console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('[Reanimated] dependencies should only be used in web implementation')) {
        return;
    }
    originalWarn(...args);
};

LogBox.ignoreAllLogs();

if (!__DEV__) {
    console.log = () => { };
    console.error = () => { };
    console.warn = () => { };
    console.info = () => { };
    console.debug = () => { };
}

AppRegistry.registerComponent(appName, () => App);
