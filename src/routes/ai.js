// src/routes/ai.js
// Proxy ke Gemini API — API key tidak pernah sampai ke Flutter

const router      = require('express').Router();
const fetch       = require('node-fetch');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

const GEMINI_URL = () =>
  `https://generativelanguage.googleapis.com/v1/models/${process.env.GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

// ── Helper: call Gemini ──────────────────────────────────────────
async function callGemini(contents, maxTokens = 1024) {
  const resp = await fetch(GEMINI_URL(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature: 0.1, maxOutputTokens: maxTokens },
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    const err = new Error(`Gemini error ${resp.status}`);
    err.status = resp.status === 429 ? 429 : 502;
    err.detail = body;
    throw err;
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini tidak mengembalikan teks');
  return text;
}

// ── Helper: bersihkan JSON dari markdown fence ───────────────────
function parseGeminiJson(raw) {
  let s = raw.replaceAll('```json', '').replaceAll('```', '').replaceAll('\r', '').trim();
  const start = s.indexOf('{');
  const end   = s.lastIndexOf('}');
  if (start >= 0 && end > start) s = s.substring(start, end + 1);
  return JSON.parse(s);
}

// ── POST /ai/analyze-image ───────────────────────────────────────
// Dipakai oleh camera_screen.dart
// Body: { imageBase64: string (jpeg base64) }
router.post('/analyze-image', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'imageBase64 wajib diisi' });
    }

    const raw = await callGemini([
      {
        parts: [
          {
            text: 'Lihat gambar ini. Balas HANYA JSON tanpa markdown:\n{"foodName":"nama makanan","expiryDate":"DD/MM/YYYY atau null","shelfLifeDays":7,"storageRecommendation":"cara penyimpanan 2-3 kalimat bahasa Indonesia","wasteCategory":"organic atau nonOrganic"}',
          },
          {
            inline_data: { mime_type: 'image/jpeg', data: imageBase64 },
          },
        ],
      },
    ], 2048);

    const parsed = parseGeminiJson(raw);
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('[POST /ai/analyze-image]', err);
    const status = err.status || 500;
    const msg = status === 429
      ? 'Terlalu banyak request ke AI. Tunggu sebentar.'
      : 'Gagal menganalisa gambar';
    res.status(status).json({ success: false, message: msg });
  }
});

// ── POST /ai/analyze-text ────────────────────────────────────────
// Dipakai oleh add_food_screen.dart
// Body: { foodName: string }
router.post('/analyze-text', async (req, res) => {
  try {
    const { foodName } = req.body;
    if (!foodName) {
      return res.status(400).json({ success: false, message: 'foodName wajib diisi' });
    }

    const raw = await callGemini([
      {
        parts: [
          {
            text: `Berikan informasi singkat untuk makanan bernama "${foodName}". `
              + 'Jawab dengan JSON: storageRecommendation (string, max 100 karakter, tanpa tanda petik di dalam kalimat, tanpa newline), '
              + 'wasteCategory (string: organic atau nonOrganic), '
              + 'shelfLifeDays (integer). '
              + 'organic = bahan segar alami. nonOrganic = kemasan pabrik.',
          },
        ],
      },
    ], 512);

    const parsed = parseGeminiJson(raw);
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('[POST /ai/analyze-text]', err);
    res.status(err.status || 500).json({ success: false, message: 'Gagal menganalisa nama makanan' });
  }
});

// ── POST /ai/detect-category ─────────────────────────────────────
// Dipakai oleh trash_screen.dart
// Body: { foodName: string }
router.post('/detect-category', async (req, res) => {
  try {
    const { foodName } = req.body;
    if (!foodName) {
      return res.status(400).json({ success: false, message: 'foodName wajib diisi' });
    }

    const raw = await callGemini([
      {
        parts: [
          {
            text: `Makanan bernama "${foodName}". Jawab HANYA dengan satu kata: "organic" atau "nonOrganic". `
              + 'organic = bahan segar/alami (sayur, buah, daging, telur, nasi, tempe, tahu, roti). '
              + 'nonOrganic = kemasan plastik/kaleng/produk pabrik olahan.',
          },
        ],
      },
    ], 10);

    const category = raw.toLowerCase().includes('nonorganic') || raw.toLowerCase().includes('non')
      ? 'nonOrganic'
      : 'organic';

    res.json({ success: true, data: { wasteCategory: category } });
  } catch (err) {
    console.error('[POST /ai/detect-category]', err);
    res.status(err.status || 500).json({ success: false, message: 'Gagal mendeteksi kategori' });
  }
});

module.exports = router;
