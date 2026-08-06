import { createServerFn } from "@tanstack/react-start";
import type { HasilJana } from "./rakanmunsi.server";

export const janaPosRakanMunsi = createServerFn({ method: "POST" }).handler(
  async (): Promise<HasilJana> => {
    const { janaPosHarianRakanMunsi } = await import("./rakanmunsi.server");
    return janaPosHarianRakanMunsi(false);
  },
);
