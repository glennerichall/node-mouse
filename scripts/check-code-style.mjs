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

  // Keep the transport API discoverable: the suffix identifies the role of
  // every module and prevents another mix of handler/router/guard names.
  if (path.startsWith('server/connection/api/')) {
    const relativePath = path.slice('server/connection/api/'.length);
    const [directory, fileName] = relativePath.split('/');
    const expectedSuffix = {
      routers: '.router.js',
      handlers: '.handlers.js',
      guards: '.guard.js',
      middlewares: '.middleware.js',
    }[directory];
    if (expectedSuffix && !fileName.endsWith(expectedSuffix)) {
      violations.push(`${path}: module must use the ${expectedSuffix} suffix`);
    }
  }

  // External and built-in imports must be declared before relative imports.
  // Import declarations are collected as blocks so multiline imports are
  // checked exactly like one-line declarations.
  if (path.startsWith('server/')) {
    const importBlocks = source.match(/(^import[\s\S]*?;)/gm) || [];
    let relativeImportSeen = false;
    for (const block of importBlocks) {
      const match = block.match(/from\s+['"]([^'"]+)|^import\s+['"]([^'"]+)/m);
      if (!match) continue;
      const specifier = match[1] || match[2];
      if (specifier.startsWith('.')) {
        relativeImportSeen = true;
      } else if (relativeImportSeen) {
        violations.push(`${path}: external import ${specifier} must precede relative imports`);
      }
    }
  }
}

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(`Code style check passed for ${files.length} JavaScript modules.`);
