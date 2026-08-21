import { log } from 'apify';

const BASE_URL = 'https://rubygems.org/api/v1/gems';
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000;

async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

async function fetchGem(name) {
    const url = `${BASE_URL}/${encodeURIComponent(name)}.json`;

    let lastErr;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const res = await fetchWithTimeout(url);
            if (res.status === 404) return { found: false };

            const body = await res.json().catch(() => null);
            if (res.ok && body && typeof body === 'object') return { found: true, data: body };

            const retryable = res.status === 429 || res.status >= 500 || body === null;
            lastErr = new Error(`RubyGems API request failed for "${name}": ${res.status} ${res.statusText}`);
            if (!retryable) throw lastErr;
        } catch (err) {
            lastErr = err.name === 'AbortError'
                ? new Error(`RubyGems API request timed out for "${name}" (attempt ${attempt}/${MAX_ATTEMPTS})`)
                : err;
        }
        if (attempt < MAX_ATTEMPTS) {
            const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
            log.warning(`Retrying RubyGems request for "${name}" in ${delay}ms (attempt ${attempt}/${MAX_ATTEMPTS}): ${lastErr.message}`);
            await new Promise((r) => setTimeout(r, delay));
        }
    }
    throw lastErr;
}

export async function fetchGems(gemNames) {
    const results = [];
    for (const name of gemNames) {
        try {
            const outcome = await fetchGem(name);
            if (!outcome.found) {
                results.push({ gemName: name, found: false });
                continue;
            }
            const g = outcome.data;
            results.push({
                gemName: g.name ?? name,
                found: true,
                latestVersion: g.version ?? null,
                latestVersionReleasedAt: g.version_created_at ?? null,
                yanked: g.yanked ?? null,
                totalDownloads: g.downloads ?? null,
                latestVersionDownloads: g.version_downloads ?? null,
                licenses: Array.isArray(g.licenses) ? g.licenses : null,
                authors: g.authors ?? null,
                homepageUrl: g.homepage_uri ?? null,
                sourceCodeUrl: g.source_code_uri ?? null,
                documentationUrl: g.documentation_uri ?? null,
                runtimeDependencies: Array.isArray(g.dependencies?.runtime)
                    ? g.dependencies.runtime.map((d) => ({ name: d?.name ?? null, requirements: d?.requirements ?? null }))
                    : [],
            });
        } catch (err) {
            log.warning(`Skipping "${name}" after repeated failures: ${err.message}`);
            results.push({ gemName: name, found: false, error: err.message });
        }
    }
    return results;
}
