'use strict';

var getIt = require('get-it');
var middleware = require('get-it/middleware');
var rxjs = require('rxjs');
var operators = require('rxjs/operators');
const MAX_ITEMS_IN_ERROR_MESSAGE = 5;
class ClientError extends Error {
  constructor(res) {
    const props = extractErrorProps(res);
    super(props.message);
    this.statusCode = 400;
    Object.assign(this, props);
  }
}
class ServerError extends Error {
  constructor(res) {
    const props = extractErrorProps(res);
    super(props.message);
    this.statusCode = 500;
    Object.assign(this, props);
  }
}
function extractErrorProps(res) {
  const body = res.body;
  const props = {
    response: res,
    statusCode: res.statusCode,
    responseBody: stringifyBody(body, res),
    message: "",
    details: void 0
  };
  if (body.error && body.message) {
    props.message = "".concat(body.error, " - ").concat(body.message);
    return props;
  }
  if (isMutationError(body)) {
    const allItems = body.error.items || [];
    const items = allItems.slice(0, MAX_ITEMS_IN_ERROR_MESSAGE).map(item => {
      var _a;
      return (_a = item.error) == null ? void 0 : _a.description;
    }).filter(Boolean);
    let itemsStr = items.length ? ":\n- ".concat(items.join("\n- ")) : "";
    if (allItems.length > MAX_ITEMS_IN_ERROR_MESSAGE) {
      itemsStr += "\n...and ".concat(allItems.length - MAX_ITEMS_IN_ERROR_MESSAGE, " more");
    }
    props.message = "".concat(body.error.description).concat(itemsStr);
    props.details = body.error;
    return props;
  }
  if (body.error && body.error.description) {
    props.message = body.error.description;
    props.details = body.error;
    return props;
  }
  props.message = body.error || body.message || httpErrorMessage(res);
  return props;
}
function isMutationError(body) {
  return isPlainObject(body) && isPlainObject(body.error) && body.error.type === "mutationError" && typeof body.error.description === "string";
}
function isPlainObject(obj) {
  return typeof obj === "object" && obj !== null && !Array.isArray(obj);
}
function httpErrorMessage(res) {
  const statusMessage = res.statusMessage ? " ".concat(res.statusMessage) : "";
  return "".concat(res.method, "-request to ").concat(res.url, " resulted in HTTP ").concat(res.statusCode).concat(statusMessage);
}
function stringifyBody(body, res) {
  const contentType = (res.headers["content-type"] || "").toLowerCase();
  const isJson = contentType.indexOf("application/json") !== -1;
  return isJson ? JSON.stringify(body, null, 2) : body;
}
const httpError = {
  onResponse: res => {
    if (res.statusCode >= 500) {
      throw new ServerError(res);
    } else if (res.statusCode >= 400) {
      throw new ClientError(res);
    }
    return res;
  }
};
const printWarnings = {
  onResponse: res => {
    const warn = res.headers["x-sanity-warning"];
    const warnings = Array.isArray(warn) ? warn : [warn];
    warnings.filter(Boolean).forEach(msg => console.warn(msg));
    return res;
  }
};
function defineHttpRequest(envMiddleware, _ref) {
  let {
    maxRetries = 5,
    retryDelay
  } = _ref;
  const request = getIt.getIt([maxRetries > 0 ? middleware.retry({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    retryDelay,
    // This option is typed incorrectly in get-it.
    maxRetries,
    shouldRetry
  }) : {}, ...envMiddleware, printWarnings, middleware.jsonRequest(), middleware.jsonResponse(), middleware.progress(), httpError, middleware.observable({
    implementation: rxjs.Observable
  })]);
  function httpRequest(options) {
    let requester = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : request;
    return requester({
      maxRedirects: 0,
      ...options
    });
  }
  httpRequest.defaultRequester = request;
  return httpRequest;
}
function shouldRetry(err, attempt, options) {
  const isSafe = options.method === "GET" || options.method === "HEAD";
  const uri = options.uri || options.url;
  const isQuery = uri.startsWith("/data/query");
  const isRetriableResponse = err.response && (err.response.statusCode === 429 || err.response.statusCode === 502 || err.response.statusCode === 503);
  if ((isSafe || isQuery) && isRetriableResponse) return true;
  return middleware.retry.shouldRetry(err, attempt, options);
}
function getSelection(sel) {
  if (typeof sel === "string" || Array.isArray(sel)) {
    return {
      id: sel
    };
  }
  if (typeof sel === "object" && sel !== null && "query" in sel && typeof sel.query === "string") {
    return "params" in sel && typeof sel.params === "object" && sel.params !== null ? {
      query: sel.query,
      params: sel.params
    } : {
      query: sel.query
    };
  }
  const selectionOpts = ["* Document ID (<docId>)", "* Array of document IDs", "* Object containing `query`"].join("\n");
  throw new Error("Unknown selection - must be one of:\n\n".concat(selectionOpts));
}
const VALID_ASSET_TYPES = ["image", "file"];
const VALID_INSERT_LOCATIONS = ["before", "after", "replace"];
const dataset = name => {
  if (!/^(~[a-z0-9]{1}[-\w]{0,63}|[a-z0-9]{1}[-\w]{0,63})$/.test(name)) {
    throw new Error("Datasets can only contain lowercase characters, numbers, underscores and dashes, and start with tilde, and be maximum 64 characters");
  }
};
const projectId = id => {
  if (!/^[-a-z0-9]+$/i.test(id)) {
    throw new Error("`projectId` can only contain only a-z, 0-9 and dashes");
  }
};
const validateAssetType = type => {
  if (VALID_ASSET_TYPES.indexOf(type) === -1) {
    throw new Error("Invalid asset type: ".concat(type, ". Must be one of ").concat(VALID_ASSET_TYPES.join(", ")));
  }
};
const validateObject = (op, val) => {
  if (val === null || typeof val !== "object" || Array.isArray(val)) {
    throw new Error("".concat(op, "() takes an object of properties"));
  }
};
const validateDocumentId = (op, id) => {
  if (typeof id !== "string" || !/^[a-z0-9_][a-z0-9_.-]{0,127}$/i.test(id) || id.includes("..")) {
    throw new Error("".concat(op, '(): "').concat(id, '" is not a valid document ID'));
  }
};
const requireDocumentId = (op, doc) => {
  if (!doc._id) {
    throw new Error("".concat(op, '() requires that the document contains an ID ("_id" property)'));
  }
  validateDocumentId(op, doc._id);
};
const validateInsert = (at, selector, items) => {
  const signature = "insert(at, selector, items)";
  if (VALID_INSERT_LOCATIONS.indexOf(at) === -1) {
    const valid = VALID_INSERT_LOCATIONS.map(loc => '"'.concat(loc, '"')).join(", ");
    throw new Error("".concat(signature, ' takes an "at"-argument which is one of: ').concat(valid));
  }
  if (typeof selector !== "string") {
    throw new Error("".concat(signature, ' takes a "selector"-argument which must be a string'));
  }
  if (!Array.isArray(items)) {
    throw new Error("".concat(signature, ' takes an "items"-argument which must be an array'));
  }
};
const hasDataset = config => {
  if (!config.dataset) {
    throw new Error("`dataset` must be provided to perform queries");
  }
  return config.dataset || "";
};
const requestTag = tag => {
  if (typeof tag !== "string" || !/^[a-z0-9._-]{1,75}$/i.test(tag)) {
    throw new Error("Tag can only contain alphanumeric characters, underscores, dashes and dots, and be between one and 75 characters long.");
  }
  return tag;
};
var __accessCheck$6 = (obj, member, msg) => {
  if (!member.has(obj)) throw TypeError("Cannot " + msg);
};
var __privateGet$6 = (obj, member, getter) => {
  __accessCheck$6(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd$6 = (obj, member, value) => {
  if (member.has(obj)) throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet$6 = (obj, member, value, setter) => {
  __accessCheck$6(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _client$5, _client2$5;
class BasePatch {
  constructor(selection) {
    let operations = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this.selection = selection;
    this.operations = operations;
  }
  /**
   * Sets the given attributes to the document. Does NOT merge objects.
   * The operation is added to the current patch, ready to be commited by `commit()`
   *
   * @param attrs - Attributes to set. To set a deep attribute, use JSONMatch, eg: \{"nested.prop": "value"\}
   */
  set(attrs) {
    return this._assign("set", attrs);
  }
  /**
   * Sets the given attributes to the document if they are not currently set. Does NOT merge objects.
   * The operation is added to the current patch, ready to be commited by `commit()`
   *
   * @param attrs - Attributes to set. To set a deep attribute, use JSONMatch, eg: \{"nested.prop": "value"\}
   */
  setIfMissing(attrs) {
    return this._assign("setIfMissing", attrs);
  }
  /**
   * Performs a "diff-match-patch" operation on the string attributes provided.
   * The operation is added to the current patch, ready to be commited by `commit()`
   *
   * @param attrs - Attributes to perform operation on. To set a deep attribute, use JSONMatch, eg: \{"nested.prop": "dmp"\}
   */
  diffMatchPatch(attrs) {
    validateObject("diffMatchPatch", attrs);
    return this._assign("diffMatchPatch", attrs);
  }
  /**
   * Unsets the attribute paths provided.
   * The operation is added to the current patch, ready to be commited by `commit()`
   *
   * @param attrs - Attribute paths to unset.
   */
  unset(attrs) {
    if (!Array.isArray(attrs)) {
      throw new Error("unset(attrs) takes an array of attributes to unset, non-array given");
    }
    this.operations = Object.assign({}, this.operations, {
      unset: attrs
    });
    return this;
  }
  /**
   * Increment a numeric value. Each entry in the argument is either an attribute or a JSON path. The value may be a positive or negative integer or floating-point value. The operation will fail if target value is not a numeric value, or doesn't exist.
   *
   * @param attrs - Object of attribute paths to increment, values representing the number to increment by.
   */
  inc(attrs) {
    return this._assign("inc", attrs);
  }
  /**
   * Decrement a numeric value. Each entry in the argument is either an attribute or a JSON path. The value may be a positive or negative integer or floating-point value. The operation will fail if target value is not a numeric value, or doesn't exist.
   *
   * @param attrs - Object of attribute paths to decrement, values representing the number to decrement by.
   */
  dec(attrs) {
    return this._assign("dec", attrs);
  }
  /**
   * Provides methods for modifying arrays, by inserting, appending and replacing elements via a JSONPath expression.
   *
   * @param at - Location to insert at, relative to the given selector, or 'replace' the matched path
   * @param selector - JSONPath expression, eg `comments[-1]` or `blocks[_key=="abc123"]`
   * @param items - Array of items to insert/replace
   */
  insert(at, selector, items) {
    validateInsert(at, selector, items);
    return this._assign("insert", {
      [at]: selector,
      items
    });
  }
  /**
   * Append the given items to the array at the given JSONPath
   *
   * @param selector - Attribute/path to append to, eg `comments` or `person.hobbies`
   * @param items - Array of items to append to the array
   */
  append(selector, items) {
    return this.insert("after", "".concat(selector, "[-1]"), items);
  }
  /**
   * Prepend the given items to the array at the given JSONPath
   *
   * @param selector - Attribute/path to prepend to, eg `comments` or `person.hobbies`
   * @param items - Array of items to prepend to the array
   */
  prepend(selector, items) {
    return this.insert("before", "".concat(selector, "[0]"), items);
  }
  /**
   * Change the contents of an array by removing existing elements and/or adding new elements.
   *
   * @param selector - Attribute or JSONPath expression for array
   * @param start - Index at which to start changing the array (with origin 0). If greater than the length of the array, actual starting index will be set to the length of the array. If negative, will begin that many elements from the end of the array (with origin -1) and will be set to 0 if absolute value is greater than the length of the array.x
   * @param deleteCount - An integer indicating the number of old array elements to remove.
   * @param items - The elements to add to the array, beginning at the start index. If you don't specify any elements, splice() will only remove elements from the array.
   */
  splice(selector, start, deleteCount, items) {
    const delAll = typeof deleteCount === "undefined" || deleteCount === -1;
    const startIndex = start < 0 ? start - 1 : start;
    const delCount = delAll ? -1 : Math.max(0, start + deleteCount);
    const delRange = startIndex < 0 && delCount >= 0 ? "" : delCount;
    const rangeSelector = "".concat(selector, "[").concat(startIndex, ":").concat(delRange, "]");
    return this.insert("replace", rangeSelector, items || []);
  }
  /**
   * Adds a revision clause, preventing the document from being patched if the `_rev` property does not match the given value
   *
   * @param rev - Revision to lock the patch to
   */
  ifRevisionId(rev) {
    this.operations.ifRevisionID = rev;
    return this;
  }
  /**
   * Return a plain JSON representation of the patch
   */
  serialize() {
    return {
      ...getSelection(this.selection),
      ...this.operations
    };
  }
  /**
   * Return a plain JSON representation of the patch
   */
  toJSON() {
    return this.serialize();
  }
  /**
   * Clears the patch of all operations
   */
  reset() {
    this.operations = {};
    return this;
  }
  _assign(op, props) {
    let merge = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    validateObject(op, props);
    this.operations = Object.assign({}, this.operations, {
      [op]: Object.assign({}, merge && this.operations[op] || {}, props)
    });
    return this;
  }
  _set(op, props) {
    return this._assign(op, props, false);
  }
}
const _ObservablePatch = class _ObservablePatch extends BasePatch {
  constructor(selection, operations, client) {
    super(selection, operations);
    __privateAdd$6(this, _client$5, void 0);
    __privateSet$6(this, _client$5, client);
  }
  /**
   * Clones the patch
   */
  clone() {
    return new _ObservablePatch(this.selection, {
      ...this.operations
    }, __privateGet$6(this, _client$5));
  }
  commit(options) {
    if (!__privateGet$6(this, _client$5)) {
      throw new Error("No `client` passed to patch, either provide one or pass the patch to a clients `mutate()` method");
    }
    const returnFirst = typeof this.selection === "string";
    const opts = Object.assign({
      returnFirst,
      returnDocuments: true
    }, options);
    return __privateGet$6(this, _client$5).mutate({
      patch: this.serialize()
    }, opts);
  }
};
_client$5 = new WeakMap();
let ObservablePatch = _ObservablePatch;
const _Patch = class _Patch extends BasePatch {
  constructor(selection, operations, client) {
    super(selection, operations);
    __privateAdd$6(this, _client2$5, void 0);
    __privateSet$6(this, _client2$5, client);
  }
  /**
   * Clones the patch
   */
  clone() {
    return new _Patch(this.selection, {
      ...this.operations
    }, __privateGet$6(this, _client2$5));
  }
  commit(options) {
    if (!__privateGet$6(this, _client2$5)) {
      throw new Error("No `client` passed to patch, either provide one or pass the patch to a clients `mutate()` method");
    }
    const returnFirst = typeof this.selection === "string";
    const opts = Object.assign({
      returnFirst,
      returnDocuments: true
    }, options);
    return __privateGet$6(this, _client2$5).mutate({
      patch: this.serialize()
    }, opts);
  }
};
_client2$5 = new WeakMap();
let Patch = _Patch;
var __accessCheck$5 = (obj, member, msg) => {
  if (!member.has(obj)) throw TypeError("Cannot " + msg);
};
var __privateGet$5 = (obj, member, getter) => {
  __accessCheck$5(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd$5 = (obj, member, value) => {
  if (member.has(obj)) throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet$5 = (obj, member, value, setter) => {
  __accessCheck$5(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _client$4, _client2$4;
const defaultMutateOptions = {
  returnDocuments: false
};
class BaseTransaction {
  constructor() {
    let operations = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    let transactionId = arguments.length > 1 ? arguments[1] : undefined;
    this.operations = operations;
    this.trxId = transactionId;
  }
  /**
   * Creates a new Sanity document. If `_id` is provided and already exists, the mutation will fail. If no `_id` is given, one will automatically be generated by the database.
   * The operation is added to the current transaction, ready to be commited by `commit()`
   *
   * @param doc - Document to create. Requires a `_type` property.
   */
  create(doc) {
    validateObject("create", doc);
    return this._add({
      create: doc
    });
  }
  /**
   * Creates a new Sanity document. If a document with the same `_id` already exists, the create operation will be ignored.
   * The operation is added to the current transaction, ready to be commited by `commit()`
   *
   * @param doc - Document to create if it does not already exist. Requires `_id` and `_type` properties.
   */
  createIfNotExists(doc) {
    const op = "createIfNotExists";
    validateObject(op, doc);
    requireDocumentId(op, doc);
    return this._add({
      [op]: doc
    });
  }
  /**
   * Creates a new Sanity document, or replaces an existing one if the same `_id` is already used.
   * The operation is added to the current transaction, ready to be commited by `commit()`
   *
   * @param doc - Document to create or replace. Requires `_id` and `_type` properties.
   */
  createOrReplace(doc) {
    const op = "createOrReplace";
    validateObject(op, doc);
    requireDocumentId(op, doc);
    return this._add({
      [op]: doc
    });
  }
  /**
   * Deletes the document with the given document ID
   * The operation is added to the current transaction, ready to be commited by `commit()`
   *
   * @param documentId - Document ID to delete
   */
  delete(documentId) {
    validateDocumentId("delete", documentId);
    return this._add({
      delete: {
        id: documentId
      }
    });
  }
  transactionId(id) {
    if (!id) {
      return this.trxId;
    }
    this.trxId = id;
    return this;
  }
  /**
   * Return a plain JSON representation of the transaction
   */
  serialize() {
    return [...this.operations];
  }
  /**
   * Return a plain JSON representation of the transaction
   */
  toJSON() {
    return this.serialize();
  }
  /**
   * Clears the transaction of all operations
   */
  reset() {
    this.operations = [];
    return this;
  }
  _add(mut) {
    this.operations.push(mut);
    return this;
  }
}
const _Transaction = class _Transaction extends BaseTransaction {
  constructor(operations, client, transactionId) {
    super(operations, transactionId);
    __privateAdd$5(this, _client$4, void 0);
    __privateSet$5(this, _client$4, client);
  }
  /**
   * Clones the transaction
   */
  clone() {
    return new _Transaction([...this.operations], __privateGet$5(this, _client$4), this.trxId);
  }
  commit(options) {
    if (!__privateGet$5(this, _client$4)) {
      throw new Error("No `client` passed to transaction, either provide one or pass the transaction to a clients `mutate()` method");
    }
    return __privateGet$5(this, _client$4).mutate(this.serialize(), Object.assign({
      transactionId: this.trxId
    }, defaultMutateOptions, options || {}));
  }
  patch(patchOrDocumentId, patchOps) {
    const isBuilder = typeof patchOps === "function";
    const isPatch = typeof patchOrDocumentId !== "string" && patchOrDocumentId instanceof Patch;
    if (isPatch) {
      return this._add({
        patch: patchOrDocumentId.serialize()
      });
    }
    if (isBuilder) {
      const patch = patchOps(new Patch(patchOrDocumentId, {}, __privateGet$5(this, _client$4)));
      if (!(patch instanceof Patch)) {
        throw new Error("function passed to `patch()` must return the patch");
      }
      return this._add({
        patch: patch.serialize()
      });
    }
    return this._add({
      patch: {
        id: patchOrDocumentId,
        ...patchOps
      }
    });
  }
};
_client$4 = new WeakMap();
let Transaction = _Transaction;
const _ObservableTransaction = class _ObservableTransaction extends BaseTransaction {
  constructor(operations, client, transactionId) {
    super(operations, transactionId);
    __privateAdd$5(this, _client2$4, void 0);
    __privateSet$5(this, _client2$4, client);
  }
  /**
   * Clones the transaction
   */
  clone() {
    return new _ObservableTransaction([...this.operations], __privateGet$5(this, _client2$4), this.trxId);
  }
  commit(options) {
    if (!__privateGet$5(this, _client2$4)) {
      throw new Error("No `client` passed to transaction, either provide one or pass the transaction to a clients `mutate()` method");
    }
    return __privateGet$5(this, _client2$4).mutate(this.serialize(), Object.assign({
      transactionId: this.trxId
    }, defaultMutateOptions, options || {}));
  }
  patch(patchOrDocumentId, patchOps) {
    const isBuilder = typeof patchOps === "function";
    const isPatch = typeof patchOrDocumentId !== "string" && patchOrDocumentId instanceof ObservablePatch;
    if (isPatch) {
      return this._add({
        patch: patchOrDocumentId.serialize()
      });
    }
    if (isBuilder) {
      const patch = patchOps(new ObservablePatch(patchOrDocumentId, {}, __privateGet$5(this, _client2$4)));
      if (!(patch instanceof ObservablePatch)) {
        throw new Error("function passed to `patch()` must return the patch");
      }
      return this._add({
        patch: patch.serialize()
      });
    }
    return this._add({
      patch: {
        id: patchOrDocumentId,
        ...patchOps
      }
    });
  }
};
_client2$4 = new WeakMap();
let ObservableTransaction = _ObservableTransaction;
const BASE_URL = "https://www.sanity.io/help/";
function generateHelpUrl(slug) {
  return BASE_URL + slug;
}
function once(fn) {
  let didCall = false;
  let returnValue;
  return function () {
    if (didCall) {
      return returnValue;
    }
    returnValue = fn(...arguments);
    didCall = true;
    return returnValue;
  };
}
const createWarningPrinter = message =>
// eslint-disable-next-line no-console
once(function () {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  return console.warn(message.join(" "), ...args);
});
const printCdnWarning = createWarningPrinter(["Since you haven't set a value for `useCdn`, we will deliver content using our", "global, edge-cached API-CDN. If you wish to have content delivered faster, set", "`useCdn: false` to use the Live API. Note: You may incur higher costs using the live API."]);
const printCdnPreviewDraftsWarning = createWarningPrinter(["The Sanity client is configured with the `perspective` set to `previewDrafts`, which doesn't support the API-CDN.", "The Live API will be used instead. Set `useCdn: false` in your configuration to hide this warning."]);
const printBrowserTokenWarning = createWarningPrinter(["You have configured Sanity client to use a token in the browser. This may cause unintentional security issues.", "See ".concat(generateHelpUrl("js-client-browser-token"), " for more information and how to hide this warning.")]);
const printNoApiVersionSpecifiedWarning = createWarningPrinter(["Using the Sanity client without specifying an API version is deprecated.", "See ".concat(generateHelpUrl("js-client-api-version"))]);
const printNoDefaultExport = createWarningPrinter(["The default export of @sanity/client has been deprecated. Use the named export `createClient` instead."]);
const defaultCdnHost = "apicdn.sanity.io";
const defaultConfig = {
  apiHost: "https://api.sanity.io",
  apiVersion: "1",
  useProjectHostname: true
};
const LOCALHOSTS = ["localhost", "127.0.0.1", "0.0.0.0"];
const isLocal = host => LOCALHOSTS.indexOf(host) !== -1;
const validateApiVersion = function validateApiVersion2(apiVersion) {
  if (apiVersion === "1" || apiVersion === "X") {
    return;
  }
  const apiDate = new Date(apiVersion);
  const apiVersionValid = /^\d{4}-\d{2}-\d{2}$/.test(apiVersion) && apiDate instanceof Date && apiDate.getTime() > 0;
  if (!apiVersionValid) {
    throw new Error("Invalid API version string, expected `1` or date in format `YYYY-MM-DD`");
  }
};
const validateApiPerspective = function validateApiPerspective2(perspective) {
  switch (perspective) {
    case "previewDrafts":
    case "published":
    case "raw":
      return;
    default:
      throw new TypeError("Invalid API perspective string, expected `published`, `previewDrafts` or `raw`");
  }
};
const initConfig = (config, prevConfig) => {
  const specifiedConfig = Object.assign({}, prevConfig, config);
  if (!specifiedConfig.apiVersion) {
    printNoApiVersionSpecifiedWarning();
  }
  const newConfig = Object.assign({}, defaultConfig, specifiedConfig);
  const projectBased = newConfig.useProjectHostname;
  if (typeof Promise === "undefined") {
    const helpUrl = generateHelpUrl("js-client-promise-polyfill");
    throw new Error("No native Promise-implementation found, polyfill needed - see ".concat(helpUrl));
  }
  if (projectBased && !newConfig.projectId) {
    throw new Error("Configuration must contain `projectId`");
  }
  if (typeof newConfig.perspective === "string") {
    validateApiPerspective(newConfig.perspective);
  }
  if ("encodeSourceMapAtPath" in newConfig || "encodeSourceMap" in newConfig || "studioUrl" in newConfig || "logger" in newConfig) {
    throw new Error("It looks like you're using options meant for '@sanity/preview-kit/client', such as 'encodeSourceMapAtPath', 'encodeSourceMap', 'studioUrl' and 'logger'. Make sure you're using the right import.");
  }
  if ("stega" in newConfig && newConfig["stega"] !== void 0 && newConfig["stega"] !== false) {
    throw new Error("It looks like you're using options meant for '@sanity/client/stega'. Make sure you're using the right import. Or set 'stega' in 'createClient' to 'false'.");
  }
  const isBrowser = typeof window !== "undefined" && window.location && window.location.hostname;
  const isLocalhost = isBrowser && isLocal(window.location.hostname);
  if (isBrowser && isLocalhost && newConfig.token && newConfig.ignoreBrowserTokenWarning !== true) {
    printBrowserTokenWarning();
  } else if (typeof newConfig.useCdn === "undefined") {
    printCdnWarning();
  }
  if (projectBased) {
    projectId(newConfig.projectId);
  }
  if (newConfig.dataset) {
    dataset(newConfig.dataset);
  }
  if ("requestTagPrefix" in newConfig) {
    newConfig.requestTagPrefix = newConfig.requestTagPrefix ? requestTag(newConfig.requestTagPrefix).replace(/\.+$/, "") : void 0;
  }
  newConfig.apiVersion = "".concat(newConfig.apiVersion).replace(/^v/, "");
  newConfig.isDefaultApi = newConfig.apiHost === defaultConfig.apiHost;
  newConfig.useCdn = newConfig.useCdn !== false && !newConfig.withCredentials;
  validateApiVersion(newConfig.apiVersion);
  const hostParts = newConfig.apiHost.split("://", 2);
  const protocol = hostParts[0];
  const host = hostParts[1];
  const cdnHost = newConfig.isDefaultApi ? defaultCdnHost : host;
  if (newConfig.useProjectHostname) {
    newConfig.url = "".concat(protocol, "://").concat(newConfig.projectId, ".").concat(host, "/v").concat(newConfig.apiVersion);
    newConfig.cdnUrl = "".concat(protocol, "://").concat(newConfig.projectId, ".").concat(cdnHost, "/v").concat(newConfig.apiVersion);
  } else {
    newConfig.url = "".concat(newConfig.apiHost, "/v").concat(newConfig.apiVersion);
    newConfig.cdnUrl = newConfig.url;
  }
  return newConfig;
};
const projectHeader = "X-Sanity-Project-ID";
function requestOptions(config) {
  let overrides = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const headers = {};
  const token = overrides.token || config.token;
  if (token) {
    headers.Authorization = "Bearer ".concat(token);
  }
  if (!overrides.useGlobalApi && !config.useProjectHostname && config.projectId) {
    headers[projectHeader] = config.projectId;
  }
  const withCredentials = Boolean(typeof overrides.withCredentials === "undefined" ? config.token || config.withCredentials : overrides.withCredentials);
  const timeout = typeof overrides.timeout === "undefined" ? config.timeout : overrides.timeout;
  return Object.assign({}, overrides, {
    headers: Object.assign({}, headers, overrides.headers || {}),
    timeout: typeof timeout === "undefined" ? 5 * 60 * 1e3 : timeout,
    proxy: overrides.proxy || config.proxy,
    json: true,
    withCredentials,
    fetch: typeof overrides.fetch === "object" && typeof config.fetch === "object" ? {
      ...config.fetch,
      ...overrides.fetch
    } : overrides.fetch || config.fetch
  });
}
const encodeQueryString = _ref2 => {
  let {
    query,
    params = {},
    options = {}
  } = _ref2;
  const searchParams = new URLSearchParams();
  const {
    tag,
    ...opts
  } = options;
  if (tag) searchParams.append("tag", tag);
  searchParams.append("query", query);
  for (const [key, value] of Object.entries(params)) {
    searchParams.append("$".concat(key), JSON.stringify(value));
  }
  for (const [key, value] of Object.entries(opts)) {
    if (value) searchParams.append(key, "".concat(value));
  }
  return "?".concat(searchParams);
};
const excludeFalsey = (param, defValue) => {
  const value = typeof param === "undefined" ? defValue : param;
  return param === false ? void 0 : value;
};
const getMutationQuery = function () {
  let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return {
    dryRun: options.dryRun,
    returnIds: true,
    returnDocuments: excludeFalsey(options.returnDocuments, true),
    visibility: options.visibility || "sync",
    autoGenerateArrayKeys: options.autoGenerateArrayKeys,
    skipCrossDatasetReferenceValidation: options.skipCrossDatasetReferenceValidation
  };
};
const isResponse = event => event.type === "response";
const getBody = event => event.body;
const indexBy = (docs, attr) => docs.reduce((indexed, doc) => {
  indexed[attr(doc)] = doc;
  return indexed;
}, /* @__PURE__ */Object.create(null));
const getQuerySizeLimit = 11264;
function _fetch(client, httpRequest, query, params) {
  let options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
  if ("stega" in options && options["stega"] !== void 0 && options["stega"] !== false) {
    throw new Error("It looks like you're using options meant for '@sanity/client/stega'. Make sure you're using the right import. Or set 'stega' in 'fetch' to 'false'.");
  }
  const mapResponse = options.filterResponse === false ? res => res : res => res.result;
  const {
    cache,
    next,
    ...opts
  } = {
    // Opt out of setting a `signal` on an internal `fetch` if one isn't provided.
    // This is necessary in React Server Components to avoid opting out of Request Memoization.
    useAbortSignal: typeof options.signal !== "undefined",
    ...options
  };
  const reqOpts = typeof cache !== "undefined" || typeof next !== "undefined" ? {
    ...opts,
    fetch: {
      cache,
      next
    }
  } : opts;
  return _dataRequest(client, httpRequest, "query", {
    query,
    params
  }, reqOpts).pipe(operators.map(mapResponse));
}
function _getDocument(client, httpRequest, id) {
  let opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  const options = {
    uri: _getDataUrl(client, "doc", id),
    json: true,
    tag: opts.tag
  };
  return _requestObservable(client, httpRequest, options).pipe(operators.filter(isResponse), operators.map(event => event.body.documents && event.body.documents[0]));
}
function _getDocuments(client, httpRequest, ids) {
  let opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  const options = {
    uri: _getDataUrl(client, "doc", ids.join(",")),
    json: true,
    tag: opts.tag
  };
  return _requestObservable(client, httpRequest, options).pipe(operators.filter(isResponse), operators.map(event => {
    const indexed = indexBy(event.body.documents || [], doc => doc._id);
    return ids.map(id => indexed[id] || null);
  }));
}
function _createIfNotExists(client, httpRequest, doc, options) {
  requireDocumentId("createIfNotExists", doc);
  return _create(client, httpRequest, doc, "createIfNotExists", options);
}
function _createOrReplace(client, httpRequest, doc, options) {
  requireDocumentId("createOrReplace", doc);
  return _create(client, httpRequest, doc, "createOrReplace", options);
}
function _delete(client, httpRequest, selection, options) {
  return _dataRequest(client, httpRequest, "mutate", {
    mutations: [{
      delete: getSelection(selection)
    }]
  }, options);
}
function _mutate(client, httpRequest, mutations, options) {
  let mut;
  if (mutations instanceof Patch || mutations instanceof ObservablePatch) {
    mut = {
      patch: mutations.serialize()
    };
  } else if (mutations instanceof Transaction || mutations instanceof ObservableTransaction) {
    mut = mutations.serialize();
  } else {
    mut = mutations;
  }
  const muts = Array.isArray(mut) ? mut : [mut];
  const transactionId = options && options.transactionId || void 0;
  return _dataRequest(client, httpRequest, "mutate", {
    mutations: muts,
    transactionId
  }, options);
}
function _dataRequest(client, httpRequest, endpoint, body) {
  let options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
  const isMutation = endpoint === "mutate";
  const isQuery = endpoint === "query";
  const strQuery = isMutation ? "" : encodeQueryString(body);
  const useGet = !isMutation && strQuery.length < getQuerySizeLimit;
  const stringQuery = useGet ? strQuery : "";
  const returnFirst = options.returnFirst;
  const {
    timeout,
    token,
    tag,
    headers
  } = options;
  const uri = _getDataUrl(client, endpoint, stringQuery);
  const reqOptions = {
    method: useGet ? "GET" : "POST",
    uri,
    json: true,
    body: useGet ? void 0 : body,
    query: isMutation && getMutationQuery(options),
    timeout,
    headers,
    token,
    tag,
    perspective: options.perspective,
    resultSourceMap: options.resultSourceMap,
    canUseCdn: isQuery,
    signal: options.signal,
    fetch: options.fetch,
    useAbortSignal: options.useAbortSignal,
    useCdn: options.useCdn
  };
  return _requestObservable(client, httpRequest, reqOptions).pipe(operators.filter(isResponse), operators.map(getBody), operators.map(res => {
    if (!isMutation) {
      return res;
    }
    const results = res.results || [];
    if (options.returnDocuments) {
      return returnFirst ? results[0] && results[0].document : results.map(mut => mut.document);
    }
    const key = returnFirst ? "documentId" : "documentIds";
    const ids = returnFirst ? results[0] && results[0].id : results.map(mut => mut.id);
    return {
      transactionId: res.transactionId,
      results,
      [key]: ids
    };
  }));
}
function _create(client, httpRequest, doc, op) {
  let options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
  const mutation = {
    [op]: doc
  };
  const opts = Object.assign({
    returnFirst: true,
    returnDocuments: true
  }, options);
  return _dataRequest(client, httpRequest, "mutate", {
    mutations: [mutation]
  }, opts);
}
function _requestObservable(client, httpRequest, options) {
  var _a, _b;
  const uri = options.url || options.uri;
  const config = client.config();
  const canUseCdn = typeof options.canUseCdn === "undefined" ? ["GET", "HEAD"].indexOf(options.method || "GET") >= 0 && uri.indexOf("/data/") === 0 : options.canUseCdn;
  let useCdn = ((_a = options.useCdn) != null ? _a : config.useCdn) && canUseCdn;
  const tag = options.tag && config.requestTagPrefix ? [config.requestTagPrefix, options.tag].join(".") : options.tag || config.requestTagPrefix;
  if (tag && options.tag !== null) {
    options.query = {
      tag: requestTag(tag),
      ...options.query
    };
  }
  if (["GET", "HEAD", "POST"].indexOf(options.method || "GET") >= 0 && uri.indexOf("/data/query/") === 0) {
    const resultSourceMap = (_b = options.resultSourceMap) != null ? _b : config.resultSourceMap;
    if (resultSourceMap !== void 0 && resultSourceMap !== false) {
      options.query = {
        resultSourceMap,
        ...options.query
      };
    }
    const perspective = options.perspective || config.perspective;
    if (typeof perspective === "string" && perspective !== "raw") {
      validateApiPerspective(perspective);
      options.query = {
        perspective,
        ...options.query
      };
      if (perspective === "previewDrafts" && useCdn) {
        useCdn = false;
        printCdnPreviewDraftsWarning();
      }
    }
  }
  const reqOptions = requestOptions(config, Object.assign({}, options, {
    url: _getUrl(client, uri, useCdn)
  }));
  const request = new rxjs.Observable(subscriber => httpRequest(reqOptions, config.requester).subscribe(subscriber));
  return options.signal ? request.pipe(_withAbortSignal(options.signal)) : request;
}
function _request(client, httpRequest, options) {
  const observable = _requestObservable(client, httpRequest, options).pipe(operators.filter(event => event.type === "response"), operators.map(event => event.body));
  return observable;
}
function _getDataUrl(client, operation, path) {
  const config = client.config();
  const catalog = hasDataset(config);
  const baseUri = "/".concat(operation, "/").concat(catalog);
  const uri = path ? "".concat(baseUri, "/").concat(path) : baseUri;
  return "/data".concat(uri).replace(/\/($|\?)/, "$1");
}
function _getUrl(client, uri) {
  let canUseCdn = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  const {
    url,
    cdnUrl
  } = client.config();
  const base = canUseCdn ? cdnUrl : url;
  return "".concat(base, "/").concat(uri.replace(/^\//, ""));
}
function _withAbortSignal(signal) {
  return input => {
    return new rxjs.Observable(observer => {
      const abort = () => observer.error(_createAbortError(signal));
      if (signal && signal.aborted) {
        abort();
        return;
      }
      const subscription = input.subscribe(observer);
      signal.addEventListener("abort", abort);
      return () => {
        signal.removeEventListener("abort", abort);
        subscription.unsubscribe();
      };
    });
  };
}
const isDomExceptionSupported = Boolean(globalThis.DOMException);
function _createAbortError(signal) {
  var _a, _b;
  if (isDomExceptionSupported) {
    return new DOMException((_a = signal == null ? void 0 : signal.reason) != null ? _a : "The operation was aborted.", "AbortError");
  }
  const error = new Error((_b = signal == null ? void 0 : signal.reason) != null ? _b : "The operation was aborted.");
  error.name = "AbortError";
  return error;
}
var __accessCheck$4 = (obj, member, msg) => {
  if (!member.has(obj)) throw TypeError("Cannot " + msg);
};
var __privateGet$4 = (obj, member, getter) => {
  __accessCheck$4(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd$4 = (obj, member, value) => {
  if (member.has(obj)) throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet$4 = (obj, member, value, setter) => {
  __accessCheck$4(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _client$3, _httpRequest$4, _client2$3, _httpRequest2$4;
class ObservableAssetsClient {
  constructor(client, httpRequest) {
    __privateAdd$4(this, _client$3, void 0);
    __privateAdd$4(this, _httpRequest$4, void 0);
    __privateSet$4(this, _client$3, client);
    __privateSet$4(this, _httpRequest$4, httpRequest);
  }
  upload(assetType, body, options) {
    return _upload(__privateGet$4(this, _client$3), __privateGet$4(this, _httpRequest$4), assetType, body, options);
  }
}
_client$3 = new WeakMap();
_httpRequest$4 = new WeakMap();
class AssetsClient {
  constructor(client, httpRequest) {
    __privateAdd$4(this, _client2$3, void 0);
    __privateAdd$4(this, _httpRequest2$4, void 0);
    __privateSet$4(this, _client2$3, client);
    __privateSet$4(this, _httpRequest2$4, httpRequest);
  }
  upload(assetType, body, options) {
    const observable = _upload(__privateGet$4(this, _client2$3), __privateGet$4(this, _httpRequest2$4), assetType, body, options);
    return rxjs.lastValueFrom(observable.pipe(operators.filter(event => event.type === "response"), operators.map(event => event.body.document)));
  }
}
_client2$3 = new WeakMap();
_httpRequest2$4 = new WeakMap();
function _upload(client, httpRequest, assetType, body) {
  let opts = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
  validateAssetType(assetType);
  let meta = opts.extract || void 0;
  if (meta && !meta.length) {
    meta = ["none"];
  }
  const dataset = hasDataset(client.config());
  const assetEndpoint = assetType === "image" ? "images" : "files";
  const options = optionsFromFile(opts, body);
  const {
    tag,
    label,
    title,
    description,
    creditLine,
    filename,
    source
  } = options;
  const query = {
    label,
    title,
    description,
    filename,
    meta,
    creditLine
  };
  if (source) {
    query.sourceId = source.id;
    query.sourceName = source.name;
    query.sourceUrl = source.url;
  }
  return _requestObservable(client, httpRequest, {
    tag,
    method: "POST",
    timeout: options.timeout || 0,
    uri: "/assets/".concat(assetEndpoint, "/").concat(dataset),
    headers: options.contentType ? {
      "Content-Type": options.contentType
    } : {},
    query,
    body
  });
}
function optionsFromFile(opts, file) {
  if (typeof File === "undefined" || !(file instanceof File)) {
    return opts;
  }
  return Object.assign({
    filename: opts.preserveFilename === false ? void 0 : file.name,
    contentType: file.type
  }, opts);
}
var defaults = (obj, defaults) => Object.keys(defaults).concat(Object.keys(obj)).reduce((target, prop) => {
  target[prop] = typeof obj[prop] === "undefined" ? defaults[prop] : obj[prop];
  return target;
}, {});
const pick = (obj, props) => props.reduce((selection, prop) => {
  if (typeof obj[prop] === "undefined") {
    return selection;
  }
  selection[prop] = obj[prop];
  return selection;
}, {});
const MAX_URL_LENGTH = 16e3 - 1200;
const possibleOptions = ["includePreviousRevision", "includeResult", "visibility", "effectFormat", "tag"];
const defaultOptions = {
  includeResult: true
};
function _listen(query, params) {
  let opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  const {
    url,
    token,
    withCredentials,
    requestTagPrefix
  } = this.config();
  const tag = opts.tag && requestTagPrefix ? [requestTagPrefix, opts.tag].join(".") : opts.tag;
  const options = {
    ...defaults(opts, defaultOptions),
    tag
  };
  const listenOpts = pick(options, possibleOptions);
  const qs = encodeQueryString({
    query,
    params,
    options: {
      tag,
      ...listenOpts
    }
  });
  const uri = "".concat(url).concat(_getDataUrl(this, "listen", qs));
  if (uri.length > MAX_URL_LENGTH) {
    return new rxjs.Observable(observer => observer.error(new Error("Query too large for listener")));
  }
  const listenFor = options.events ? options.events : ["mutation"];
  const shouldEmitReconnect = listenFor.indexOf("reconnect") !== -1;
  const esOptions = {};
  if (token || withCredentials) {
    esOptions.withCredentials = true;
  }
  if (token) {
    esOptions.headers = {
      Authorization: "Bearer ".concat(token)
    };
  }
  return new rxjs.Observable(observer => {
    let es;
    getEventSource().then(eventSource => {
      es = eventSource;
    }).catch(reason => {
      observer.error(reason);
      stop();
    });
    let reconnectTimer;
    let stopped = false;
    function onError() {
      if (stopped) {
        return;
      }
      emitReconnect();
      if (stopped) {
        return;
      }
      if (es.readyState === es.CLOSED) {
        unsubscribe();
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(open, 100);
      }
    }
    function onChannelError(err) {
      observer.error(cooerceError(err));
    }
    function onMessage(evt) {
      const event = parseEvent(evt);
      return event instanceof Error ? observer.error(event) : observer.next(event);
    }
    function onDisconnect() {
      stopped = true;
      unsubscribe();
      observer.complete();
    }
    function unsubscribe() {
      if (!es) return;
      es.removeEventListener("error", onError);
      es.removeEventListener("channelError", onChannelError);
      es.removeEventListener("disconnect", onDisconnect);
      listenFor.forEach(type => es.removeEventListener(type, onMessage));
      es.close();
    }
    function emitReconnect() {
      if (shouldEmitReconnect) {
        observer.next({
          type: "reconnect"
        });
      }
    }
    async function getEventSource() {
      const {
        default: EventSource
      } = await import('@sanity/eventsource');
      const evs = new EventSource(uri, esOptions);
      evs.addEventListener("error", onError);
      evs.addEventListener("channelError", onChannelError);
      evs.addEventListener("disconnect", onDisconnect);
      listenFor.forEach(type => evs.addEventListener(type, onMessage));
      return evs;
    }
    function open() {
      getEventSource().then(eventSource => {
        es = eventSource;
      }).catch(reason => {
        observer.error(reason);
        stop();
      });
    }
    function stop() {
      stopped = true;
      unsubscribe();
    }
    return stop;
  });
}
function parseEvent(event) {
  try {
    const data = event.data && JSON.parse(event.data) || {};
    return Object.assign({
      type: event.type
    }, data);
  } catch (err) {
    return err;
  }
}
function cooerceError(err) {
  if (err instanceof Error) {
    return err;
  }
  const evt = parseEvent(err);
  return evt instanceof Error ? evt : new Error(extractErrorMessage(evt));
}
function extractErrorMessage(err) {
  if (!err.error) {
    return err.message || "Unknown listener error";
  }
  if (err.error.description) {
    return err.error.description;
  }
  return typeof err.error === "string" ? err.error : JSON.stringify(err.error, null, 2);
}
var __accessCheck$3 = (obj, member, msg) => {
  if (!member.has(obj)) throw TypeError("Cannot " + msg);
};
var __privateGet$3 = (obj, member, getter) => {
  __accessCheck$3(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd$3 = (obj, member, value) => {
  if (member.has(obj)) throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet$3 = (obj, member, value, setter) => {
  __accessCheck$3(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _client$2, _httpRequest$3, _client2$2, _httpRequest2$3;
class ObservableDatasetsClient {
  constructor(client, httpRequest) {
    __privateAdd$3(this, _client$2, void 0);
    __privateAdd$3(this, _httpRequest$3, void 0);
    __privateSet$3(this, _client$2, client);
    __privateSet$3(this, _httpRequest$3, httpRequest);
  }
  /**
   * Create a new dataset with the given name
   *
   * @param name - Name of the dataset to create
   * @param options - Options for the dataset
   */
  create(name, options) {
    return _modify(__privateGet$3(this, _client$2), __privateGet$3(this, _httpRequest$3), "PUT", name, options);
  }
  /**
   * Edit a dataset with the given name
   *
   * @param name - Name of the dataset to edit
   * @param options - New options for the dataset
   */
  edit(name, options) {
    return _modify(__privateGet$3(this, _client$2), __privateGet$3(this, _httpRequest$3), "PATCH", name, options);
  }
  /**
   * Delete a dataset with the given name
   *
   * @param name - Name of the dataset to delete
   */
  delete(name) {
    return _modify(__privateGet$3(this, _client$2), __privateGet$3(this, _httpRequest$3), "DELETE", name);
  }
  /**
   * Fetch a list of datasets for the configured project
   */
  list() {
    return _request(__privateGet$3(this, _client$2), __privateGet$3(this, _httpRequest$3), {
      uri: "/datasets",
      tag: null
    });
  }
}
_client$2 = new WeakMap();
_httpRequest$3 = new WeakMap();
class DatasetsClient {
  constructor(client, httpRequest) {
    __privateAdd$3(this, _client2$2, void 0);
    __privateAdd$3(this, _httpRequest2$3, void 0);
    __privateSet$3(this, _client2$2, client);
    __privateSet$3(this, _httpRequest2$3, httpRequest);
  }
  /**
   * Create a new dataset with the given name
   *
   * @param name - Name of the dataset to create
   * @param options - Options for the dataset
   */
  create(name, options) {
    return rxjs.lastValueFrom(_modify(__privateGet$3(this, _client2$2), __privateGet$3(this, _httpRequest2$3), "PUT", name, options));
  }
  /**
   * Edit a dataset with the given name
   *
   * @param name - Name of the dataset to edit
   * @param options - New options for the dataset
   */
  edit(name, options) {
    return rxjs.lastValueFrom(_modify(__privateGet$3(this, _client2$2), __privateGet$3(this, _httpRequest2$3), "PATCH", name, options));
  }
  /**
   * Delete a dataset with the given name
   *
   * @param name - Name of the dataset to delete
   */
  delete(name) {
    return rxjs.lastValueFrom(_modify(__privateGet$3(this, _client2$2), __privateGet$3(this, _httpRequest2$3), "DELETE", name));
  }
  /**
   * Fetch a list of datasets for the configured project
   */
  list() {
    return rxjs.lastValueFrom(_request(__privateGet$3(this, _client2$2), __privateGet$3(this, _httpRequest2$3), {
      uri: "/datasets",
      tag: null
    }));
  }
}
_client2$2 = new WeakMap();
_httpRequest2$3 = new WeakMap();
function _modify(client, httpRequest, method, name, options) {
  dataset(name);
  return _request(client, httpRequest, {
    method,
    uri: "/datasets/".concat(name),
    body: options,
    tag: null
  });
}
var __accessCheck$2 = (obj, member, msg) => {
  if (!member.has(obj)) throw TypeError("Cannot " + msg);
};
var __privateGet$2 = (obj, member, getter) => {
  __accessCheck$2(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd$2 = (obj, member, value) => {
  if (member.has(obj)) throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet$2 = (obj, member, value, setter) => {
  __accessCheck$2(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _client$1, _httpRequest$2, _client2$1, _httpRequest2$2;
class ObservableProjectsClient {
  constructor(client, httpRequest) {
    __privateAdd$2(this, _client$1, void 0);
    __privateAdd$2(this, _httpRequest$2, void 0);
    __privateSet$2(this, _client$1, client);
    __privateSet$2(this, _httpRequest$2, httpRequest);
  }
  list(options) {
    const uri = (options == null ? void 0 : options.includeMembers) === false ? "/projects?includeMembers=false" : "/projects";
    return _request(__privateGet$2(this, _client$1), __privateGet$2(this, _httpRequest$2), {
      uri
    });
  }
  /**
   * Fetch a project by project ID
   *
   * @param projectId - ID of the project to fetch
   */
  getById(projectId) {
    return _request(__privateGet$2(this, _client$1), __privateGet$2(this, _httpRequest$2), {
      uri: "/projects/".concat(projectId)
    });
  }
}
_client$1 = new WeakMap();
_httpRequest$2 = new WeakMap();
class ProjectsClient {
  constructor(client, httpRequest) {
    __privateAdd$2(this, _client2$1, void 0);
    __privateAdd$2(this, _httpRequest2$2, void 0);
    __privateSet$2(this, _client2$1, client);
    __privateSet$2(this, _httpRequest2$2, httpRequest);
  }
  list(options) {
    const uri = (options == null ? void 0 : options.includeMembers) === false ? "/projects?includeMembers=false" : "/projects";
    return rxjs.lastValueFrom(_request(__privateGet$2(this, _client2$1), __privateGet$2(this, _httpRequest2$2), {
      uri
    }));
  }
  /**
   * Fetch a project by project ID
   *
   * @param projectId - ID of the project to fetch
   */
  getById(projectId) {
    return rxjs.lastValueFrom(_request(__privateGet$2(this, _client2$1), __privateGet$2(this, _httpRequest2$2), {
      uri: "/projects/".concat(projectId)
    }));
  }
}
_client2$1 = new WeakMap();
_httpRequest2$2 = new WeakMap();
var __accessCheck$1 = (obj, member, msg) => {
  if (!member.has(obj)) throw TypeError("Cannot " + msg);
};
var __privateGet$1 = (obj, member, getter) => {
  __accessCheck$1(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd$1 = (obj, member, value) => {
  if (member.has(obj)) throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet$1 = (obj, member, value, setter) => {
  __accessCheck$1(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _client, _httpRequest$1, _client2, _httpRequest2$1;
class ObservableUsersClient {
  constructor(client, httpRequest) {
    __privateAdd$1(this, _client, void 0);
    __privateAdd$1(this, _httpRequest$1, void 0);
    __privateSet$1(this, _client, client);
    __privateSet$1(this, _httpRequest$1, httpRequest);
  }
  /**
   * Fetch a user by user ID
   *
   * @param id - User ID of the user to fetch. If `me` is provided, a minimal response including the users role is returned.
   */
  getById(id) {
    return _request(__privateGet$1(this, _client), __privateGet$1(this, _httpRequest$1), {
      uri: "/users/".concat(id)
    });
  }
}
_client = new WeakMap();
_httpRequest$1 = new WeakMap();
class UsersClient {
  constructor(client, httpRequest) {
    __privateAdd$1(this, _client2, void 0);
    __privateAdd$1(this, _httpRequest2$1, void 0);
    __privateSet$1(this, _client2, client);
    __privateSet$1(this, _httpRequest2$1, httpRequest);
  }
  /**
   * Fetch a user by user ID
   *
   * @param id - User ID of the user to fetch. If `me` is provided, a minimal response including the users role is returned.
   */
  getById(id) {
    return rxjs.lastValueFrom(_request(__privateGet$1(this, _client2), __privateGet$1(this, _httpRequest2$1), {
      uri: "/users/".concat(id)
    }));
  }
}
_client2 = new WeakMap();
_httpRequest2$1 = new WeakMap();
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj)) throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj)) throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _clientConfig, _httpRequest, _clientConfig2, _httpRequest2;
const _ObservableSanityClient = class _ObservableSanityClient {
  constructor(httpRequest) {
    let config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultConfig;
    /**
     * Private properties
     */
    __privateAdd(this, _clientConfig, void 0);
    __privateAdd(this, _httpRequest, void 0);
    /**
     * Instance properties
     */
    this.listen = _listen;
    this.config(config);
    __privateSet(this, _httpRequest, httpRequest);
    this.assets = new ObservableAssetsClient(this, __privateGet(this, _httpRequest));
    this.datasets = new ObservableDatasetsClient(this, __privateGet(this, _httpRequest));
    this.projects = new ObservableProjectsClient(this, __privateGet(this, _httpRequest));
    this.users = new ObservableUsersClient(this, __privateGet(this, _httpRequest));
  }
  /**
   * Clone the client - returns a new instance
   */
  clone() {
    return new _ObservableSanityClient(__privateGet(this, _httpRequest), this.config());
  }
  config(newConfig) {
    if (newConfig === void 0) {
      return {
        ...__privateGet(this, _clientConfig)
      };
    }
    if (__privateGet(this, _clientConfig) && __privateGet(this, _clientConfig).allowReconfigure === false) {
      throw new Error("Existing client instance cannot be reconfigured - use `withConfig(newConfig)` to return a new client");
    }
    __privateSet(this, _clientConfig, initConfig(newConfig, __privateGet(this, _clientConfig) || {}));
    return this;
  }
  /**
   * Clone the client with a new (partial) configuration.
   *
   * @param newConfig - New client configuration properties, shallowly merged with existing configuration
   */
  withConfig(newConfig) {
    return new _ObservableSanityClient(__privateGet(this, _httpRequest), {
      ...this.config(),
      ...newConfig
    });
  }
  fetch(query, params) {
    let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    return _fetch(this, __privateGet(this, _httpRequest), query, params, options);
  }
  /**
   * Fetch a single document with the given ID.
   *
   * @param id - Document ID to fetch
   * @param options - Request options
   */
  getDocument(id, options) {
    return _getDocument(this, __privateGet(this, _httpRequest), id, options);
  }
  /**
   * Fetch multiple documents in one request.
   * Should be used sparingly - performing a query is usually a better option.
   * The order/position of documents is preserved based on the original array of IDs.
   * If any of the documents are missing, they will be replaced by a `null` entry in the returned array
   *
   * @param ids - Document IDs to fetch
   * @param options - Request options
   */
  getDocuments(ids, options) {
    return _getDocuments(this, __privateGet(this, _httpRequest), ids, options);
  }
  create(document, options) {
    return _create(this, __privateGet(this, _httpRequest), document, "create", options);
  }
  createIfNotExists(document, options) {
    return _createIfNotExists(this, __privateGet(this, _httpRequest), document, options);
  }
  createOrReplace(document, options) {
    return _createOrReplace(this, __privateGet(this, _httpRequest), document, options);
  }
  delete(selection, options) {
    return _delete(this, __privateGet(this, _httpRequest), selection, options);
  }
  mutate(operations, options) {
    return _mutate(this, __privateGet(this, _httpRequest), operations, options);
  }
  /**
   * Create a new buildable patch of operations to perform
   *
   * @param selection - Document ID, an array of document IDs, or an object with `query` and optional `params`, defining which document(s) to patch
   * @param operations - Optional object of patch operations to initialize the patch instance with
   * @returns Patch instance - call `.commit()` to perform the operations defined
   */
  patch(selection, operations) {
    return new ObservablePatch(selection, operations, this);
  }
  /**
   * Create a new transaction of mutations
   *
   * @param operations - Optional array of mutation operations to initialize the transaction instance with
   */
  transaction(operations) {
    return new ObservableTransaction(operations, this);
  }
  /**
   * Perform an HTTP request against the Sanity API
   *
   * @param options - Request options
   */
  request(options) {
    return _request(this, __privateGet(this, _httpRequest), options);
  }
  /**
   * Get a Sanity API URL for the URI provided
   *
   * @param uri - URI/path to build URL for
   * @param canUseCdn - Whether or not to allow using the API CDN for this route
   */
  getUrl(uri, canUseCdn) {
    return _getUrl(this, uri, canUseCdn);
  }
  /**
   * Get a Sanity API URL for the data operation and path provided
   *
   * @param operation - Data operation (eg `query`, `mutate`, `listen` or similar)
   * @param path - Path to append after the operation
   */
  getDataUrl(operation, path) {
    return _getDataUrl(this, operation, path);
  }
};
_clientConfig = new WeakMap();
_httpRequest = new WeakMap();
let ObservableSanityClient = _ObservableSanityClient;
const _SanityClient = class _SanityClient {
  constructor(httpRequest) {
    let config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultConfig;
    /**
     * Private properties
     */
    __privateAdd(this, _clientConfig2, void 0);
    __privateAdd(this, _httpRequest2, void 0);
    /**
     * Instance properties
     */
    this.listen = _listen;
    this.config(config);
    __privateSet(this, _httpRequest2, httpRequest);
    this.assets = new AssetsClient(this, __privateGet(this, _httpRequest2));
    this.datasets = new DatasetsClient(this, __privateGet(this, _httpRequest2));
    this.projects = new ProjectsClient(this, __privateGet(this, _httpRequest2));
    this.users = new UsersClient(this, __privateGet(this, _httpRequest2));
    this.observable = new ObservableSanityClient(httpRequest, config);
  }
  /**
   * Clone the client - returns a new instance
   */
  clone() {
    return new _SanityClient(__privateGet(this, _httpRequest2), this.config());
  }
  config(newConfig) {
    if (newConfig === void 0) {
      return {
        ...__privateGet(this, _clientConfig2)
      };
    }
    if (__privateGet(this, _clientConfig2) && __privateGet(this, _clientConfig2).allowReconfigure === false) {
      throw new Error("Existing client instance cannot be reconfigured - use `withConfig(newConfig)` to return a new client");
    }
    if (this.observable) {
      this.observable.config(newConfig);
    }
    __privateSet(this, _clientConfig2, initConfig(newConfig, __privateGet(this, _clientConfig2) || {}));
    return this;
  }
  /**
   * Clone the client with a new (partial) configuration.
   *
   * @param newConfig - New client configuration properties, shallowly merged with existing configuration
   */
  withConfig(newConfig) {
    return new _SanityClient(__privateGet(this, _httpRequest2), {
      ...this.config(),
      ...newConfig
    });
  }
  fetch(query, params) {
    let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    return rxjs.lastValueFrom(_fetch(this, __privateGet(this, _httpRequest2), query, params, options));
  }
  /**
   * Fetch a single document with the given ID.
   *
   * @param id - Document ID to fetch
   * @param options - Request options
   */
  getDocument(id, options) {
    return rxjs.lastValueFrom(_getDocument(this, __privateGet(this, _httpRequest2), id, options));
  }
  /**
   * Fetch multiple documents in one request.
   * Should be used sparingly - performing a query is usually a better option.
   * The order/position of documents is preserved based on the original array of IDs.
   * If any of the documents are missing, they will be replaced by a `null` entry in the returned array
   *
   * @param ids - Document IDs to fetch
   * @param options - Request options
   */
  getDocuments(ids, options) {
    return rxjs.lastValueFrom(_getDocuments(this, __privateGet(this, _httpRequest2), ids, options));
  }
  create(document, options) {
    return rxjs.lastValueFrom(_create(this, __privateGet(this, _httpRequest2), document, "create", options));
  }
  createIfNotExists(document, options) {
    return rxjs.lastValueFrom(_createIfNotExists(this, __privateGet(this, _httpRequest2), document, options));
  }
  createOrReplace(document, options) {
    return rxjs.lastValueFrom(_createOrReplace(this, __privateGet(this, _httpRequest2), document, options));
  }
  delete(selection, options) {
    return rxjs.lastValueFrom(_delete(this, __privateGet(this, _httpRequest2), selection, options));
  }
  mutate(operations, options) {
    return rxjs.lastValueFrom(_mutate(this, __privateGet(this, _httpRequest2), operations, options));
  }
  /**
   * Create a new buildable patch of operations to perform
   *
   * @param selection - Document ID, an array of document IDs, or an object with `query` and optional `params`, defining which document(s) to patch
   * @param operations - Optional object of patch operations to initialize the patch instance with
   * @returns Patch instance - call `.commit()` to perform the operations defined
   */
  patch(documentId, operations) {
    return new Patch(documentId, operations, this);
  }
  /**
   * Create a new transaction of mutations
   *
   * @param operations - Optional array of mutation operations to initialize the transaction instance with
   */
  transaction(operations) {
    return new Transaction(operations, this);
  }
  /**
   * Perform a request against the Sanity API
   * NOTE: Only use this for Sanity API endpoints, not for your own APIs!
   *
   * @param options - Request options
   * @returns Promise resolving to the response body
   */
  request(options) {
    return rxjs.lastValueFrom(_request(this, __privateGet(this, _httpRequest2), options));
  }
  /**
   * Perform an HTTP request a `/data` sub-endpoint
   * NOTE: Considered internal, thus marked as deprecated. Use `request` instead.
   *
   * @deprecated - Use `request()` or your own HTTP library instead
   * @param endpoint - Endpoint to hit (mutate, query etc)
   * @param body - Request body
   * @param options - Request options
   * @internal
   */
  dataRequest(endpoint, body, options) {
    return rxjs.lastValueFrom(_dataRequest(this, __privateGet(this, _httpRequest2), endpoint, body, options));
  }
  /**
   * Get a Sanity API URL for the URI provided
   *
   * @param uri - URI/path to build URL for
   * @param canUseCdn - Whether or not to allow using the API CDN for this route
   */
  getUrl(uri, canUseCdn) {
    return _getUrl(this, uri, canUseCdn);
  }
  /**
   * Get a Sanity API URL for the data operation and path provided
   *
   * @param operation - Data operation (eg `query`, `mutate`, `listen` or similar)
   * @param path - Path to append after the operation
   */
  getDataUrl(operation, path) {
    return _getDataUrl(this, operation, path);
  }
};
_clientConfig2 = new WeakMap();
_httpRequest2 = new WeakMap();
let SanityClient = _SanityClient;
function defineCreateClientExports(envMiddleware, ClassConstructor) {
  const httpRequest = defineHttpRequest(envMiddleware, {});
  const requester = httpRequest.defaultRequester;
  const createClient = config => new ClassConstructor(defineHttpRequest(envMiddleware, {
    maxRetries: config.maxRetries,
    retryDelay: config.retryDelay
  }), config);
  return {
    requester,
    createClient
  };
}
var envMiddleware = [];
exports.BasePatch = BasePatch;
exports.BaseTransaction = BaseTransaction;
exports.ClientError = ClientError;
exports.ObservablePatch = ObservablePatch;
exports.ObservableSanityClient = ObservableSanityClient;
exports.ObservableTransaction = ObservableTransaction;
exports.Patch = Patch;
exports.SanityClient = SanityClient;
exports.ServerError = ServerError;
exports.Transaction = Transaction;
exports.defaultConfig = defaultConfig;
exports.defineCreateClientExports = defineCreateClientExports;
exports.envMiddleware = envMiddleware;
exports.printNoDefaultExport = printNoDefaultExport;
//# sourceMappingURL=browserMiddleware-hi8PGbSU.cjs.map
