import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Collection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this.data = [];
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf8');
        this.data = JSON.parse(fileContent);
      } else {
        this.data = [];
        this.save();
      }
    } catch (err) {
      console.error(`Error loading collection ${this.name}:`, err);
      this.data = [];
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error(`Error saving collection ${this.name}:`, err);
    }
  }

  _matches(item, query) {
    for (const key in query) {
      if (query[key] !== item[key]) {
        return false;
      }
    }
    return true;
  }

  async find(query = {}) {
    this.load(); // Refresh from disk
    return this.data.filter(item => this._matches(item, query));
  }

  async findOne(query = {}) {
    this.load();
    return this.data.find(item => this._matches(item, query)) || null;
  }

  async insertOne(item) {
    this.load();
    const doc = {
      _id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      ...item
    };
    this.data.push(doc);
    this.save();
    return doc;
  }

  async updateOne(query, update) {
    this.load();
    const index = this.data.findIndex(item => this._matches(item, query));
    if (index === -1) return { matchedCount: 0, modifiedCount: 0 };

    const original = this.data[index];
    
    // Support MongoDB style $set or basic object merge
    let updatedDoc;
    if (update.$set) {
      updatedDoc = { ...original, ...update.$set, updatedAt: new Date().toISOString() };
    } else {
      updatedDoc = { ...original, ...update, updatedAt: new Date().toISOString() };
    }

    this.data[index] = updatedDoc;
    this.save();
    return { matchedCount: 1, modifiedCount: 1, doc: updatedDoc };
  }

  async deleteOne(query) {
    this.load();
    const index = this.data.findIndex(item => this._matches(item, query));
    if (index === -1) return { deletedCount: 0 };

    this.data.splice(index, 1);
    this.save();
    return { deletedCount: 1 };
  }
}

// Instantiate collections
const db = {
  users: new Collection('users'),
  attempts: new Collection('attempts'),
  memories: new Collection('memories'),
  roadmaps: new Collection('roadmaps'),
  resources: new Collection('resources'),
  questions: new Collection('questions')
};

export default db;
