const packageNamePattern = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;

function quoteForDisplay(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

export function buildNpmGlobalUpdatePlan(packageName) {
  const name = String(packageName || '').trim();
  if (!name || name.length > 214 || !packageNamePattern.test(name)) return null;

  return {
    packageName: name,
    displayCommand: `npm pack ${quoteForDisplay(name)}@<target> -> verify SHA-512 -> npm install -g <verified tarball>`,
  };
}
