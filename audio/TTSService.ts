// audio/TTSService.ts
// TypeScript resolver shim: let TS resolve, while Metro still picks .web / .native at runtime.
export * from "./TTSService.web";
export { default } from "./TTSService.web";
