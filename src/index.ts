#!/usr/bin/env node
import { askQuestions } from "./questions.js";
import { scaffold } from "./scaffold.js";

try {
	const answers = await askQuestions();
	await scaffold(answers);
} catch (error) {
	if (
		error instanceof Error &&
		(error.message.includes("force closed") || error.name === "ExitPromptError")
	) {
		process.exit(0);
	}
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
}
