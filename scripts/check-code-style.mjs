import {readdir, readFile} from 'node:fs/promises';

const roots = ['server', 'client', 'scripts', 'test'];
const files = [];

async function collectFiles(directory) {
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      await collectFiles(path);
    } else if (/\.(?:js|mjs)$/.test(entry.name)) {
      files.push(path);
    }
  }
}

for (const root of roots) {
  await collectFiles(root);
}

const violations = [];
for (const path of files.sort()) {
  const source = await readFile(path, 'utf8');
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/\s$/.test(line)) violations.push(`${path}:${index + 1}: trailing whitespace`);
    if (/\t/.test(line)) violations.push(`${path}:${index + 1}: tab indentation`);
  });
}

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(`Code style check passed for ${files.length} JavaScript modules.`);
