export async function executeTokensCommand(services) {
  const tokens = Array.from(
    services.getPersistence().entryTokenDao.loadEntryTokens(),
    ([token, createdAt]) => ({
      token,
      createdAt,
    }),
  );

  return {
    ok: true,
    message: 'Tokens chargés.',
    data: tokens,
  };
}
