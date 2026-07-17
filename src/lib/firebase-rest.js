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
  if (data) localStorage.setItem("fb_auth", JSON.stringify(data));
  else localStorage.removeItem("fb_auth");
}

function notifyListeners(user) {
  _listeners.forEach((cb) => { try { cb(user); } catch {} });
}

async function refreshIdToken() {
  if (!_refreshToken) return null;
  try {
    const res = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grant_type: "refresh_token", refresh_token: _refreshToken }),
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

function addKey(url) {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}key=${API_KEY}`;
}

function clearAuth() {
  _idToken = null; _refreshToken = null; _uid = null; storeAuth(null);
}

export function onAuthStateChanged(callback) {
  _listeners.push(callback);
  const stored = getStoredAuth();
  if (stored?.refreshToken) {
    _idToken = stored.idToken; _refreshToken = stored.refreshToken; _uid = stored.uid;
    refreshIdToken().then((t) => {
      if (t) callback({ uid: _uid });
      else { clearAuth(); callback(null); }
    });
  } else {
    setTimeout(() => callback(null), 0);
  }
  return () => { _listeners = _listeners.filter((cb) => cb !== callback); };
}

export async function createUser(email, password) {
  const res = await fetch(`${AUTH_URL}:signUp?key=${API_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  _idToken = data.idToken; _refreshToken = data.refreshToken; _uid = data.localId;
  storeAuth({ idToken: _idToken, refreshToken: _refreshToken, uid: _uid });
  notifyListeners({ uid: _uid });
  return { uid: data.localId, email: data.email };
}

export async function signInUser(email, password) {
  const res = await fetch(`${AUTH_URL}:signInWithPassword?key=${API_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  _idToken = data.idToken; _refreshToken = data.refreshToken; _uid = data.localId;
  storeAuth({ idToken: _idToken, refreshToken: _refreshToken, uid: _uid });
  notifyListeners({ uid: _uid });
  return { uid: data.localId, email: data.email };
}

export async function signOutUser() { clearAuth(); notifyListeners(null); }

export async function sendResetPassword(email) {
  const res = await fetch(`${AUTH_URL}:sendOobCode?key=${API_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
}

export async function getDocById(collection, docId) {
  const res = await fetch(addKey(`${FIRESTORE_URL}/${collection}/${docId}`));
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return firestoreToObj(await res.json());
}

export async function setDocById(collection, docId, data) {
  const res = await fetch(addKey(`${FIRESTORE_URL}/${collection}/${docId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Firestore write ${res.status}: ${errBody.slice(0, 200)}`);
  }
  return res.json();
}

export async function queryCollection(collection, field, value, limitCount) {
  const res = await fetch(addKey(`${FIRESTORE_URL}:runQuery`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
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
    }),
  });
  if (!res.ok) return [];
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
  const fields = {};
  for (const [k, v] of Object.entries(val)) fields[k] = toFirestoreValue(v);
  return { mapValue: { fields } };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = toFirestoreValue(v);
  return fields;
}

function firestoreToObj(doc) {
  if (!doc?.fields) return {};
  const r = {};
  for (const [k, v] of Object.entries(doc.fields)) r[k] = fv(v);
  return r;
}

function fv(val) {
  if (!val) return null;
  if (val.nullValue !== undefined) return null;
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return Number(val.integerValue);
  if (val.doubleValue !== undefined) return Number(val.doubleValue);
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.timestampValue !== undefined) return val.timestampValue;
  if (val.arrayValue) return (val.arrayValue.values || []).map(fv);
  if (val.mapValue) return firestoreToObj(val.mapValue);
  return null;
}

export function getCurrentUser() {
  if (_uid) return { uid: _uid };
  const stored = getStoredAuth();
  return stored?.uid ? { uid: stored.uid } : null;
}
