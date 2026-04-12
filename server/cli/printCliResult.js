export function printCliLog(entry) {
    const data = entry.data === undefined ? '' : ` ${JSON.stringify(entry.data)}`;
    console.error(`[${entry.at}] ${entry.level} ${entry.scope}: ${entry.message}${data}`);
}

export function printCliResult(result) {
    if (Array.isArray(result?.logs)) {
        for (const entry of result.logs) {
            printCliLog(entry);
        }
    }
    if (result?.data !== undefined) {
        console.log(JSON.stringify(result.data, null, 2));
    }
    if (result?.message) {
        console.log(result.message);
    }
}
