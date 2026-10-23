(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let loadedFile = null;
  let fileBase64 = "";

  function bytesToBase64(bytes) {
    // Avoid spreading large arrays into a function call; convert in bounded chunks.
    const chunkSize = 0x8000;
    let binary = "";
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
    }
    return btoa(binary);
  }

  function base64ToBytes(input, urlSafe) {
    let value = input.trim();
    if (value.startsWith("data:")) {
      const comma = value.indexOf(",");
      if (comma < 0) throw new Error("The data URI is missing its comma separator.");
      value = value.slice(comma + 1);
    }
    value = value.replace(/\s/g, "");
    if (urlSafe) value = value.replace(/-/g, "+").replace(/_/g, "/");
    if (!value) return new Uint8Array();
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
      throw new Error("Invalid Base64 characters or padding.");
    }
    if (value.length % 4 === 1) throw new Error("Invalid Base64 length.");
    const firstPadding = value.indexOf("=");
    if (firstPadding !== -1 && value.length % 4 !== 0) throw new Error("Invalid Base64 padding.");
    if (firstPadding !== -1 && value.length - firstPadding > 2) throw new Error("Invalid Base64 padding.");
    const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
    let binary;
    try { binary = atob(padded); } catch { throw new Error("Input is not valid Base64."); }
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    // Reject non-canonical encodings rather than silently accepting malformed strings.
    const canonical = bytesToBase64(bytes);
    if (canonical.replace(/=+$/, "") !== padded.replace(/=+$/, "")) {
      throw new Error("Invalid Base64 encoding or padding bits.");
    }
    return bytes;
  }

  function formatBase64(value, urlSafe) {
    return urlSafe ? value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "") : value;
  }

  function setStatus(element, message, kind = "") {
    element.textContent = message;
    element.className = `status${kind ? ` ${kind}` : ""}`;
  }

  function byteLength(value) { return encoder.encode(value).length; }
  function updateTextCounts() {
    const input = $("text-input").value;
    const output = $("text-output").value;
    $("input-count").textContent = `${input.length.toLocaleString()} characters · ${byteLength(input).toLocaleString()} bytes`;
    $("output-count").textContent = `${output.length.toLocaleString()} characters · ${byteLength(output).toLocaleString()} bytes`;
  }

  function clearText() {
    $("text-input").value = "";
    $("text-output").value = "";
    setStatus($("text-status"), "");
    updateTextCounts();
    $("text-input").focus();
  }

  $("encode").addEventListener("click", () => {
    try {
      const bytes = encoder.encode($("text-input").value);
      $("text-output").value = formatBase64(bytesToBase64(bytes), $("url-safe").checked);
      updateTextCounts();
      setStatus($("text-status"), `Encoded ${bytes.length.toLocaleString()} UTF-8 bytes.`, "success");
    } catch (error) {
      setStatus($("text-status"), error.message || "Could not encode this input.", "error");
    }
  });

  $("decode").addEventListener("click", () => {
    try {
      const bytes = base64ToBytes($("text-input").value, $("url-safe").checked);
      $("text-output").value = decoder.decode(bytes);
      updateTextCounts();
      setStatus($("text-status"), `Decoded ${bytes.length.toLocaleString()} bytes as UTF-8 text.`, "success");
    } catch (error) {
      $("text-output").value = "";
      updateTextCounts();
      setStatus($("text-status"), error.message || "Could not decode this input.", "error");
    }
  });

  $("text-input").addEventListener("input", updateTextCounts);
  $("text-output").addEventListener("input", updateTextCounts);
  $("clear-text").addEventListener("click", clearText);
  $("swap-text").addEventListener("click", () => {
    const oldInput = $("text-input").value;
    $("text-input").value = $("text-output").value;
    $("text-output").value = oldInput;
    updateTextCounts();
    setStatus($("text-status"), "Input and output swapped.", "success");
  });

  async function copyValue(value, statusElement) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const helper = document.createElement("textarea");
        helper.value = value;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        const copied = document.execCommand("copy");
        helper.remove();
        if (!copied) throw new Error("Clipboard access is unavailable. Select and copy the output manually.");
      }
      setStatus(statusElement, "Copied to clipboard.", "success");
    } catch (error) {
      setStatus(statusElement, error.message || "Could not copy output.", "error");
    }
  }
  $("copy-output").addEventListener("click", () => copyValue($("text-output").value, $("text-status")));
  $("copy-file-output").addEventListener("click", () => copyValue($("file-base64-output").value, $("file-status")));

  $("text-tab").addEventListener("click", () => showTab("text"));
  $("file-tab").addEventListener("click", () => showTab("file"));
  function showTab(which) {
    const textMode = which === "text";
    $("text-panel").hidden = !textMode;
    $("file-panel").hidden = textMode;
    $("text-tab").classList.toggle("active", textMode);
    $("file-tab").classList.toggle("active", !textMode);
    $("text-tab").setAttribute("aria-selected", String(textMode));
    $("file-tab").setAttribute("aria-selected", String(!textMode));
  }

  function formatBytes(size) {
    if (size < 1024) return `${size} B`;
    const units = ["KB", "MB", "GB", "TB"];
    let amount = size / 1024, unit = 0;
    while (amount >= 1024 && unit < units.length - 1) { amount /= 1024; unit++; }
    return `${amount.toFixed(amount >= 10 ? 1 : 2)} ${units[unit]}`;
  }

  function resetLoadedFile() {
    loadedFile = null;
    fileBase64 = "";
    $("file-picker").value = "";
    $("file-base64-output").value = "";
    $("file-info").textContent = "";
    $("file-info").hidden = true;
    setStatus($("file-status"), "");
  }

  function handleFile(file) {
    if (!file) return;
    loadedFile = file;
    $("file-info").textContent = "";
    const name = document.createElement("p");
    const size = document.createElement("p");
    const mime = document.createElement("p");
    name.textContent = `Name: ${file.name}`;
    size.textContent = `Size: ${formatBytes(file.size)} (${file.size.toLocaleString()} bytes)`;
    mime.textContent = `MIME type: ${file.type || "Unknown (not provided by the browser)"}`;
    $("file-info").append(name, size, mime);
    $("file-info").hidden = false;
    if (file.size > 50 * 1024 * 1024) {
      setStatus($("file-status"), "This file is larger than 50 MB. Encoding it may use substantial memory; proceed only if your device has enough available memory.", "error");
    } else {
      setStatus($("file-status"), "Reading file locally…");
    }
    $("file-base64-output").value = "";
    fileBase64 = "";
    const reader = new FileReader();
    reader.onerror = () => setStatus($("file-status"), "Could not read this file.", "error");
    reader.onabort = () => setStatus($("file-status"), "File reading was cancelled.", "error");
    reader.onload = () => {
      if (loadedFile !== file) return;
      try {
        const result = reader.result;
        const comma = result.indexOf(",");
        fileBase64 = comma >= 0 ? result.slice(comma + 1) : "";
        updateFileOutput();
        setStatus($("file-status"), `Ready: ${file.name} (${formatBytes(file.size)}).`, "success");
      } catch (error) {
        setStatus($("file-status"), error.message || "Could not encode this file.", "error");
      }
    };
    // Read as a data URL for straightforward Base64 conversion; it stays entirely in memory.
    reader.readAsDataURL(file);
  }

  function updateFileOutput() {
    if (!loadedFile || !fileBase64) {
      $("file-base64-output").value = "";
      return;
    }
    $("file-base64-output").value = $("data-uri").checked
      ? `data:${loadedFile.type || "application/octet-stream"};base64,${fileBase64}`
      : fileBase64;
  }

  $("file-picker").addEventListener("change", (event) => handleFile(event.target.files[0]));
  $("data-uri").addEventListener("change", updateFileOutput);
  const dropZone = $("drop-zone");
  ["dragenter", "dragover"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("dragging");
  }));
  ["dragleave", "drop"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");
  }));
  dropZone.addEventListener("drop", (event) => handleFile(event.dataTransfer.files[0]));

  $("download-decoded").addEventListener("click", () => {
    try {
      const raw = $("decode-file-input").value.trim();
      let dataUriMime = "";
      if (raw.startsWith("data:")) {
        const match = /^data:([^;,]*)(?:;[^,]*)?,/.exec(raw);
        if (match) dataUriMime = match[1];
      }
      const bytes = base64ToBytes(raw, true);
      const suppliedMime = $("mime-type").value.trim();
      const mime = suppliedMime || dataUriMime || "application/octet-stream";
      const filename = $("download-name").value.trim() || "decoded-file.bin";
      const blob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename.replace(/[\/\\]/g, "_");
      anchor.hidden = true;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      // Give the browser time to start the download before revoking the temporary URL.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus($("file-status"), `Download prepared: ${filename} · ${formatBytes(blob.size)} · ${mime}.`, "success");
    } catch (error) {
      setStatus($("file-status"), error.message || "Could not decode this Base64 input.", "error");
    }
  });

  $("clear-files").addEventListener("click", () => {
    resetLoadedFile();
    $("decode-file-input").value = "";
    $("download-name").value = "decoded-file.bin";
    $("mime-type").value = "";
    $("data-uri").checked = false;
    $("file-picker").value = "";
    setStatus($("file-status"), "File fields cleared.", "success");
  });

  // Start with all user-data fields empty; no storage APIs are used.
  updateTextCounts();
})();