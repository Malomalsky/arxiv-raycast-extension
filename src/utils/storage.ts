import { LocalStorage } from "@raycast/api";

const writes = new Map<string, Promise<void>>();

export async function readItems<T>(key: string): Promise<T[]> {
  const raw = await LocalStorage.getItem<string>(key);
  if (raw === undefined) return [];
  const items: unknown = JSON.parse(raw);
  if (!Array.isArray(items))
    throw new Error(
      `The saved ${key} data is invalid. It has not been changed.`,
    );
  return items as T[];
}

export function updateItems<T>(
  key: string,
  update: (items: T[]) => T[],
): Promise<void> {
  const pending = (writes.get(key) || Promise.resolve()).then(async () => {
    const items = await readItems<T>(key);
    await LocalStorage.setItem(key, JSON.stringify(update(items)));
  });
  writes.set(
    key,
    pending.catch(() => undefined),
  );
  return pending;
}
