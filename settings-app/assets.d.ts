// The popup's stylesheet is inlined as text by the build (scripts/build-settings.ts).
declare module '*.css' {
    const css: string;
    export default css;
}
