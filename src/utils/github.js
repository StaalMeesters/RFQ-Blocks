const REPO = 'StaalMeesters/RFQ-Blocks';
const BRANCH = 'master';

export function getGitHubToken() {
  return localStorage.getItem('github_pat') || '';
}

export function setGitHubToken(token) {
  if (token) {
    localStorage.setItem('github_pat', token.trim());
  } else {
    localStorage.removeItem('github_pat');
  }
}

export function hasGitHubToken() {
  return !!getGitHubToken();
}

/**
 * Save a JSON file to the GitHub repo via the Contents API.
 * @param {string} path - Repo-relative path, e.g. "public/data/categories/pg03_site_facilities.json"
 * @param {object} content - JSON-serializable object
 * @param {string} message - Commit message
 * @returns {{ ok: boolean, error?: string }}
 */
export async function saveToGitHub(path, content, message) {
  const token = getGitHubToken();
  if (!token) {
    return { ok: false, error: 'Geen GitHub token geconfigureerd' };
  }

  try {
    // Get current file SHA (required for updates)
    const getResp = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,
      { headers: { Authorization: `token ${token}` } }
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
          Authorization: `token ${token}`,
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
 * @param {string} categoryId - e.g. "site_facilities"
 * @param {string} filename - e.g. "pg03_site_facilities.json"
 * @param {object} data - The full category JSON object
 * @param {string} userName - Who made the edit
 * @param {string} detail - What was changed
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
