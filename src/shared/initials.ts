export const AVATAR_TINTS = ["gray", "brown", "orange", "yellow", "green", "blue", "purple", "pink", "red"] as const;

export type AvatarTint = (typeof AVATAR_TINTS)[number];

/**
 * Initials for an avatar: the first letter of the first and last word, read
 * from the local part when `name` looks like an email. First characters are
 * taken by code point so an emoji is never cut in half.
 */
export function initialsOf(name: string): string {
  const trimmed = name.trim().replace(/^@+/, "");
  const isEmail = trimmed.includes("@");
  const source = isEmail ? trimmed.slice(0, trimmed.indexOf("@")).split("+")[0] : trimmed;
  const parts = source.split(isEmail ? /[._\-\s]+/ : /\s+/).filter((part) => part.length > 0);

  if (parts.length === 0) return "?";
  const first = [...parts[0]][0] ?? "";
  const last = parts.length > 1 ? [...parts[parts.length - 1]][0] ?? "" : "";
  return (first + last).toUpperCase();
}

/**
 * A stable tint for a name: same person, same colour, whatever the spacing or
 * case. An empty name falls back to gray. The hash is fixed because avatars
 * must not change colour between releases.
 */
export function avatarTint(name: string): AvatarTint {
  const normalised = name.trim().toLowerCase();
  if (normalised.length === 0) return "gray";

  let hash = 0;
  for (const character of normalised) {
    hash = (Math.imul(hash, 31) + (character.codePointAt(0) ?? 0)) >>> 0;
  }

  return AVATAR_TINTS[hash % AVATAR_TINTS.length] ?? "gray";
}
