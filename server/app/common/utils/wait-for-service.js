async function waitForService(url, maxAttempts = 30, delayMs = 1000) {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok || response.status === 404 || response.status === 405) {
        console.log(`Service is online at ${url} (attempt ${attempt})`);
        return true;
      }
    } catch (_) {
    }

    console.log(`Attempt ${attempt}/${maxAttempts} failed for ${url}. Retrying in ${delayMs}ms...`);
    await delay(delayMs);
  }

  console.error(`Service at ${url} did not come online after ${maxAttempts} attempts.`);
  return false;
}

async function waitForLookup(baseUrl, maxAttempts = 30, delayMs = 1000) {
  const url = `${baseUrl.replace(/\/$/, '')}/api/search?query=health`;
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`Lookup is online at ${baseUrl} (attempt ${attempt})`);
        return true;
      }
    } catch (_) {
    }

    console.log(`Attempt ${attempt}/${maxAttempts} failed for lookup ${baseUrl}. Retrying in ${delayMs}ms...`);
    await delay(delayMs);
  }

  console.error(`Lookup at ${baseUrl} did not come online after ${maxAttempts} attempts.`);
  return false;
}

module.exports = waitForService;
module.exports.waitForLookup = waitForLookup;
