import { jsx as reactJsx, jsxs as reactJsxs } from "react/jsx-runtime";
import { localizeProps } from "./index";
export { Fragment } from "react/jsx-runtime";
export namespace JSX {
  export type Element = import("react").JSX.Element;
  export type ElementType = import("react").JSX.ElementType;
  export type IntrinsicElements = import("react").JSX.IntrinsicElements;
  export type IntrinsicAttributes = import("react").JSX.IntrinsicAttributes;
  export type ElementChildrenAttribute =
    import("react").JSX.ElementChildrenAttribute;
  export type ElementClass = import("react").JSX.ElementClass;
  export type LibraryManagedAttributes<C, P> =
    import("react").JSX.LibraryManagedAttributes<C, P>;
}
export const jsx: typeof reactJsx = (type, props, key) =>
  reactJsx(type, localizeProps(type, props), key);
export const jsxs: typeof reactJsxs = (type, props, key) =>
  reactJsxs(type, localizeProps(type, props), key);
