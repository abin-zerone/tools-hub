(() => {
  'use strict';

  // ---- Rule tables -------------------------------------------------------

  const PARENT_MAP = {
    XFlyG5:             { dev: 'XFlyG5-Dev',    prod: 'master' },
    XFlyG5Database:      { dev: 'XFlyG5-Dev',    prod: 'master' },
    XFlyG5API:           { dev: 'XFlyAPI-Dev',   prod: 'main' },
    XFlyG5DatabaseREP:   { dev: 'XFlyG5REP-Dev', prod: 'main' },
  };

  const VERSION_RE = /^\d+(\.\d+)*$/;
  const TICKET_NUM_RE = /^\d+$/;
  const DESC_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const TICKET_TOKEN_RE = /^(US|BUG|CR|EPIC|DU)(\d+)/i;

  // ---- State --------------------------------------------------------------

  let currentType = 'release-train';

  // ---- Helpers --------------------------------------------------------------

  function checkDescription(desc, messages) {
    if (!desc) {
      messages.push({ level: 'error', text: 'Short description is required.' });
      return false;
    }
    if (!DESC_RE.test(desc)) {
      messages.push({ level: 'error', text: 'Short description must be hyphen-separated letters and numbers, no spaces or other characters.' });
      return false;
    }
    const words = desc.split('-').length;
    if (words < 3 || words > 5) {
      messages.push({ level: 'warning', text: `Short description is ${words} word(s) — aim for 3–5.` });
    }
    if (desc.length < 20 || desc.length > 50) {
      messages.push({ level: 'warning', text: `Short description is ${desc.length} characters — aim for roughly 20–50.` });
    }
    return true;
  }

  function checkVersion(version, messages, label = 'Version') {
    if (!version) {
      messages.push({ level: 'error', text: `${label} is required, e.g. 5.25.5.` });
      return false;
    }
    if (!VERSION_RE.test(version)) {
      messages.push({ level: 'error', text: `${label} must be numeric, e.g. 5.25.5 or 5.25.` });
      return false;
    }
    return true;
  }

  function checkTicketId(id, messages) {
    if (!id) {
      messages.push({ level: 'error', text: 'Ticket ID is required.' });
      return false;
    }
    if (!TICKET_NUM_RE.test(id)) {
      messages.push({ level: 'error', text: 'Ticket ID must be numeric only (no prefix, no spaces).' });
      return false;
    }
    return true;
  }

  function el(id) { return document.getElementById(id); }

  function setFieldError(id, text) {
    const node = el(id);
    if (node) node.textContent = text || '';
  }

  function clearFieldErrors(ids) {
    ids.forEach((id) => setFieldError(id, ''));
  }

  // ---- Per-type generators ------------------------------------------------

  function generateReleaseTrain() {
    const messages = [];
    clearFieldErrors(['rt-version-error']);
    const version = el('rt-version').value.trim();
    const versionOk = checkVersion(version, messages);
    if (!versionOk) {
      setFieldError('rt-version-error', messages.find(m => m.level === 'error')?.text || '');
      return { value: null, messages };
    }
    return { value: `release/v${version}`, messages };
  }

  function generateFromRelease() {
    const messages = [];
    clearFieldErrors(['fr-version-error', 'fr-ticket-error', 'fr-desc-error']);
    const version = el('fr-version').value.trim();
    const ticketType = el('fr-ticket-type').value;
    const ticketId = el('fr-ticket-id').value.trim();
    const desc = el('fr-desc').value.trim().toLowerCase();

    const versionOk = checkVersion(version, messages);
    const idMessages = [];
    const idOk = checkTicketId(ticketId, idMessages);
    const descMessages = [];
    const descOk = checkDescription(desc, descMessages);

    if (!versionOk) setFieldError('fr-version-error', messages[messages.length - 1].text);
    if (!idOk) setFieldError('fr-ticket-error', idMessages[0].text);
    const descErr = descMessages.find(m => m.level === 'error');
    if (descErr) setFieldError('fr-desc-error', descErr.text);

    messages.push(...idMessages, ...descMessages);

    if (!versionOk || !idOk || !descOk) return { value: null, messages };

    return { value: `R${version}/${ticketType}${ticketId}-${desc}`, messages };
  }

  function updateDevProdPreview() {
    const repo = el('dp-repo').value;
    const source = el('dp-source').dataset.value;
    const parent = PARENT_MAP[repo][source];
    el('dp-parent-preview').textContent = `from-${parent}`;
  }

  function generateFromDevProd() {
    const messages = [];
    clearFieldErrors(['dp-ticket-error', 'dp-desc-error']);
    const repo = el('dp-repo').value;
    const source = el('dp-source').dataset.value;
    const ticketType = el('dp-ticket-type').value;
    const ticketId = el('dp-ticket-id').value.trim();
    const desc = el('dp-desc').value.trim().toLowerCase();

    const idMessages = [];
    const idOk = checkTicketId(ticketId, idMessages);
    const descMessages = [];
    const descOk = checkDescription(desc, descMessages);

    if (!idOk) setFieldError('dp-ticket-error', idMessages[0].text);
    const descErr = descMessages.find(m => m.level === 'error');
    if (descErr) setFieldError('dp-desc-error', descErr.text);

    messages.push(...idMessages, ...descMessages);

    if (!idOk || !descOk) return { value: null, messages };

    const parent = PARENT_MAP[repo][source];
    const folder = `from-${parent}`;
    return { value: `${folder}/${ticketType}${ticketId}-${desc}`, messages };
  }

  function parseParentBranch(raw) {
    const trimmed = raw.trim();
    const slashIdx = trimmed.indexOf('/');
    if (slashIdx === -1) return null;
    const folder = trimmed.slice(0, slashIdx);
    const rest = trimmed.slice(slashIdx + 1);
    const match = rest.match(TICKET_TOKEN_RE);
    if (!match) return null;
    const parentTicket = match[1].toUpperCase() + match[2];
    const looksValid = /^R\d+(\.\d+)*$/.test(folder) || folder.startsWith('from-');
    return { folder, parentTicket, looksValid };
  }

  function generateStacked() {
    const messages = [];
    clearFieldErrors(['st-parent-error', 'st-ticket-error', 'st-desc-error']);
    const parentRaw = el('st-parent').value;
    const ticketType = el('st-ticket-type').value;
    const ticketId = el('st-ticket-id').value.trim();
    const desc = el('st-desc').value.trim().toLowerCase();

    const parsed = parentRaw.trim() ? parseParentBranch(parentRaw) : null;
    const parsedBox = el('st-parsed');
    if (parsed) {
      parsedBox.hidden = false;
      el('st-parsed-folder').textContent = parsed.folder;
      el('st-parsed-ticket').textContent = parsed.parentTicket;
      if (!parsed.looksValid) {
        messages.push({ level: 'warning', text: `Folder "${parsed.folder}" doesn't look like a release-train or from- folder — check the parent branch.` });
      }
    } else {
      parsedBox.hidden = true;
    }

    if (!parentRaw.trim()) {
      setFieldError('st-parent-error', 'Paste the existing parent branch name.');
    } else if (!parsed) {
      setFieldError('st-parent-error', 'Could not find a folder and ticket ID (e.g. US140791) in that branch name.');
    }

    const idMessages = [];
    const idOk = checkTicketId(ticketId, idMessages);
    const descMessages = [];
    const descOk = checkDescription(desc, descMessages);

    if (!idOk) setFieldError('st-ticket-error', idMessages[0].text);
    const descErr = descMessages.find(m => m.level === 'error');
    if (descErr) setFieldError('st-desc-error', descErr.text);

    messages.push(...idMessages, ...descMessages);

    if (!parsed || !idOk || !descOk) return { value: null, messages };

    return {
      value: `${parsed.folder}/${ticketType}${ticketId}-from-${parsed.parentTicket}-${desc}`,
      messages,
    };
  }

  // ---- Orchestration --------------------------------------------------------------

  const GENERATORS = {
    'release-train': generateReleaseTrain,
    'from-release': generateFromRelease,
    'from-dev-prod': generateFromDevProd,
    'stacked': generateStacked,
  };

  function render() {
    const { value, messages } = GENERATORS[currentType]();
    const output = el('output-value');
    const list = el('output-messages');
    const copyBtn = el('copy-btn');

    output.classList.remove('is-invalid', 'is-warning');
    if (value) {
      output.textContent = value;
      const hasWarning = messages.some(m => m.level === 'warning');
      if (hasWarning) output.classList.add('is-warning');
      copyBtn.disabled = false;
    } else {
      output.textContent = '—';
      output.classList.add('is-invalid');
      copyBtn.disabled = true;
      copyBtn.classList.remove('is-copied');
      copyBtn.textContent = 'Copy';
    }

    list.innerHTML = '';
    messages.forEach((m) => {
      const li = document.createElement('li');
      li.className = m.level;
      li.textContent = m.text;
      list.appendChild(li);
    });
  }

  function switchType(type) {
    currentType = type;
    document.querySelectorAll('.type-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.type === type);
    });
    document.querySelectorAll('.field-group').forEach((group) => {
      group.hidden = group.dataset.group !== type;
    });
    render();
  }

  function init() {
    document.querySelectorAll('.type-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchType(btn.dataset.type));
    });

    document.querySelectorAll('#branch-form input, #branch-form select').forEach((input) => {
      input.addEventListener('input', render);
      input.addEventListener('change', render);
    });

    document.querySelectorAll('#dp-source .toggle__opt').forEach((opt) => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('#dp-source .toggle__opt').forEach((o) => o.classList.remove('is-active'));
        opt.classList.add('is-active');
        el('dp-source').dataset.value = opt.dataset.value;
        updateDevProdPreview();
        render();
      });
    });

    el('copy-btn').addEventListener('click', () => {
      const text = el('output-value').textContent;
      if (!text || text === '—') return;
      navigator.clipboard.writeText(text).then(() => {
        const btn = el('copy-btn');
        btn.textContent = 'Copied';
        btn.classList.add('is-copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('is-copied');
        }, 1400);
      });
    });

    updateDevProdPreview();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
