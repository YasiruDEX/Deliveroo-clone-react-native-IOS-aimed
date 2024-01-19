import { printNoDefaultExport, defineCreateClientExports, SanityClient, envMiddleware } from './_chunks/browserMiddleware-eLzHI4Fk.js';
export { BasePatch, BaseTransaction, ClientError, ObservablePatch, ObservableSanityClient, ObservableTransaction, Patch, ServerError, Transaction } from './_chunks/browserMiddleware-eLzHI4Fk.js';
export { adapter as unstable__adapter, environment as unstable__environment } from 'get-it';
function defineDeprecatedCreateClient(createClient) {
  return function deprecatedCreateClient(config) {
    printNoDefaultExport();
    return createClient(config);
  };
}
const exp = defineCreateClientExports(envMiddleware, SanityClient);
const requester = exp.requester;
const createClient = exp.createClient;
const deprecatedCreateClient = defineDeprecatedCreateClient(createClient);
export { SanityClient, createClient, deprecatedCreateClient as default, requester };
//# sourceMappingURL=index.browser.js.map
