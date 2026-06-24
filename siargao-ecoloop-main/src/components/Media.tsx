import produce from "@/assets/produce.jpg";
import compost from "@/assets/compost.jpg";
import restaurant from "@/assets/restaurant.jpg";

const map = { produce, compost, restaurant } as const;

export type MediaKey = keyof typeof map;

export function mediaSrc(key: MediaKey | undefined) {
  return key ? map[key] : undefined;
}
