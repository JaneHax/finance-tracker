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
  _listeners.forEach((cb) => cb(user));
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
      _refreshToken = data.refresh_token;
      storeAuth({ idToken: _idToken, refreshToken: _refreshToken, uid: _uid });
      return _idToken;
    }
  } catch {
    return null;
  }
  return null;
}

async function authedFetch(url, options = {}) {
  let token = _idToken;
  if (!token) {
    token = await refreshIdToken();
  }
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    token = await refreshIdToken();
    if (!token) throw new Error("Token expired");
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return res;
}

export function onAuthStateChanged(callback) {
  _listeners.push(callback);

  const stored = getStoredAuth();
  if (stored && stored.refreshToken) {
    _idToken = stored.idToken;
    _refreshToken = stored.refreshToken;
    _uid = stored.uid;

    refreshIdToken().then((token) => {
      if (token) {
        callback({ uid: _uid });
      } else {
        storeAuth(null);
        _idToken = null;
        _refreshToken = null;
        _uid = null;
        callback(null);
      }
    });
  } else {
    setTimeout(() => callback(null), 0);
  }

  return () => {
    _listeners = _listeners.filter((cb) => cb !== callback);
  };
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
  _idToken = null;
  _refreshToken = null;
  _uid = null;
  storeAuth(null);
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
  return data;
}

export async function getDocById(collection, docId) {
  const url = `${FIRESTORE_URL}/${collection}/${docId}`;
  const res = await authedFetch(url);
  if (res.status === 404) return null;
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

export async function queryCollection(collection, field, value, limitCount) {
  const url = `${FIRESTORE_URL}:runQuery`;
  const filter = {
    fieldFilter: {
      field: { fieldPath: field },
      op: "EQUAL",
      value: toFirestoreValue(value),
    },
  };
  const body = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      where: filter,
      limit: limitCount || 1,
    },
  };

  const res = await authedFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data
    .filter((r) => r.document)
    .map((r) => ({ id: r.document.name.split("/").pop(), ...firestoreToObj(r.document) }));
}

function toFirestoreValue(val) {
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "number") return { integerValue: val };
  if (typeof val === "boolean") return { booleanValue: val };
  return { stringValue: String(val) };
}

function objToFirestore(obj) {
  if (Array.isArray(obj)) {
    return { arrayValue: { values: obj.map((v) => objToFirestore(v)) } };
  }
  if (obj !== null && typeof obj === "object") {
    const fields = {};
    for (const [k, v] of Object.entries(obj)) {
      fields[k] = objToFirestore(v);
    }
    return { fields };
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
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return Number(val.integerValue);
  if (val.doubleValue !== undefined) return val.doubleValue;
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.arrayValue !== undefined)
    return val.arrayValue.values.map(firestoreValueToJs);
  if (val.mapValue !== undefined) return firestoreToObj(val.mapValue);
  if (val.nullValue !== undefined) return null;
  return null;
}

export function getCurrentUser() {
  if (_uid) return { uid: _uid };
  const stored = getStoredAuth();
  if (stored?.uid) return { uid: stored.uid };
  return null;
}
