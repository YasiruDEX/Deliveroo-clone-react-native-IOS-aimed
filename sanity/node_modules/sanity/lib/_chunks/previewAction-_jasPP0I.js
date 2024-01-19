import path from 'path';
import { startPreviewServer } from './previewServer-0asJTP2s.js';
import 'chalk';
import 'vite';
import '@vitejs/plugin-react';
import 'read-pkg-up';
import 'debug';
import 'resolve-from';
import './runtime-r-pj3sVw.js';
import 'fs';
import 'connect-history-api-fallback';
import 'fs/promises';
import '@sanity/cli';
import { gracefulServerDeath, getSharedServerConfig } from './servers-BRE4iEUR.js';
async function startSanityPreviewServer(args, context) {
  const flags = args.extOptions;
  const {
    workDir,
    cliConfig
  } = context;
  const defaultRootDir = path.resolve(path.join(workDir, "dist"));
  const rootDir = path.resolve(args.argsWithoutOptions[0] || defaultRootDir);
  const config = getPreviewServerConfig({
    flags,
    workDir,
    cliConfig,
    rootDir
  });
  try {
    await startPreviewServer(config);
  } catch (err) {
    gracefulServerDeath("preview", config.httpHost, config.httpPort, err);
  }
}
function getPreviewServerConfig(_ref) {
  let {
    flags,
    workDir,
    cliConfig,
    rootDir
  } = _ref;
  const baseConfig = getSharedServerConfig({
    flags,
    workDir,
    cliConfig
  });
  return {
    ...baseConfig,
    root: rootDir
  };
}
export { startSanityPreviewServer as default };
//# sourceMappingURL=previewAction-_jasPP0I.js.map
