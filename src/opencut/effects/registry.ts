import { DefinitionRegistry } from "@oc/params/registry";
import type { EffectDefinition } from "@oc/effects/types";

export class EffectsRegistry extends DefinitionRegistry<string, EffectDefinition> {
	constructor() {
		super("effect");
	}
}

export const effectsRegistry = new EffectsRegistry();
