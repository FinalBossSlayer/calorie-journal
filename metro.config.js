const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Drizzle migrations are bundled as .sql source files.
config.resolver.sourceExts.push('sql');
// The prebuilt SQLite database is bundled as an asset.
config.resolver.assetExts.push('db');

module.exports = withNativeWind(config, { input: './global.css' });
