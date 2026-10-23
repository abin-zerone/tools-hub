/* Add new tools here. No fetch() or runtime registry loading is used. */
window.TOOL_REGISTRY = [
  {
    id: "base64",
    name: "Base64 Encoder / Decoder",
    description: "Encode UTF-8 text and files to Base64, or decode Base64 back to text and files.",
    category: "Encoding",
    folder: "base64/index.html",
    icon: "🔤",
    tags: ["base64", "encode", "decode", "utf-8", "unicode", "file", "data uri"],
    status: "live"
  },
  {
    id: "url-encode",
    name: "URL Encoder / Decoder",
    description: "Safely encode or decode URL components and query parameter values.",
    category: "Encoding",
    folder: "url-encode/",
    icon: "🔗",
    tags: ["url", "uri", "percent encoding", "query string", "encode", "decode"],
    status: "coming soon"
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format, validate, and minify JSON with readable indentation.",
    category: "Formatting",
    folder: "json-formatter/",
    icon: "{}", 
    tags: ["json", "pretty print", "minify", "validate", "formatter"],
    status: "coming soon"
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    description: "Generate common cryptographic hashes from text using browser APIs.",
    category: "Security",
    folder: "hash-generator/",
    icon: "🔐",
    tags: ["hash", "sha-256", "sha-384", "sha-512", "digest", "crypto"],
    status: "coming soon"
  },
  {
    id: "jwt-decoder",
    name: "JWT Decoder",
    description: "Inspect JSON Web Token header and payload locally without verification.",
    category: "Security",
    folder: "jwt-decoder/",
    icon: "🪪",
    tags: ["jwt", "json web token", "token", "decode", "claims"],
    status: "coming soon"
  },
  {
    id: "uuid-generator",
    name: "UUID Generator",
    description: "Generate random UUIDs locally for development and testing.",
    category: "Generators",
    folder: "uuid-generator/",
    icon: "🆔",
    tags: ["uuid", "guid", "random", "identifier", "generator"],
    status: "coming soon"
  }
];