import { jsxDEV as reactJsxDEV } from "react/jsx-dev-runtime";
import { localizeProps } from "./index";
export { Fragment } from "react/jsx-dev-runtime";
export type { JSX } from "./jsx-runtime";
export const jsxDEV: typeof reactJsxDEV = (
  type,
  props,
  key,
  isStatic,
  source,
  self,
) => reactJsxDEV(type, localizeProps(type, props), key, isStatic, source, self);
