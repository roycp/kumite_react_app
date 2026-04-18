export function normalizeId(doc: any): any {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return doc;
  const { _id, __v, ...rest } = doc;
  return _id !== undefined ? { id: String(_id), ...rest } : rest;
}

export function normalizeIds(docs: any[]): any[] {
  return docs.map(normalizeId);
}
