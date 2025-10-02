const isFormData = (value) =>
  typeof FormData !== "undefined" && value instanceof FormData;

const isPlainObject = (value) =>
  Object.prototype.toString.call(value) === "[object Object]";

function createInterceptorManager() {
  const handlers = [];
  return {
    handlers,
    use(onFulfilled, onRejected) {
      handlers.push({ onFulfilled, onRejected });
      return handlers.length - 1;
    },
    eject(id) {
      if (handlers[id]) {
        handlers[id] = null;
      }
    },
  };
}

function mergeHeaders(...layers) {
  const result = {};
  for (const layer of layers) {
    if (!layer) continue;
    const entries = layer instanceof Headers ? layer.entries() : Object.entries(layer);
    for (const [key, value] of entries) {
      if (value == null) continue;
      result[key] = value;
    }
  }
  return result;
}

function combineURL(baseURL = "", url = "") {
  if (!baseURL) return url;
  if (/^([a-z][a-z\d+.-]*:)?\/\//i.test(url)) {
    return url;
  }
  const normalizedBase = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;
  if (!url) return normalizedBase;
  return url.startsWith("/")
    ? `${normalizedBase}${url}`
    : `${normalizedBase}/${url}`;
}

function appendParams(targetUrl, params) {
  if (!params || typeof params !== "object") return targetUrl;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item != null) search.append(key, String(item));
      });
    } else {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  if (!qs) return targetUrl;
  const hasQuery = targetUrl.includes("?");
  return `${targetUrl}${hasQuery ? "&" : "?"}${qs}`;
}

async function runRequestInterceptors(config, interceptors) {
  let current = config;
  for (let i = interceptors.length - 1; i >= 0; i -= 1) {
    const handler = interceptors[i];
    if (!handler) continue;
    try {
      if (handler.onFulfilled) {
        const maybe = await handler.onFulfilled(current);
        if (maybe != null) {
          current = maybe;
        }
      }
    } catch (error) {
      if (handler.onRejected) {
        const maybe = await handler.onRejected(error);
        if (maybe != null) {
          current = maybe;
          continue;
        }
      }
      throw error;
    }
  }
  return current;
}

async function runResponseSuccessInterceptors(response, interceptors) {
  let current = response;
  for (let i = 0; i < interceptors.length; i += 1) {
    const handler = interceptors[i];
    if (!handler || !handler.onFulfilled) continue;
    current = await handler.onFulfilled(current);
  }
  return current;
}

async function runResponseErrorInterceptors(error, interceptors) {
  let currentError = error;
  for (let i = 0; i < interceptors.length; i += 1) {
    const handler = interceptors[i];
    if (!handler || !handler.onRejected) continue;
    try {
      const maybe = await handler.onRejected(currentError);
      if (maybe !== undefined) {
        return maybe;
      }
    } catch (nextError) {
      currentError = nextError;
    }
  }
  throw currentError;
}

async function parseResponseBody(response, responseType) {
  if (responseType === "text") {
    return response.text();
  }
  if (responseType === "blob" && response.blob) {
    return response.blob();
  }
  if (responseType === "arraybuffer" && response.arrayBuffer) {
    return response.arrayBuffer();
  }

  if (response.status === 204 || response.status === 205 || responseType === "stream") {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch (err) {
      return null;
    }
  }
  return response.text();
}

function createAxiosLikeError(message, config, response) {
  const error = new Error(message);
  error.config = config;
  if (response) {
    error.response = response;
    error.status = response.status;
  }
  error.isAxiosError = true;
  error.toJSON = () => ({
    message: error.message,
    status: response?.status,
    config: {
      url: config?.url,
      method: config?.method,
    },
  });
  return error;
}

const axios = {
  defaults: {
    baseURL: "",
    timeout: 0,
    headers: { common: {} },
  },
  interceptors: {
    request: createInterceptorManager(),
    response: createInterceptorManager(),
  },
};

axios.isAxiosError = (err) => Boolean(err && err.isAxiosError);

axios.request = async function request(inputConfig = {}) {
  if (!inputConfig || typeof inputConfig !== "object") {
    throw new Error("Axios-like client: config must be an object");
  }

  const method = (inputConfig.method || "get").toLowerCase();
  const baseURL = inputConfig.baseURL ?? axios.defaults.baseURL;
  const headers = mergeHeaders(
    axios.defaults.headers?.common,
    axios.defaults.headers?.[method],
    inputConfig.headers,
  );
  if (!("Accept" in headers)) {
    headers.Accept = "application/json, text/plain, */*";
  }

  let config = {
    ...inputConfig,
    method,
    baseURL,
    headers,
    timeout: inputConfig.timeout ?? axios.defaults.timeout,
  };

  config = await runRequestInterceptors(config, axios.interceptors.request.handlers);

  const finalURL = appendParams(combineURL(config.baseURL, config.url), config.params);
  if (!finalURL) {
    throw new Error("Axios-like client: request url is required");
  }

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  let timeoutId;
  if (controller && config.timeout && config.timeout > 0) {
    timeoutId = setTimeout(() => {
      controller.abort();
    }, config.timeout);
  }

  const fetchConfig = {
    method: config.method.toUpperCase(),
    headers,
    signal: controller?.signal,
  };

  if (config.withCredentials) {
    fetchConfig.credentials = "include";
  } else if (config.credentials) {
    fetchConfig.credentials = config.credentials;
  }

  let body = config.data ?? config.body;
  if (body != null && method !== "get" && method !== "head") {
    if (isFormData(body)) {
      fetchConfig.body = body;
    } else if (body instanceof URLSearchParams) {
      fetchConfig.body = body;
      headers["Content-Type"] = headers["Content-Type"] || "application/x-www-form-urlencoded;charset=UTF-8";
    } else if (typeof body === "string" || body instanceof Blob || body instanceof ArrayBuffer) {
      fetchConfig.body = body;
    } else if (isPlainObject(body)) {
      fetchConfig.body = JSON.stringify(body);
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
    } else {
      fetchConfig.body = body;
    }
  }

  let fetchResponse;
  try {
    fetchResponse = await fetch(finalURL, fetchConfig);
  } catch (networkError) {
    if (timeoutId) clearTimeout(timeoutId);
    const error = createAxiosLikeError(networkError.message || "Network Error", config);
    return runResponseErrorInterceptors(error, axios.interceptors.response.handlers);
  }

  if (timeoutId) clearTimeout(timeoutId);

  const response = {
    data: await parseResponseBody(fetchResponse, config.responseType),
    status: fetchResponse.status,
    statusText: fetchResponse.statusText,
    headers: Object.fromEntries(fetchResponse.headers.entries()),
    config,
    request: null,
  };

  if (fetchResponse.ok) {
    return runResponseSuccessInterceptors(response, axios.interceptors.response.handlers);
  }

  const error = createAxiosLikeError(
    `Request failed with status code ${fetchResponse.status}`,
    config,
    response,
  );
  return runResponseErrorInterceptors(error, axios.interceptors.response.handlers);
};

["get", "delete", "head", "options"].forEach((method) => {
  axios[method] = function (url, config = {}) {
    return axios.request({ ...config, url, method });
  };
});

["post", "put", "patch"].forEach((method) => {
  axios[method] = function (url, data, config = {}) {
    return axios.request({ ...config, url, data, method });
  };
});

axios.all = (promises) => Promise.all(promises);
axios.spread = (cb) => (args) => cb(...args);
axios.CancelToken = function CancelToken() {
  throw new Error("CancelToken is not implemented in this lightweight axios replacement");
};

export default axios;
