import readline from 'node:readline/promises';

// Non-interactive setup declines optional changes unless explicitly requested.
export async function askYesNo(question, {input, output, defaultValue = false}) {
    if (!input.isTTY || !output.isTTY) return false;
    const prompt = readline.createInterface({input, output});
    try {
        const answer = (await prompt.question(`${question} [y/N] `)).trim().toLowerCase();
        return ['y', 'yes', 'o', 'oui'].includes(answer) || (!answer && defaultValue);
    } finally {
        prompt.close();
    }
}
