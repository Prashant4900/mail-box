const os = require('os');

const WEBSITE_ID = '387076d7-6205-44a4-8a31-0e89bfa8447b';
const UMAMI_ENDPOINT = 'https://umami.toplevelapp.top/api/send';

async function ping() {
  if (process.env.DISABLE_TELEMETRY || process.env.DO_NOT_TRACK) return;

  try {
    const res = await fetch(UMAMI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        type: 'event',
        payload: {
          website: WEBSITE_ID,
          name: 'npm_install',
          url: '/postinstall',
          hostname: 'cli-install',
          language: 'en-US',
          screen: '1920x1080',
          title: 'npm install',
          data: {
            platform: os.platform(),
            arch: os.arch(),
            node: process.version,
          },
        },
      }),
    });

    if (process.env.TELEMETRY_DEBUG) {
      console.log('Umami status:', res.status);
      console.log('Umami response:', await res.text());
    }
  } catch (e) {
    if (process.env.TELEMETRY_DEBUG) console.error('Telemetry error:', e);
  }
}

ping();