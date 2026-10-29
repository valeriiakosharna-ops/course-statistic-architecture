import ukrainian from "../locales/uk.json";

export type Language = "en" | "uk";
export const LANGUAGE_KEY = "learningatlas.language";
const dictionary: Record<string, string> = ukrainian;
let language: Language = "en";
try {
  if (
    typeof localStorage !== "undefined" &&
    localStorage.getItem(LANGUAGE_KEY) === "uk"
  )
    language = "uk";
} catch {
  /* Browsing still works when storage is unavailable. */
}
const listeners = new Set<() => void>();
export const getLanguage = () => language;
export function subscribeLanguage(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function setLanguage(next: Language) {
  if (next === language) return;
  language = next;
  try {
    localStorage.setItem(LANGUAGE_KEY, next);
  } catch {
    /* Session-only preference. */
  }
  listeners.forEach((listener) => listener());
}
const normalize = (value: string) => value.trim().replace(/\s+/g, " ");
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const templates = Object.entries(dictionary)
  .filter(
    ([key]) =>
      /\$\{\d+\}/.test(key) &&
      /[a-zA-Z]{3}/.test(key.replace(/\$\{\d+\}/g, "")),
  )
  .sort(
    ([a], [b]) =>
      b.replace(/\$\{\d+\}/g, "").length - a.replace(/\$\{\d+\}/g, "").length,
  )
  .map(([key, value]) => ({
    expression: new RegExp(
      `^${key
        .split(/\$\{\d+\}/)
        .map(escape)
        .join("(.*?)")}$`,
    ),
    value,
  }));

export function translateText(
  value: string,
  locale: Language = language,
  depth = 0,
): string {
  if (locale === "en" || !value.trim() || depth > 5) return value;
  const text = normalize(value);
  let result = dictionary[text];
  if (result === undefined) {
    for (const template of templates) {
      const match = template.expression.exec(text);
      if (match) {
        result = template.value.replace(/\$\{(\d+)\}/g, (_, index) =>
          translateText(match[Number(index) + 1], locale, depth + 1),
        );
        break;
      }
    }
  }
  if (result === undefined) {
    const parts = text.split(/(\n| · | → | ↔ | \+ | \/ |: )/);
    if (parts.length > 1)
      result = parts
        .map((part, i) =>
          i % 2 ? part : translateText(part, locale, depth + 1),
        )
        .join("");
  }
  return result === undefined
    ? value
    : `${value.match(/^\s*/)?.[0] ?? ""}${result}${value.match(/\s*$/)?.[0] ?? ""}`;
}

export function searchableText(values: string[]): string {
  return values
    .flatMap((value) => [value, translateText(value, "uk")])
    .join(" ")
    .toLocaleLowerCase("uk");
}

/** Localize presentation only: route IDs, option values, callbacks and payloads stay intact. */
export function localizeProps(type: unknown, original: unknown) {
  if (
    !original ||
    typeof original !== "object" ||
    (typeof type !== "string" && typeof type !== "symbol")
  )
    return original;
  if (type === "pre") return original;
  const props: Record<string, unknown> = { ...original };
  if (
    type === "option" &&
    props.value === undefined &&
    typeof props.children === "string"
  )
    props.value = props.children;
  const translateChild = (child: unknown): unknown =>
    typeof child === "string"
      ? translateText(child)
      : Array.isArray(child)
        ? child.map(translateChild)
        : child;
  if ("children" in props) props.children = translateChild(props.children);
  for (const attribute of [
    "aria-label",
    "aria-valuetext",
    "title",
    "alt",
    "placeholder",
  ])
    if (typeof props[attribute] === "string")
      props[attribute] = translateText(props[attribute]);
  return props;
}
