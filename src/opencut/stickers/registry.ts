import type { StickerProvider } from "@oc/stickers/types";
import { DefinitionRegistry } from "@oc/params/registry";

export class StickersRegistry extends DefinitionRegistry<string, StickerProvider> {
	constructor() {
		super("sticker provider");
	}
}

export const stickersRegistry = new StickersRegistry();
