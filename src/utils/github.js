// Baked in at build time by Vite from .env
const TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';
const REPO = import.meta.env.VITE_GITHUB_REPO || 'staalmeesters/RFQ-Blocks';
const BRANCH = 'master';

export function hasGitHubToken() {
  return !!TOKEN;
}

/**
 * Save a JSON file to the GitHub repo via the Contents API.
 * @param {string} path - Repo-relative path, e.g. "public/data/categories/pg03_site_facilities.json"
 * @param {object} content - JSON-serializable object
 * @param {string} message - Commit message
 * @returns {{ ok: boolean, error?: string }}
 */
export async function saveToGitHub(path, content, message) {
  if (!TOKEN) {
    return { ok: false, error: 'Geen GitHub token geconfigureerd' };
  }

  try {
    // Get current file SHA (required for updates)
    const getResp = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,
      { headers: { Authorization: `token ${TOKEN}` } }
    );

    let sha = undefined;
    if (getResp.ok) {
      const current = await getResp.json();
      sha = current.sha;
    } else if (getResp.status !== 404) {
      const errData = await getResp.json().catch(() => ({}));
      return { ok: false, error: errData.message || `GitHub GET fout: ${getResp.status}` };
    }

    // Encode content as base64
    const jsonStr = JSON.stringify(content, null, 2);
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));

    // Commit the update
    const body = {
      message,
      content: encoded,
      branch: BRANCH,
    };
    if (sha) body.sha = sha;

    const putResp = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (putResp.ok) {
      return { ok: true };
    }

    const errData = await putResp.json().catch(() => ({}));
    return { ok: false, error: errData.message || `GitHub PUT fout: ${putResp.status}` };
  } catch (err) {
    return { ok: false, error: err.message || 'Netwerkfout' };
  }
}

/**
 * Save a category JSON to GitHub.
 */
export async function saveCategoryToGitHub(categoryId, filename, data, userName, detail) {
  const path = `public/data/categories/${filename}`;
  const message = `edit: ${userName || 'onbekend'} updated ${categoryId} — ${detail || 'wijziging'}`;
  return saveToGitHub(path, data, message);
}

/**
 * Save master-chapters.json to GitHub.
 */
export async function saveMasterChaptersToGitHub(data, userName, detail) {
  const path = 'public/data/master-chapters.json';
  const message = `edit: ${userName || 'onbekend'} updated master-chapters — ${detail || 'wijziging'}`;
  return saveToGitHub(path, data, message);
}
