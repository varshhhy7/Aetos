import { generateUUID } from "@oc/utils/id";
import type { FeedbackEntry, SubmitFeedbackInput } from "./types";

// Persistence dropped in the embedded editor (no DB): accept and echo back.
export async function submitFeedback({
	message,
}: SubmitFeedbackInput): Promise<FeedbackEntry> {
	const id = generateUUID();
	const now = new Date();
	return { id, message, createdAt: now.toISOString() };
}
