export class RecordRegistry {
  constructor() { this.entries = new Map(); }
  register(entry) {
    if (!entry?.type) throw new Error("record type is required");
    if (this.entries.has(entry.type)) throw new Error(`record type already registered: ${entry.type}`);
    this.entries.set(entry.type, Object.freeze({ ...entry }));
    return this.get(entry.type);
  }
  get(type) { return this.entries.get(type) ?? null; }
  list() { return Object.freeze([...this.entries.values()]); }
}
