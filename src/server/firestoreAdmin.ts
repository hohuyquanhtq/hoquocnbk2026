import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

const SERVER_SECRET_KEY = 'eduquiz_srv_8e27d949';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents`;

// Helper to convert JS object to Firestore document fields
export function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) {
      fields[key] = { nullValue: null };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        fields[key] = { integerValue: String(value) };
      } else {
        fields[key] = { doubleValue: value };
      }
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map(item => {
            if (typeof item === 'string') return { stringValue: item };
            if (typeof item === 'number') return Number.isInteger(item) ? { integerValue: String(item) } : { doubleValue: item };
            if (typeof item === 'boolean') return { booleanValue: item };
            if (typeof item === 'object' && item !== null) return { mapValue: { fields: toFirestoreFields(item) } };
            return { stringValue: String(item) };
          })
        }
      };
    } else if (typeof value === 'object') {
      fields[key] = { mapValue: { fields: toFirestoreFields(value) } };
    }
  }

  return fields;
}

// Helper to convert Firestore document fields back to standard JS object
export function fromFirestoreFields(fields: Record<string, any> | undefined): Record<string, any> {
  if (!fields) return {};
  const result: Record<string, any> = {};

  for (const [key, val] of Object.entries(fields)) {
    if ('stringValue' in val) {
      result[key] = val.stringValue;
    } else if ('integerValue' in val) {
      result[key] = parseInt(val.integerValue, 10);
    } else if ('doubleValue' in val) {
      result[key] = parseFloat(val.doubleValue);
    } else if ('booleanValue' in val) {
      result[key] = val.booleanValue;
    } else if ('nullValue' in val) {
      result[key] = null;
    } else if ('arrayValue' in val) {
      const arr = val.arrayValue.values || [];
      result[key] = arr.map((item: any) => {
        if ('stringValue' in item) return item.stringValue;
        if ('integerValue' in item) return parseInt(item.integerValue, 10);
        if ('doubleValue' in item) return parseFloat(item.doubleValue);
        if ('booleanValue' in item) return item.booleanValue;
        if ('mapValue' in item) return fromFirestoreFields(item.mapValue.fields);
        return item;
      });
    } else if ('mapValue' in val) {
      result[key] = fromFirestoreFields(val.mapValue.fields);
    }
  }

  return result;
}

// REST helper to set a document
export async function setFirestoreDoc(collection: string, docId: string, data: Record<string, any>): Promise<void> {
  const docWithSecret = {
    ...data,
    secretKey: SERVER_SECRET_KEY,
    updatedAt: data.updatedAt || new Date().toISOString()
  };

  const url = `${BASE_URL}/${collection}/${docId}?key=${firebaseConfig.apiKey}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFirestoreFields(docWithSecret) })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firestore write to ${collection}/${docId} failed (${res.status}): ${errText}`);
  }
}

// REST helper to get a single document
export async function getFirestoreDoc(collection: string, docId: string): Promise<Record<string, any> | null> {
  const url = `${BASE_URL}/${collection}/${docId}?key=${firebaseConfig.apiKey}`;
  const res = await fetch(url);

  if (res.status === 404) return null;
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firestore read from ${collection}/${docId} failed (${res.status}): ${errText}`);
  }

  const json = await res.json();
  const data = fromFirestoreFields(json.fields);
  delete data.secretKey;
  return data;
}

// REST helper to delete a document
export async function deleteFirestoreDoc(collection: string, docId: string): Promise<void> {
  const url = `${BASE_URL}/${collection}/${docId}?key=${firebaseConfig.apiKey}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    const errText = await res.text();
    throw new Error(`Firestore delete on ${collection}/${docId} failed (${res.status}): ${errText}`);
  }
}

// REST helper to query documents by collection with secretKey filter
export async function queryFirestoreCollection(collection: string): Promise<Record<string, any>[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents:runQuery?key=${firebaseConfig.apiKey}`;

  const queryPayload = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'secretKey' },
          op: 'EQUAL',
          value: { stringValue: SERVER_SECRET_KEY }
        }
      }
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(queryPayload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firestore query on ${collection} failed (${res.status}): ${errText}`);
  }

  const results = await res.json();
  const list: Record<string, any>[] = [];

  for (const item of results) {
    if (item.document && item.document.fields) {
      const data = fromFirestoreFields(item.document.fields);
      delete data.secretKey;
      list.push(data);
    }
  }

  return list;
}
