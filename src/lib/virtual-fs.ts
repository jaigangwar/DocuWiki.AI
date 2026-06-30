// ================================================================
// Virtual Filesystem — IndexedDB-backed file & directory storage
// Simulates a workspace/vault for OKF knowledge graph files
// ================================================================

import { openDB, type IDBPDatabase } from "idb";

// ---- Types ----

export interface VFSFile {
  /** Full path, e.g. "knowledge_base/finance/budgeting.md" */
  path: string;
  /** File content (Markdown with YAML frontmatter) */
  content: string;
  /** Parsed YAML frontmatter metadata */
  metadata: OKFMetadata;
  /** Creation timestamp */
  createdAt: string;
  /** Last modified timestamp */
  updatedAt: string;
}

export interface OKFMetadata {
  type: string;
  title: string;
  description: string;
  resource: string;
  tags: string[];
  timestamp: string;
  [key: string]: any;
}

export interface VFSDirectory {
  path: string;
  name: string;
  children: VFSTreeNode[];
}

export interface VFSTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: VFSTreeNode[];
  metadata?: OKFMetadata;
}

// ---- Database Schema ----

const DB_NAME = "docuwiki-ai-vfs";
const DB_VERSION = 1;
const FILES_STORE = "files";
const META_STORE = "metadata";

interface VFSDBSchema {
  files: {
    key: string;
    value: VFSFile;
    indexes: {
      "by-type": string;
      "by-tags": string;
      "by-resource": string;
    };
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: any;
    };
  };
}

// ---- Database Initialization ----

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Files store
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        const fileStore = db.createObjectStore(FILES_STORE, {
          keyPath: "path",
        });
        fileStore.createIndex("by-type", "metadata.type");
        fileStore.createIndex("by-tags", "metadata.tags", {
          multiEntry: true,
        });
        fileStore.createIndex("by-resource", "metadata.resource");
      }

      // Metadata key-value store
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
    },
  });

  return dbPromise;
}

// ---- File Operations ----

/**
 * Stores a single OKF file in the virtual filesystem.
 */
export async function writeFile(
  path: string,
  content: string,
  metadata: OKFMetadata
): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();

  const file: VFSFile = {
    path: normalizePath(path),
    content,
    metadata,
    createdAt: now,
    updatedAt: now,
  };

  await db.put(FILES_STORE, file);
}

/**
 * Reads a file by its path.
 */
export async function readFile(path: string): Promise<VFSFile | undefined> {
  const db = await getDB();
  return db.get(FILES_STORE, normalizePath(path));
}

/**
 * Deletes a file by its path.
 */
export async function deleteFile(path: string): Promise<void> {
  const db = await getDB();
  await db.delete(FILES_STORE, normalizePath(path));
}

/**
 * Returns all files in the virtual filesystem.
 */
export async function getAllFiles(): Promise<VFSFile[]> {
  const db = await getDB();
  return db.getAll(FILES_STORE);
}

/**
 * Checks if a file exists.
 */
export async function fileExists(path: string): Promise<boolean> {
  const db = await getDB();
  const file = await db.get(FILES_STORE, normalizePath(path));
  return !!file;
}

/**
 * Stores multiple files in a single transaction (bulk import after OKF processing).
 */
export async function writeFiles(
  files: Array<{ path: string; content: string; metadata: OKFMetadata }>
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(FILES_STORE, "readwrite");
  const now = new Date().toISOString();

  for (const file of files) {
    const vfsFile: VFSFile = {
      path: normalizePath(file.path),
      content: file.content,
      metadata: file.metadata,
      createdAt: now,
      updatedAt: now,
    };
    tx.store.put(vfsFile);
  }

  await tx.done;
}

// ---- Query Operations ----

/**
 * Find files by their OKF type (concept, process, policy, etc.).
 */
export async function findByType(type: string): Promise<VFSFile[]> {
  const db = await getDB();
  return db.getAllFromIndex(FILES_STORE, "by-type", type);
}

/**
 * Find files that contain a specific tag.
 */
export async function findByTag(tag: string): Promise<VFSFile[]> {
  const db = await getDB();
  return db.getAllFromIndex(FILES_STORE, "by-tags", tag);
}

/**
 * Find files associated with a specific source PDF.
 */
export async function findByResource(resource: string): Promise<VFSFile[]> {
  const db = await getDB();
  const allFiles = await db.getAll(FILES_STORE);
  return allFiles.filter((f) =>
    f.metadata.resource.toLowerCase().includes(resource.toLowerCase())
  );
}

/**
 * Full-text search across all file contents and metadata.
 */
export async function searchFiles(query: string): Promise<VFSFile[]> {
  const db = await getDB();
  const allFiles = await db.getAll(FILES_STORE);
  const lowerQuery = query.toLowerCase();

  return allFiles.filter(
    (f) =>
      f.content.toLowerCase().includes(lowerQuery) ||
      f.metadata.title.toLowerCase().includes(lowerQuery) ||
      f.metadata.description.toLowerCase().includes(lowerQuery) ||
      f.metadata.tags.some((t: string) => t.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Finds the most relevant files for a chat query based on
 * tag matching, title similarity, and content keywords.
 * Returns files sorted by relevance score.
 */
export async function findRelevantFiles(
  query: string,
  maxFiles: number = 5
): Promise<VFSFile[]> {
  const db = await getDB();
  const allFiles = await db.getAll(FILES_STORE);
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const scored = allFiles.map((file) => {
    let score = 0;

    // Tag matching (highest weight)
    for (const tag of file.metadata.tags) {
      for (const word of queryWords) {
        if (tag.toLowerCase().includes(word)) score += 10;
      }
    }

    // Title matching
    const titleLower = file.metadata.title.toLowerCase();
    for (const word of queryWords) {
      if (titleLower.includes(word)) score += 8;
    }

    // Description matching
    const descLower = file.metadata.description.toLowerCase();
    for (const word of queryWords) {
      if (descLower.includes(word)) score += 5;
    }

    // Content matching (lower weight — broader)
    const contentLower = file.content.toLowerCase();
    for (const word of queryWords) {
      if (contentLower.includes(word)) score += 2;
    }

    // Type boost: index files are always relevant
    if (file.metadata.type === "summary" || file.path.endsWith("index.md")) {
      score += 3;
    }

    return { file, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxFiles)
    .map((s) => s.file);
}

// ---- Tree Building ----

/**
 * Builds a hierarchical directory tree from all stored files.
 */
export async function buildFileTree(): Promise<VFSTreeNode[]> {
  const allFiles = await getAllFiles();
  return buildTreeFromPaths(allFiles);
}

/**
 * Constructs a tree structure from a flat list of file paths.
 */
export function buildTreeFromPaths(files: VFSFile[]): VFSTreeNode[] {
  const root: VFSTreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      let existing = currentLevel.find((n) => n.name === part);

      if (!existing) {
        if (isFile) {
          existing = {
            name: part,
            path: currentPath,
            type: "file",
            metadata: file.metadata,
          };
        } else {
          existing = {
            name: part,
            path: currentPath,
            type: "directory",
            children: [],
          };
        }
        currentLevel.push(existing);
      }

      if (!isFile && existing.children) {
        currentLevel = existing.children;
      }
    }
  }

  // Sort: directories first, then files, both alphabetically
  sortTree(root);
  return root;
}

function sortTree(nodes: VFSTreeNode[]): void {
  nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  for (const node of nodes) {
    if (node.children) {
      sortTree(node.children);
    }
  }
}

// ---- Metadata Store Operations ----

/**
 * Stores a key-value pair in the metadata store.
 */
export async function setMeta(key: string, value: any): Promise<void> {
  const db = await getDB();
  await db.put(META_STORE, { key, value });
}

/**
 * Retrieves a value from the metadata store.
 */
export async function getMeta<T = any>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const result = await db.get(META_STORE, key);
  return result?.value;
}

// ---- Bulk Operations ----

/**
 * Clears all files from the virtual filesystem.
 */
export async function clearAllFiles(): Promise<void> {
  const db = await getDB();
  await db.clear(FILES_STORE);
}

/**
 * Clears everything (files + metadata).
 */
export async function clearAll(): Promise<void> {
  const db = await getDB();
  await db.clear(FILES_STORE);
  await db.clear(META_STORE);
}

/**
 * Returns file count and total content size for stats display.
 */
export async function getStats(): Promise<{
  fileCount: number;
  totalSize: number;
  types: Record<string, number>;
  tags: Record<string, number>;
}> {
  const allFiles = await getAllFiles();

  const types: Record<string, number> = {};
  const tags: Record<string, number> = {};
  let totalSize = 0;

  for (const file of allFiles) {
    totalSize += file.content.length;

    types[file.metadata.type] = (types[file.metadata.type] || 0) + 1;

    for (const tag of file.metadata.tags) {
      tags[tag] = (tags[tag] || 0) + 1;
    }
  }

  return {
    fileCount: allFiles.length,
    totalSize,
    types,
    tags,
  };
}

// ---- Utilities ----

/**
 * Normalizes a file path: removes leading slash, collapses double slashes.
 */
function normalizePath(path: string): string {
  return path
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .trim();
}

/**
 * Parses YAML frontmatter from a Markdown string.
 * Returns the metadata and the body content separately.
 */
export function parseFrontmatter(content: string): {
  metadata: OKFMetadata;
  body: string;
} {
  const fmRegex = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
  const match = content.match(fmRegex);

  if (!match) {
    return {
      metadata: {
        type: "unknown",
        title: "Untitled",
        description: "",
        resource: "",
        tags: [],
        timestamp: new Date().toISOString(),
      },
      body: content,
    };
  }

  const yamlStr = match[1];
  const body = match[2];

  // Simple YAML parser for frontmatter (handles flat key-value and arrays)
  const metadata: any = {};
  const lines = yamlStr.split("\n");

  let currentKey = "";

  for (const line of lines) {
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();

      if (value.startsWith("[") && value.endsWith("]")) {
        // Inline array: [tag1, tag2]
        metadata[currentKey] = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""));
      } else if (value === "") {
        // Could be a multi-line array (YAML list)
        metadata[currentKey] = [];
      } else {
        metadata[currentKey] = value.replace(/^["']|["']$/g, "");
      }
    } else if (line.match(/^\s+-\s+(.*)$/)) {
      // YAML list item
      const itemMatch = line.match(/^\s+-\s+(.*)$/);
      if (itemMatch && currentKey) {
        if (!Array.isArray(metadata[currentKey])) {
          metadata[currentKey] = [];
        }
        metadata[currentKey].push(
          itemMatch[1].trim().replace(/^["']|["']$/g, "")
        );
      }
    }
  }

  return {
    metadata: {
      type: metadata.type || "unknown",
      title: metadata.title || "Untitled",
      description: metadata.description || "",
      resource: metadata.resource || "",
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      timestamp: metadata.timestamp || new Date().toISOString(),
      ...metadata,
    },
    body,
  };
}
