import { Command, type CommandResult } from "@oc/commands/base-command";
import { EditorCore } from "@oc/core";
import type { TScene } from "@oc/timeline";
import { updateSceneInArray } from "@oc/timeline/scenes";
import {
	getFrameTime,
	removeBookmarkFromArray,
} from "@oc/timeline/bookmarks/index";
import { type MediaTime, ZERO_MEDIA_TIME } from "@oc/wasm";

export class RemoveBookmarkCommand extends Command {
	private savedScenes: TScene[] | null = null;
	private frameTime: MediaTime = ZERO_MEDIA_TIME;

	constructor(private time: MediaTime) {
		super();
	}

	execute(): CommandResult | undefined {
		const editor = EditorCore.getInstance();
		const activeScene = editor.scenes.getActiveScene();
		const activeProject = editor.project.getActive();

		if (!activeScene || !activeProject) {
			return;
		}

		const scenes = editor.scenes.getScenes();
		this.savedScenes = [...scenes];

		this.frameTime = getFrameTime({
			time: this.time,
			fps: activeProject.settings.fps,
		});

		const updatedBookmarks = removeBookmarkFromArray({
			bookmarks: activeScene.bookmarks,
			frameTime: this.frameTime,
		});

		if (updatedBookmarks.length === activeScene.bookmarks.length) {
			return;
		}

		const updatedScenes = updateSceneInArray({
			scenes,
			sceneId: activeScene.id,
			updates: { bookmarks: updatedBookmarks },
		});

		editor.scenes.setScenes({ scenes: updatedScenes });
	}

	undo(): void {
		if (this.savedScenes) {
			const editor = EditorCore.getInstance();
			editor.scenes.setScenes({ scenes: this.savedScenes });
		}
	}
}
