/**
 * DocumentParser utility for parsing various document types dynamically in the browser.
 * Loads external libraries (pdf.js, mammoth, sheetjs) from highly available CDNs as needed.
 */

const loadScript = (url, globalName) => {
  return new Promise((resolve, reject) => {
    if (window[globalName]) {
      resolve(window[globalName]);
      return;
    }
    
    // Check if script already exists in document
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window[globalName]));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = () => resolve(window[globalName]);
    script.onerror = (e) => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(script);
  });
};

const parserCache = new Map();

const DB_NAME = "ai-chat-documents";
const STORE_NAME = "parsed_docs";
const DB_VERSION = 1;

function openDocCacheDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getCachedDoc(key) {
  try {
    const db = await openDocCacheDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.text || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("Failed to get document from persistent cache:", e);
    return null;
  }
}

async function setCachedDoc(key, text) {
  try {
    const db = await openDocCacheDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put({ key, text, createdAt: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("Failed to save document to persistent cache:", e);
  }
}

export class DocumentParser {
  /**
   * Parse a file object and extract its content as string
   * @param {File} file 
   * @returns {Promise<string>} Extracted content
   */
  static async parse(file) {
    if (!file) throw new Error("No file provided.");
    
    const isDev = (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") || (typeof window !== "undefined" && window.localStorage?.getItem("debug") === "true");
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    
    if (parserCache.has(key)) {
      if (isDev) {
        console.log(`[DocumentParser Performance] Memory cache hit for ${file.name}`);
      }
      return parserCache.get(key);
    }

    const cachedText = await getCachedDoc(key);
    if (cachedText) {
      if (isDev) {
        console.log(`[DocumentParser Performance] Persistent cache hit for ${file.name}`);
      }
      parserCache.set(key, cachedText);
      return cachedText;
    }
    
    const name = file.name.toLowerCase();
    const startParse = Date.now();
    let text = "";
    
    if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".markdown")) {
      const startRead = Date.now();
      text = await this.parseText(file);
      if (isDev) console.log(`[DocumentParser Performance] Text file read time: ${Date.now() - startRead}ms`);
    } else if (name.endsWith(".json")) {
      const startRead = Date.now();
      text = await this.parseJson(file);
      if (isDev) console.log(`[DocumentParser Performance] JSON read and parse time: ${Date.now() - startRead}ms`);
    } else if (name.endsWith(".csv")) {
      const startRead = Date.now();
      text = await this.parseCsv(file);
      if (isDev) console.log(`[DocumentParser Performance] CSV read and parse time: ${Date.now() - startRead}ms`);
    } else if (name.endsWith(".pdf")) {
      const startRead = Date.now();
      text = await this.parsePdf(file);
      if (isDev) console.log(`[DocumentParser Performance] PDF processing time: ${Date.now() - startRead}ms`);
    } else if (name.endsWith(".docx")) {
      const startRead = Date.now();
      text = await this.parseDocx(file);
      if (isDev) console.log(`[DocumentParser Performance] Word DOCX processing time: ${Date.now() - startRead}ms`);
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const startRead = Date.now();
      text = await this.parseExcel(file);
      if (isDev) console.log(`[DocumentParser Performance] Excel processing time: ${Date.now() - startRead}ms`);
    } else {
      const startRead = Date.now();
      text = await this.parseText(file);
      if (isDev) console.log(`[DocumentParser Performance] Fallback text read time: ${Date.now() - startRead}ms`);
    }

    const duration = Date.now() - startParse;
    if (isDev) {
      console.log(`[DocumentParser Performance] Total parse time for ${file.name}: ${duration}ms`);
    }
    
    parserCache.set(key, text);
    await setCachedDoc(key, text);
    return text;
  }

  static async parseText(file) {
    return await file.text();
  }

  static async parseJson(file) {
    const text = await file.text();
    try {
      const obj = JSON.parse(text);
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return text;
    }
  }

  static async parseCsv(file) {
    const text = await file.text();
    // Parse simple CSV rows
    const lines = text.split(/\r?\n/).map(line => {
      // Split by commas, considering quotes if any (basic parse)
      return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.trim().replace(/^"|"$/g, ""));
    }).filter(row => row.length > 0 && row.some(cell => cell !== ""));

    if (lines.length === 0) return "Empty CSV document.";

    // Convert CSV to a clean readable markdown table
    let table = "";
    lines.forEach((row, index) => {
      table += `| ${row.join(" | ")} |\n`;
      if (index === 0) {
        table += `| ${row.map(() => "---").join(" | ")} |\n`;
      }
    });
    return table;
  }

  static async parsePdf(file) {
    try {
      const pdfjsLib = await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js",
        "pdfjsLib"
      );
      
      // Configure worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        fullText += `[Page ${i}]\n${strings.join(" ")}\n\n`;
      }
      
      return fullText.trim() || "Empty PDF document (could be scanned images).";
    } catch (err) {
      console.error("PDF Parsing Error:", err);
      throw new Error(`Failed to parse PDF file: ${err.message}`);
    }
  }

  static async parseDocx(file) {
    try {
      const mammoth = await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js",
        "mammoth"
      );
      
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value || "Empty Word document.";
    } catch (err) {
      console.error("DOCX Parsing Error:", err);
      throw new Error(`Failed to parse Word document: ${err.message}`);
    }
  }

  static async parseExcel(file) {
    try {
      const XLSX = await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
        "XLSX"
      );
      
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      let text = "";
      
      workbook.SheetNames.forEach(sheetName => {
        text += `\n--- Sheet: ${sheetName} ---\n`;
        const sheet = workbook.Sheets[sheetName];
        // Convert to CSV
        const csv = XLSX.utils.sheet_to_csv(sheet);
        if (csv.trim()) {
          // Present it formatted as table or CSV rows
          const lines = csv.split("\n").filter(l => l.trim());
          lines.forEach(line => {
            text += `| ${line.split(",").join(" | ")} |\n`;
          });
        } else {
          text += "(Empty Sheet)\n";
        }
      });
      
      return text.trim() || "Empty Excel workbook.";
    } catch (err) {
      console.error("Excel Parsing Error:", err);
      throw new Error(`Failed to parse Excel spreadsheet: ${err.message}`);
    }
  }
}

export default DocumentParser;
