// src/routes/barcode.js
// Integrasi Open Food Facts API untuk lookup produk via barcode
// Dikombinasikan dengan shelf life database lokal untuk info penyimpanan

const router      = require('express').Router();
const fetch       = require('node-fetch');
const requireAuth = require('../middleware/auth');
const { SHELF_LIFE_DB } = require('./shelflife');

const OFF_URL = (barcode) =>
  `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_id,brands,categories,quantity,image_url,expiration_date,countries`;

// ── Helper: cari shelf life dari DB lokal ───────────────────────
function findShelfLife(productName) {
  if (!productName) return null;
  const q = productName.toLowerCase();
  return SHELF_LIFE_DB.find(item =>
    item.aliases.some(alias => q.includes(alias)) ||
    q.includes(item.name.toLowerCase())
  ) || null;
}

// ── Helper: parse tanggal exp dari Open Food Facts ───────────────
// Format bisa: "2026-12", "12/2026", "31/12/2026", dll
function parseExpDate(raw) {
  if (!raw) return null;
  try {
    // Format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return new Date(raw).toISOString();
    }
    // Format YYYY-MM
    if (/^\d{4}-\d{2}$/.test(raw)) {
      const [y, m] = raw.split('-');
      // Pakai hari terakhir bulan tersebut
      const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
      return new Date(`${y}-${m}-${lastDay}`).toISOString();
    }
    // Format MM/YYYY
    if (/^\d{2}\/\d{4}$/.test(raw)) {
      const [m, y] = raw.split('/');
      const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
      return new Date(`${y}-${m}-${lastDay}`).toISOString();
    }
    // Format DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      const [d, m, y] = raw.split('/');
      return new Date(`${y}-${m}-${d}`).toISOString();
    }
  } catch (_) {}
  return null;
}

// ── GET /barcode/:code ───────────────────────────────────────────
router.get('/:code', requireAuth, async (req, res) => {
  const { code } = req.params;

  // Validasi barcode — hanya angka, 8-14 digit
  if (!/^\d{8,14}$/.test(code)) {
    return res.status(400).json({
      success: false,
      message: 'Barcode tidak valid. Harus 8-14 digit angka.',
    });
  }

  try {
    const resp = await fetch(OFF_URL(code), {
      headers: { 'User-Agent': 'KitchaApp/1.0 (contact@kitcha.app)' },
    });

    if (!resp.ok) {
      return res.status(502).json({
        success: false,
        message: 'Gagal menghubungi database produk',
      });
    }

    const data = await resp.json();

    // Produk tidak ditemukan di Open Food Facts
    if (data.status === 0 || !data.product) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan. Coba input manual.',
      });
    }

    const p = data.product;

    // Ambil nama produk — prioritas nama Indonesia
    const productName = p.product_name_id || p.product_name || 'Produk Tidak Dikenal';
    const brand = p.brands || '';
    const displayName = brand ? `${productName} (${brand})` : productName;

    // Cari info shelf life dari DB lokal
    const shelfInfo = findShelfLife(productName);

    // Parse tanggal exp dari produk jika ada
    const expDateIso = parseExpDate(p.expiration_date);

    // Hitung shelf life days
    let shelfLifeDays = shelfInfo?.shelfLifeDays?.fridge || 7;
    if (expDateIso) {
      const daysUntilExp = Math.floor(
        (new Date(expDateIso) - new Date()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExp > 0) shelfLifeDays = daysUntilExp;
    }

    res.json({
      success: true,
      data: {
        barcode: code,
        foodName: displayName,
        brand: brand,
        quantity: p.quantity || '',
        imageUrl: p.image_url || '',
        expiryDate: expDateIso,         // null jika tidak ada di kemasan
        shelfLifeDays,
        storageRecommendation: shelfInfo?.storageRecommendation ||
          'Simpan di tempat sejuk dan kering sesuai petunjuk kemasan.',
        wasteCategory: shelfInfo?.wasteCategory || 'nonOrganic',
        tips: shelfInfo?.tips || '',
        foundInLocalDB: !!shelfInfo,    // apakah ada di shelf life DB lokal
      },
    });
  } catch (err) {
    console.error('[GET /barcode/:code]', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mencari produk',
    });
  }
});

module.exports = router;
