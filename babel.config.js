// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // @ エイリアス解決（TSだけでなくBabelにも必要）
      ['module-resolver', {
        root: ['.'],
        alias: { '@': './' },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      }],
      // Reanimated は必ず最後
      'react-native-reanimated/plugin',
    ],
  };
};
