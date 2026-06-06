const API_BASE = 'https://ilusion.io';

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const tabCompose = document.getElementById('tab-compose');
  const tabReveal = document.getElementById('tab-reveal');
  const viewCompose = document.getElementById('view-compose');
  const viewReveal = document.getElementById('view-reveal');

  const btnCreate = document.getElementById('btn-create');
  const composeContent = document.getElementById('compose-content');
  const composeExpiry = document.getElementById('compose-expiry');
  const composeAlias = document.getElementById('compose-alias');
  const composeSuccess = document.getElementById('compose-success');
  const composeLink = document.getElementById('compose-link');
  const btnCopy = document.getElementById('btn-copy');

  const btnReveal = document.getElementById('btn-reveal');
  const btnCopyReveal = document.getElementById('btn-copy-reveal');
  const revealModeLink = document.getElementById('reveal-mode-link');
  const revealModeAlias = document.getElementById('reveal-mode-alias');
  const revealPanelLink = document.getElementById('reveal-panel-link');
  const revealPanelAlias = document.getElementById('reveal-panel-alias');
  const revealInputLink = document.getElementById('reveal-input-link');
  const revealInputAlias = document.getElementById('reveal-input-alias');

  const revealResult = document.getElementById('reveal-result');
  const revealContent = document.getElementById('reveal-content');
  const revealError = document.getElementById('reveal-error');
  const revealErrorText = document.getElementById('reveal-error-text');

  let activeRevealMode = 'link';

  // Tab Switching
  function switchTab(tab) {
    if (tab === 'compose') {
      tabCompose.classList.add('active');
      tabReveal.classList.remove('active');
      viewCompose.classList.remove('hidden');
      viewReveal.classList.add('hidden');
    } else {
      tabReveal.classList.add('active');
      tabCompose.classList.remove('active');
      viewReveal.classList.remove('hidden');
      viewCompose.classList.add('hidden');
    }
  }

  // Reveal Mode Toggling
  function switchRevealMode(mode) {
    activeRevealMode = mode;
    if (mode === 'link') {
      revealModeLink.classList.add('active');
      revealModeAlias.classList.remove('active');
      revealPanelLink.classList.remove('hidden');
      revealPanelAlias.classList.add('hidden');
    } else {
      revealModeAlias.classList.add('active');
      revealModeLink.classList.remove('active');
      revealPanelAlias.classList.remove('hidden');
      revealPanelLink.classList.add('hidden');
    }
  }

  tabCompose.addEventListener('click', () => switchTab('compose'));
  tabReveal.addEventListener('click', () => switchTab('reveal'));
  revealModeLink.addEventListener('click', () => switchRevealMode('link'));
  revealModeAlias.addEventListener('click', () => switchRevealMode('alias'));

  // Create Secret
  btnCreate.addEventListener('click', async () => {
    const text = composeContent.value.trim();
    const aliasVal = composeAlias.value.trim();
    if (!text) return;

    btnCreate.disabled = true;
    btnCreate.innerHTML = '<span class="animate-pulse">Encrypting...</span>';

    try {
      // 1. Generate local key
      const keyStr = await generateKey();
      
      // 2. Encrypt content locally
      const encryptedData = await encryptText(text, keyStr);

      // 3. Send encrypted payload to server
      const payload = {
        encryptedContent: encryptedData,
        expiresInHours: parseInt(composeExpiry.value),
        burnOnRead: true, // Default for extension
        isE2EE: true
      };
      if (aliasVal) {
        payload.alias = aliasVal;
        payload.dropKey = keyStr; // Store key on server for custom alias
      }

      const res = await fetch(`${API_BASE}/api/secrets/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create secret');

      // 4. Show link. Custom alias doesn't require hash fragment because of dropKey
      const fullUrl = aliasVal 
        ? `${API_BASE}/secret/${data.alias || data.id}`
        : `${API_BASE}/secret/${data.id}#${keyStr}`;

      composeLink.value = fullUrl;
      composeSuccess.classList.remove('hidden');
      composeContent.value = '';
      composeAlias.value = '';

    } catch (err) {
      alert('Error creating secret: ' + err.message);
    } finally {
      btnCreate.disabled = false;
      btnCreate.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
        Generate Link
      `;
    }
  });

  // Copy Link
  btnCopy.addEventListener('click', async () => {
    await navigator.clipboard.writeText(composeLink.value);
    btnCopy.textContent = 'Copied!';
    setTimeout(() => btnCopy.textContent = 'Copy', 2000);
  });

  // Copy Revealed Message
  btnCopyReveal.addEventListener('click', async () => {
    if (!revealContent.textContent) return;
    await navigator.clipboard.writeText(revealContent.textContent);
    btnCopyReveal.textContent = 'Copied!';
    setTimeout(() => btnCopyReveal.textContent = 'Copy', 2000);
  });

  // Reveal Secret
  btnReveal.addEventListener('click', async () => {
    let secretId = '';
    let keyStr = '';

    btnReveal.disabled = true;
    btnReveal.innerHTML = '<span class="animate-pulse">Decrypting...</span>';
    revealResult.classList.add('hidden');
    revealError.classList.add('hidden');

    try {
      if (activeRevealMode === 'link') {
        const input = revealInputLink.value.trim();
        if (!input) {
          btnReveal.disabled = false;
          btnReveal.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            Reveal Secret
          `;
          return;
        }

        // Normalize the input: strip full URLs if they exist
        let normalizedInput = input;
        if (input.startsWith('http://') || input.startsWith('https://')) {
          try {
            const url = new URL(input);
            normalizedInput = url.pathname.split('/').pop() + url.hash;
          } catch (e) {
            // Fallback if URL parsing fails
          }
        }

        // Check if we have both the secret id/alias and the decryption key separated by '#'
        const parts = normalizedInput.split('#');
        secretId = parts[0] ? parts[0].replace('secret/', '').trim() : '';
        keyStr = parts[1] ? parts[1].trim() : '';

        if (!secretId || !keyStr) {
          throw new Error('Format must be a full secret URL containing a key fragment (e.g. #key)');
        }
      } else {
        secretId = revealInputAlias.value.trim();
        if (!secretId) {
          throw new Error('Please enter the secret alias');
        }
      }

      // Fetch encrypted payload
      const res = await fetch(`${API_BASE}/api/secrets/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: secretId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to retrieve secret');

      // Decrypt locally: resolve key from dropKey (stored on server for alias) or URL hash
      const activeKey = data.dropKey || keyStr;
      if (!activeKey) {
        throw new Error('Decryption key not found on the server. If this is a standard secret, please use the "By Link" tab instead.');
      }

      const decrypted = await decryptText(data.encryptedContent, activeKey);

      revealContent.textContent = decrypted;
      revealResult.classList.remove('hidden');
      
      // Clear inputs
      revealInputLink.value = '';
      revealInputAlias.value = '';

    } catch (err) {
      revealErrorText.textContent = err.message;
      revealError.classList.remove('hidden');
    } finally {
      btnReveal.disabled = false;
      btnReveal.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        Reveal Secret
      `;
    }
  });
});
