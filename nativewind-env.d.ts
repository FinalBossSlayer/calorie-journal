/// <reference types="nativewind/types" />

// TypeScript 6 checks side-effect imports; lets `import '../global.css'` type-check.
declare module '*.css';
