import { ObservableSanityClient, defaultConfig, SanityClient, defineCreateClientExports, envMiddleware } from './_chunks/browserMiddleware-eLzHI4Fk.js';
export { BasePatch, BaseTransaction, ClientError, ObservablePatch, ObservableTransaction, Patch, ServerError, Transaction } from './_chunks/browserMiddleware-eLzHI4Fk.js';
import { map } from 'rxjs/operators';
import { vercelStegaCombine, vercelStegaSplit } from '@vercel/stega';
export { adapter as unstable__adapter, environment as unstable__environment } from 'get-it';
const defaultStegaConfig = {
  enabled: false,
  filter: props => props.filterDefault(props)
};
function splitConfig(config) {
  const {
    stega = {},
    ...clientConfig
  } = config;
  return {
    clientConfig,
    stegaConfig: typeof stega === "boolean" ? {
      enabled: stega
    } : stega
  };
}
const initStegaConfig = (config, prevConfig) => {
  const specifiedConfig = Object.assign({}, prevConfig, config);
  const newConfig = Object.assign({}, defaultStegaConfig, specifiedConfig);
  if ("encodeSourceMap" in newConfig) {
    throw new Error("It looks like you're using options meant for '@sanity/preview-kit/client'. 'encodeSourceMap' is not supported in '@sanity/client/stega'. Did you mean 'enabled'?");
  }
  if ("encodeSourceMapAtPath" in newConfig) {
    throw new Error("It looks like you're using options meant for '@sanity/preview-kit/client'. 'encodeSourceMapAtPath' is not supported in '@sanity/client/stega'. Did you mean 'filter'?");
  }
  if (typeof newConfig.enabled !== "boolean") {
    throw new Error("config.enabled must be a boolean, received ".concat(newConfig.enabled));
  }
  if (newConfig.enabled && newConfig.studioUrl === void 0) {
    throw new Error("config.studioUrl must be defined when config.enabled is true");
  }
  if (newConfig.enabled && typeof newConfig.studioUrl !== "string" && typeof newConfig.studioUrl !== "function") {
    throw new Error("config.studioUrl must be a string or a function, received ".concat(newConfig.studioUrl));
  }
  return newConfig;
};
function splitStegaConfigFromFetchOptions(options, initializedStegaConfig) {
  const {
    stega = {},
    ...fetchOptions
  } = options;
  const stegaConfig = initStegaConfig(typeof stega === "boolean" ? {
    enabled: stega
  } : stega, initializedStegaConfig);
  return {
    fetchOptions,
    stegaConfig
  };
}
const DRAFTS_PREFIX = "drafts.";
function getPublishedId(id) {
  if (id.startsWith(DRAFTS_PREFIX)) {
    return id.slice(DRAFTS_PREFIX.length);
  }
  return id;
}
const reKeySegment = /_key\s*==\s*['"](.*)['"]/;
function isKeySegment(segment) {
  if (typeof segment === "string") {
    return reKeySegment.test(segment.trim());
  }
  return typeof segment === "object" && "_key" in segment;
}
function toString(path) {
  if (!Array.isArray(path)) {
    throw new Error("Path is not an array");
  }
  return path.reduce((target, segment, i) => {
    const segmentType = typeof segment;
    if (segmentType === "number") {
      return "".concat(target, "[").concat(segment, "]");
    }
    if (segmentType === "string") {
      const separator = i === 0 ? "" : ".";
      return "".concat(target).concat(separator).concat(segment);
    }
    if (isKeySegment(segment) && segment._key) {
      return "".concat(target, '[_key=="').concat(segment._key, '"]');
    }
    if (Array.isArray(segment)) {
      const [from, to] = segment;
      return "".concat(target, "[").concat(from, ":").concat(to, "]");
    }
    throw new Error("Unsupported path segment `".concat(JSON.stringify(segment), "`"));
  }, "");
}
const ESCAPE = {
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "'": "\\'",
  "\\": "\\\\"
};
const UNESCAPE = {
  "\\f": "\f",
  "\\n": "\n",
  "\\r": "\r",
  "\\t": "	",
  "\\'": "'",
  "\\\\": "\\"
};
function jsonPath(path) {
  return "$".concat(path.map(segment => {
    if (typeof segment === "string") {
      const escapedKey = segment.replace(/[\f\n\r\t'\\]/g, match => {
        return ESCAPE[match];
      });
      return "['".concat(escapedKey, "']");
    }
    if (typeof segment === "number") {
      return "[".concat(segment, "]");
    }
    if (segment._key !== "") {
      const escapedKey = segment._key.replace(/['\\]/g, match => {
        return ESCAPE[match];
      });
      return "[?(@._key=='".concat(escapedKey, "')]");
    }
    return "[".concat(segment._index, "]");
  }).join(""));
}
function parseJsonPath(path) {
  const parsed = [];
  const parseRe = /\['(.*?)'\]|\[(\d+)\]|\[\?\(@\._key=='(.*?)'\)\]/g;
  let match;
  while ((match = parseRe.exec(path)) !== null) {
    if (match[1] !== void 0) {
      const key = match[1].replace(/\\(\\|f|n|r|t|')/g, m => {
        return UNESCAPE[m];
      });
      parsed.push(key);
      continue;
    }
    if (match[2] !== void 0) {
      parsed.push(parseInt(match[2], 10));
      continue;
    }
    if (match[3] !== void 0) {
      const _key = match[3].replace(/\\(\\')/g, m => {
        return UNESCAPE[m];
      });
      parsed.push({
        _key,
        _index: -1
      });
      continue;
    }
  }
  return parsed;
}
function jsonPathToStudioPath(path) {
  return path.map(segment => {
    if (typeof segment === "string") {
      return segment;
    }
    if (typeof segment === "number") {
      return segment;
    }
    if (segment._key !== "") {
      return {
        _key: segment._key
      };
    }
    if (segment._index !== -1) {
      return segment._index;
    }
    throw new Error("invalid segment:".concat(JSON.stringify(segment)));
  });
}
function jsonPathToMappingPath(path) {
  return path.map(segment => {
    if (typeof segment === "string") {
      return segment;
    }
    if (typeof segment === "number") {
      return segment;
    }
    if (segment._index !== -1) {
      return segment._index;
    }
    throw new Error("invalid segment:".concat(JSON.stringify(segment)));
  });
}
function createEditUrl(options) {
  const {
    baseUrl,
    workspace: _workspace = "default",
    tool: _tool = "default",
    id: _id,
    type,
    path
  } = options;
  if (!baseUrl) {
    throw new Error("baseUrl is required");
  }
  if (!path) {
    throw new Error("path is required");
  }
  if (!_id) {
    throw new Error("id is required");
  }
  if (baseUrl !== "/" && baseUrl.endsWith("/")) {
    throw new Error("baseUrl must not end with a slash");
  }
  const workspace = _workspace === "default" ? void 0 : _workspace;
  const tool = _tool === "default" ? void 0 : _tool;
  const id = getPublishedId(_id);
  const stringifiedPath = Array.isArray(path) ? toString(jsonPathToStudioPath(path)) : path;
  const searchParams = new URLSearchParams({
    baseUrl,
    id,
    type,
    path: stringifiedPath
  });
  if (workspace) {
    searchParams.set("workspace", workspace);
  }
  if (tool) {
    searchParams.set("tool", tool);
  }
  const segments = [baseUrl === "/" ? "" : baseUrl];
  if (workspace) {
    segments.push(workspace);
  }
  const routerParams = ["mode=presentation", "id=".concat(id), "type=".concat(type), "path=".concat(encodeURIComponent(stringifiedPath))];
  if (tool) {
    routerParams.push("tool=".concat(tool));
  }
  segments.push("intent", "edit", "".concat(routerParams.join(";"), "?").concat(searchParams));
  return segments.join("/");
}
function resolveMapping(resultPath, csm) {
  if (!(csm == null ? void 0 : csm.mappings)) {
    return void 0;
  }
  const resultMappingPath = jsonPath(jsonPathToMappingPath(resultPath));
  if (csm.mappings[resultMappingPath] !== void 0) {
    return {
      mapping: csm.mappings[resultMappingPath],
      matchedPath: resultMappingPath,
      pathSuffix: ""
    };
  }
  const mappings = Object.entries(csm.mappings).filter(_ref => {
    let [key] = _ref;
    return resultMappingPath.startsWith(key);
  }).sort((_ref2, _ref3) => {
    let [key1] = _ref2;
    let [key2] = _ref3;
    return key2.length - key1.length;
  });
  if (mappings.length == 0) {
    return void 0;
  }
  const [matchedPath, mapping] = mappings[0];
  const pathSuffix = resultMappingPath.substring(matchedPath.length);
  return {
    mapping,
    matchedPath,
    pathSuffix
  };
}
function resolveStudioBaseRoute(studioUrl) {
  let baseUrl = typeof studioUrl === "string" ? studioUrl : studioUrl.baseUrl;
  if (baseUrl !== "/") {
    baseUrl = baseUrl.replace(/\/$/, "");
  }
  if (typeof studioUrl === "string") {
    return {
      baseUrl
    };
  }
  return {
    ...studioUrl,
    baseUrl
  };
}
function isArray(value) {
  return value !== null && Array.isArray(value);
}
function isRecord(value) {
  return typeof value === "object" && value !== null;
}
function walkMap(value, mappingFn) {
  let path = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  if (isArray(value)) {
    return value.map((v, idx) => {
      if (isRecord(v)) {
        const _key = v["_key"];
        if (typeof _key === "string") {
          return walkMap(v, mappingFn, path.concat({
            _key,
            _index: idx
          }));
        }
      }
      return walkMap(v, mappingFn, path.concat(idx));
    });
  }
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(_ref4 => {
      let [k, v] = _ref4;
      return [k, walkMap(v, mappingFn, path.concat(k))];
    }));
  }
  return mappingFn(value, path);
}
function encodeIntoResult(result, csm, encoder) {
  return walkMap(result, (value, path) => {
    if (typeof value !== "string") {
      return value;
    }
    const resolveMappingResult = resolveMapping(path, csm);
    if (!resolveMappingResult) {
      return value;
    }
    const {
      mapping,
      matchedPath
    } = resolveMappingResult;
    if (mapping.type !== "value") {
      return value;
    }
    if (mapping.source.type !== "documentValue") {
      return value;
    }
    const sourceDocument = csm.documents[mapping.source.document];
    const sourcePath = csm.paths[mapping.source.path];
    const matchPathSegments = parseJsonPath(matchedPath);
    const sourcePathSegments = parseJsonPath(sourcePath);
    const fullSourceSegments = sourcePathSegments.concat(path.slice(matchPathSegments.length));
    return encoder({
      sourcePath: fullSourceSegments,
      sourceDocument,
      resultPath: path,
      value
    });
  });
}
const filterDefault = _ref5 => {
  let {
    sourcePath,
    value
  } = _ref5;
  if (isValidDate(value) || isValidURL(value)) {
    return false;
  }
  const endPath = sourcePath.at(-1);
  if (sourcePath.at(-2) === "slug" && endPath === "current") {
    return false;
  }
  if (typeof endPath === "string" && endPath.startsWith("_")) {
    return false;
  }
  if (typeof endPath === "number" && sourcePath.at(-2) === "marks") {
    return false;
  }
  if (endPath === "href" && typeof sourcePath.at(-2) === "number" && sourcePath.at(-3) === "markDefs") {
    return false;
  }
  if (endPath === "style" || endPath === "listItem") {
    return false;
  }
  if (sourcePath.some(path => path === "meta" || path === "metadata" || path === "openGraph" || path === "seo")) {
    return false;
  }
  if (typeof endPath === "string" && denylist.has(endPath)) {
    return false;
  }
  return true;
};
const denylist = /* @__PURE__ */new Set(["color", "colour", "currency", "email", "format", "gid", "hex", "href", "hsl", "hsla", "icon", "id", "index", "key", "language", "layout", "link", "linkAction", "locale", "lqip", "page", "path", "ref", "rgb", "rgba", "route", "secret", "slug", "status", "tag", "template", "theme", "type", "unit", "url", "username", "variant", "website"]);
function isValidDate(dateString) {
  return Number.isNaN(Number(dateString)) ? Boolean(Date.parse(dateString)) : false;
}
function isValidURL(url) {
  try {
    new URL(url, url.startsWith("/") ? "https://acme.com" : void 0);
  } catch {
    return false;
  }
  return true;
}
const TRUNCATE_LENGTH = 20;
function stegaEncodeSourceMap(result, resultSourceMap, config) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const {
    filter,
    logger,
    enabled
  } = config;
  if (!enabled) {
    const msg = "config.enabled must be true, don't call this function otherwise";
    (_a = logger == null ? void 0 : logger.error) == null ? void 0 : _a.call(logger, "[@sanity/client/stega]: ".concat(msg), {
      result,
      resultSourceMap,
      config
    });
    throw new TypeError(msg);
  }
  if (!resultSourceMap) {
    (_b = logger == null ? void 0 : logger.error) == null ? void 0 : _b.call(logger, "[@sanity/client/stega]: Missing Content Source Map from response body", {
      result,
      resultSourceMap,
      config
    });
    return result;
  }
  if (!config.studioUrl) {
    const msg = "config.studioUrl must be defined";
    (_c = logger == null ? void 0 : logger.error) == null ? void 0 : _c.call(logger, "[@sanity/client/stega]: ".concat(msg), {
      result,
      resultSourceMap,
      config
    });
    throw new TypeError(msg);
  }
  const report = {
    encoded: [],
    skipped: []
  };
  const resultWithStega = encodeIntoResult(result, resultSourceMap, _ref6 => {
    let {
      sourcePath,
      sourceDocument,
      resultPath,
      value
    } = _ref6;
    if ((typeof filter === "function" ? filter({
      sourcePath,
      resultPath,
      filterDefault,
      sourceDocument,
      value
    }) : filterDefault({
      sourcePath,
      resultPath,
      filterDefault,
      sourceDocument,
      value
    })) === false) {
      if (logger) {
        report.skipped.push({
          path: prettyPathForLogging(sourcePath),
          value: "".concat(value.slice(0, TRUNCATE_LENGTH)).concat(value.length > TRUNCATE_LENGTH ? "..." : ""),
          length: value.length
        });
      }
      return value;
    }
    if (logger) {
      report.encoded.push({
        path: prettyPathForLogging(sourcePath),
        value: "".concat(value.slice(0, TRUNCATE_LENGTH)).concat(value.length > TRUNCATE_LENGTH ? "..." : ""),
        length: value.length
      });
    }
    const {
      baseUrl,
      workspace,
      tool
    } = resolveStudioBaseRoute(typeof config.studioUrl === "function" ? config.studioUrl(sourceDocument) : config.studioUrl);
    if (!baseUrl) return value;
    const {
      _id: id,
      _type: type
    } = sourceDocument;
    return vercelStegaCombine(value, {
      origin: "sanity.io",
      href: createEditUrl({
        baseUrl,
        workspace,
        tool,
        id,
        type,
        path: sourcePath
      })
    },
    // We use custom logic to determine if we should skip encoding
    false);
  });
  if (logger) {
    const isSkipping = report.skipped.length;
    const isEncoding = report.encoded.length;
    if (isSkipping || isEncoding) {
      (_d = (logger == null ? void 0 : logger.groupCollapsed) || logger.log) == null ? void 0 : _d("[@sanity/client/stega]: Encoding source map into result");
      (_e = logger.log) == null ? void 0 : _e.call(logger, "[@sanity/client/stega]: Paths encoded: ".concat(report.encoded.length, ", skipped: ").concat(report.skipped.length));
    }
    if (report.encoded.length > 0) {
      (_f = logger == null ? void 0 : logger.log) == null ? void 0 : _f.call(logger, "[@sanity/client/stega]: Table of encoded paths");
      (_g = (logger == null ? void 0 : logger.table) || logger.log) == null ? void 0 : _g(report.encoded);
    }
    if (report.skipped.length > 0) {
      const skipped = /* @__PURE__ */new Set();
      for (const {
        path
      } of report.skipped) {
        skipped.add(path.replace(reKeySegment, "0").replace(/\[\d+\]/g, "[]"));
      }
      (_h = logger == null ? void 0 : logger.log) == null ? void 0 : _h.call(logger, "[@sanity/client/stega]: List of skipped paths", [...skipped.values()]);
    }
    if (isSkipping || isEncoding) {
      (_i = logger == null ? void 0 : logger.groupEnd) == null ? void 0 : _i.call(logger);
    }
  }
  return resultWithStega;
}
function prettyPathForLogging(path) {
  return toString(jsonPathToStudioPath(path));
}
function vercelStegaCleanAll(result) {
  return JSON.parse(JSON.stringify(result, (key, value) => {
    if (typeof value !== "string") return value;
    return vercelStegaSplit(value).cleaned;
  }));
}
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
var _httpRequest, _httpRequest2;
const _ObservableSanityStegaClient = class _ObservableSanityStegaClient extends ObservableSanityClient {
  constructor(httpRequest) {
    let config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultConfig;
    const {
      clientConfig,
      stegaConfig
    } = splitConfig(config);
    super(httpRequest, clientConfig);
    /**
     * Private properties
     */
    __privateAdd(this, _httpRequest, void 0);
    __privateSet(this, _httpRequest, httpRequest);
    this.stegaConfig = initStegaConfig(stegaConfig, defaultStegaConfig);
  }
  /**
   * Clone the client - returns a new instance
   */
  clone() {
    return new _ObservableSanityStegaClient(__privateGet(this, _httpRequest), this.config());
  }
  config(newConfig) {
    if (newConfig === void 0) {
      return {
        ...super.config(),
        stega: {
          ...this.stegaConfig
        }
      };
    }
    const {
      clientConfig,
      stegaConfig
    } = splitConfig(newConfig);
    super.config(clientConfig);
    this.stegaConfig = initStegaConfig(stegaConfig, this.stegaConfig || {});
    return this;
  }
  /**
   * Clone the client with a new (partial) configuration.
   *
   * @param newConfig - New client configuration properties, shallowly merged with existing configuration
   */
  withConfig(newConfig) {
    const thisConfig = this.config();
    const {
      stegaConfig
    } = splitConfig(newConfig || {});
    return new _ObservableSanityStegaClient(__privateGet(this, _httpRequest), {
      ...thisConfig,
      ...newConfig,
      stega: {
        ...(thisConfig.stega || {}),
        ...(stegaConfig || {})
      }
    });
  }
  fetch(query, _params) {
    let _options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    const {
      stegaConfig,
      fetchOptions: options
    } = splitStegaConfigFromFetchOptions(_options, this.stegaConfig);
    const params = _params ? vercelStegaCleanAll(_params) : _params;
    if (!stegaConfig.enabled) {
      return super.fetch(query, params, options);
    }
    const {
      filterResponse: originalFilterResponse = true
    } = options;
    return super.fetch(query, params, Object.assign({}, options, {
      filterResponse: false,
      resultSourceMap: "withKeyArraySelector"
    })).pipe(map(res => {
      const {
        result: _result,
        resultSourceMap
      } = res;
      const result = stegaEncodeSourceMap(_result, resultSourceMap, stegaConfig);
      return originalFilterResponse ? result : {
        ...res,
        result
      };
    }));
  }
};
_httpRequest = new WeakMap();
let ObservableSanityStegaClient = _ObservableSanityStegaClient;
const _SanityStegaClient = class _SanityStegaClient extends SanityClient {
  constructor(httpRequest) {
    let config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultConfig;
    const {
      clientConfig,
      stegaConfig
    } = splitConfig(config);
    super(httpRequest, clientConfig);
    /**
     * Private properties
     */
    __privateAdd(this, _httpRequest2, void 0);
    __privateSet(this, _httpRequest2, httpRequest);
    this.stegaConfig = initStegaConfig(stegaConfig, defaultStegaConfig);
    this.observable = new ObservableSanityStegaClient(httpRequest, config);
  }
  /**
   * Clone the client - returns a new instance
   */
  clone() {
    return new _SanityStegaClient(__privateGet(this, _httpRequest2), this.config());
  }
  config(newConfig) {
    if (newConfig === void 0) {
      return {
        ...super.config(),
        stega: {
          ...this.stegaConfig
        }
      };
    }
    const {
      clientConfig,
      stegaConfig
    } = splitConfig(newConfig);
    super.config(clientConfig);
    this.stegaConfig = initStegaConfig(stegaConfig, {
      ...(this.stegaConfig || {})
    });
    return this;
  }
  /**
   * Clone the client with a new (partial) configuration.
   *
   * @param newConfig - New client configuration properties, shallowly merged with existing configuration
   */
  withConfig(newConfig) {
    const thisConfig = this.config();
    const {
      stegaConfig
    } = splitConfig(newConfig || {});
    return new _SanityStegaClient(__privateGet(this, _httpRequest2), {
      ...thisConfig,
      ...newConfig,
      stega: {
        ...(thisConfig.stega || {}),
        ...(stegaConfig || {})
      }
    });
  }
  fetch(query, _params) {
    let _options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    const {
      stegaConfig,
      fetchOptions: options
    } = splitStegaConfigFromFetchOptions(_options, this.stegaConfig);
    const params = _params ? vercelStegaCleanAll(_params) : _params;
    if (!stegaConfig.enabled) {
      return super.fetch(query, params, options);
    }
    const {
      filterResponse: originalFilterResponse = true
    } = options;
    return super.fetch(query, params, Object.assign({}, options, {
      filterResponse: false,
      resultSourceMap: "withKeyArraySelector"
    })).then(res => {
      const {
        result: _result,
        resultSourceMap
      } = res;
      const result = stegaEncodeSourceMap(_result, resultSourceMap, stegaConfig);
      return originalFilterResponse ? result : {
        ...res,
        result
      };
    });
  }
};
_httpRequest2 = new WeakMap();
let SanityStegaClient = _SanityStegaClient;
const exp = defineCreateClientExports(envMiddleware, SanityStegaClient);
const requester = exp.requester;
const createClient = exp.createClient;
export { ObservableSanityClient, ObservableSanityStegaClient, SanityClient, SanityStegaClient, createClient, encodeIntoResult, requester, stegaEncodeSourceMap, vercelStegaCleanAll };
//# sourceMappingURL=stega.browser.js.map
