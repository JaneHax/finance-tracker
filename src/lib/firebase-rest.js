const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts`;
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

let _idToken = null;
let _refreshToken = null;
let _uid = null;
let _listeners = [];

function getStoredAuth() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("fb_auth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeAuth(data) {
  if (typeof window === "undefined") return;
  if (data) {
    localStorage.setItem("fb_auth", JSON.stringify(data));
  } else {
    localStorage.removeItem("fb_auth");
  }
}

function notifyListeners(user) {
  _listeners.forEach((cb) => {
    try { cb(user); } catch {}
  });
}

async function refreshIdToken() {
  if (!_refreshToken) return null;
  try {
    const res = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: _refreshToken,
        }),
      }
    );
    const data = await res.json();
    if (data.id_token) {
      _idToken = data.id_token;
      _refreshToken = data.refresh_token || _refreshToken;
      storeAuth({ idToken: _idToken, refreshToken: _refreshToken, uid: _uid });
      return _idToken;
    }
  } catch {}
  return null;
}

async function authedFetch(url, options = {}) {
  let token = _idToken;
  if (!token) token = await refreshIdToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    token = await refreshIdToken();
    if (!token) throw new Error("Token expired");
    return fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
    });
  }
  return res;
}

function publicFetch(url, options = {}) {
  const sep = url.includes("?") ? "&" : "?";
  return fetch(`${url}${sep}key=${API_KEY}`, options);
}

export function onAuthStateChanged(callback) {
  _listeners.push(callback);
  const stored = getStoredAuth();
  if (stored && stored.refreshToken) {
    _idToken = stored.idToken;
    _refreshToken = stored.refreshToken;
    _uid = stored.uid;
    refreshIdToken().then((t) => {
      if (t) callback({ uid: _uid });
      else { clearAuth(); callback(null); }
    });
  } else {
    setTimeout(() => callback(null), 0);
  }
  return () => {
    _listeners = _listeners.filter((cb) => cb !== callback);
  };
}

function clearAuth() {
  _idToken = null;
  _refreshToken = null;
  _uid = null;
  storeAuth(null);
}

export async function createUser(email, password) {
  const res = await fetch(`${AUTH_URL}:signUp?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  _idToken = data.idToken;
  _refreshToken = data.refreshToken;
  _uid = data.localId;
  storeAuth({ idToken: _idToken, refreshToken: _refreshToken, uid: _uid });
  notifyListeners({ uid: _uid });
  return { uid: data.localId, email: data.email };
}

export async function signInUser(email, password) {
  const res = await fetch(`${AUTH_URL}:signInWithPassword?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  _idToken = data.idToken;
  _refreshToken = data.refreshToken;
  _uid = data.localId;
  storeAuth({ idToken: _idToken, refreshToken: _refreshToken, uid: _uid });
  notifyListeners({ uid: _uid });
  return { uid: data.localId, email: data.email };
}

export async function signOutUser() {
  clearAuth();
  notifyListeners(null);
}

export async function sendResetPassword(email) {
  const res = await fetch(`${AUTH_URL}:sendOobCode?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
}

export async function getDocById(collection, docId) {
  const url = `${FIRESTORE_URL}/${collection}/${docId}`;
  const res = await authedFetch(url);
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const data = await res.json();
  return firestoreToObj(data);
}

export async function setDocById(collection, docId, data) {
  const url = `${FIRESTORE_URL}/${collection}/${docId}`;
  const res = await authedFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(objToFirestore(data)),
  });
  return res.json();
}

export async function queryCollection(collection, field, value, limitCount, authed = false) {
  const url = `${FIRESTORE_URL}:runQuery`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      where: {
        fieldFilter: {
          field: { fieldPath: field },
          op: "EQUAL",
          value: toFirestoreValue(value),
        },
      },
      limit: limitCount || 1,
    },
  };

  const fetcher = authed ? authedFetch : publicFetch;
  const res = await fetcher(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text();
    console.error("Firestore query error:", res.status, errBody);
    return [];
  }
  const arr = await res.json();
  return arr
    .filter((r) => r.document)
    .map((r) => ({ id: r.document.name.split("/").pop(), ...firestoreToObj(r.document) }));
}

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "number")
    return Number.isInteger(val) ? { integerValue: val } : { doubleValue: val };
  if (typeof val === "boolean") return { booleanValue: val };
  if (Array.isArray(val))
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === "object") {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function objToFirestore(obj) {
  if (obj === null || obj === undefined) return { nullValue: null };
  if (Array.isArray(obj))
    return { arrayValue: { values: obj.map(toFirestoreValue) } };
  if (typeof obj === "object") {
    const fields = {};
    for (const [k, v] of Object.entries(obj)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return toFirestoreValue(obj);
}

function firestoreToObj(doc) {
  if (!doc || !doc.fields) return {};
  const result = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    result[k] = firestoreValueToJs(v);
  }
  return result;
}

function firestoreValueToJs(val) {
  if (val === null || val === undefined) return null;
  if (val.nullValue !== undefined) return null;
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return Number(val.integerValue);
  if (val.doubleValue !== undefined) return Number(val.doubleValue);
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.timestampValue !== undefined) return val.timestampValue;
  if (val.arrayValue !== undefined)
    return (val.arrayValue.values || []).map(firestoreValueToJs);
  if (val.mapValue !== undefined) return firestoreToObj(val.mapValue);
  return null;
}

export function getCurrentUser() {
  if (_uid) return { uid: _uid };
  const stored = getStoredAuth();
  if (stored?.uid) return { uid: stored.uid };
  return null;
}
