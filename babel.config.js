module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    // Lets Drizzle's generated migrations import .sql files as strings.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
