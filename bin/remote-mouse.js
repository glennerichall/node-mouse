#!/usr/bin/env node
import { startServer } from '../server/index.js';

startServer().catch((error) => {
  console.error('Erreur au démarrage:', error);
  process.exit(1);
});

