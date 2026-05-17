// src/routes/foods.js
// Versi optimized:
// - Select field spesifik (tidak fetch passwordHash dll)
// - Pagination support
// - Filter by expiry status
// - Batch insert support

const router      = require('express').Router();
const prisma      = require('../lib/prisma');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

// ── GET /foods ────────────────────────────────────────────────────
// Query param opsional:
//   ?status=expiring   → hanya yang exp dalam 3 hari
//   ?status=expired    → hanya yang sudah exp
//   ?limit=50&offset=0 → pagination
router.get('/', async (req, res) => {
  try {
    const { status, limit = '200', offset = '0' } = req.query;
    const now = new Date();

    // Build where clause berdasarkan filter
    let expiryFilter = {};
    if (status === 'expired') {
      expiryFilter = { expiryDate: { lt: now } };
    } else if (status === 'expiring') {
      const threeDaysLater = new Date(now);
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      expiryFilter = { expiryDate: { gte: now, lte: threeDaysLater } };
    }

    const foods = await prisma.foodItem.findMany({
      where: {
        userId: req.userId,
        ...expiryFilter,
      },
      // Hanya select field yang dibutuhkan Flutter
      select: {
        id: true,
        name: true,
        expiryDate: true,
        imagePath: true,
        storageRecommendation: true,
        wasteCategory: true,
      },
      orderBy: { expiryDate: 'asc' },
      take: Math.min(parseInt(limit), 500), // max 500 per request
      skip: parseInt(offset),
    });

    res.json({
      success: true,
      data: foods.map(f => ({
        ...f,
        expiryDate: f.expiryDate.toISOString(),
      })),
      total: foods.length,
    });
  } catch (err) {
    console.error('[GET /foods]', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data makanan' });
  }
});

// ── POST /foods ────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { id, name, expiryDate, imagePath, storageRecommendation, wasteCategory } = req.body;

    if (!id || !name || !expiryDate) {
      return res.status(400).json({ success: false, message: 'id, name, expiryDate wajib diisi' });
    }

    const food = await prisma.foodItem.create({
      data: {
        id,
        name,
        expiryDate: new Date(expiryDate),
        imagePath: imagePath || '',
        storageRecommendation: storageRecommendation || '',
        wasteCategory: wasteCategory || 'loading',
        userId: req.userId,
      },
      select: {
        id: true,
        name: true,
        expiryDate: true,
        imagePath: true,
        storageRecommendation: true,
        wasteCategory: true,
      },
    });

    res.status(201).json({
      success: true,
      data: { ...food, expiryDate: food.expiryDate.toISOString() },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'ID makanan sudah ada' });
    }
    console.error('[POST /foods]', err);
    res.status(500).json({ success: false, message: 'Gagal menyimpan makanan' });
  }
});

// ── POST /foods/batch ─────────────────────────────────────────────
// Insert banyak makanan sekaligus (misal dari import)
// Body: { foods: [{ id, name, expiryDate, ... }] }
router.post('/batch', async (req, res) => {
  try {
    const { foods } = req.body;
    if (!Array.isArray(foods) || foods.length === 0) {
      return res.status(400).json({ success: false, message: 'foods harus array dan tidak boleh kosong' });
    }
    if (foods.length > 50) {
      return res.status(400).json({ success: false, message: 'Maksimal 50 item per batch' });
    }

    const created = await prisma.foodItem.createMany({
      data: foods.map(f => ({
        id: f.id,
        name: f.name,
        expiryDate: new Date(f.expiryDate),
        imagePath: f.imagePath || '',
        storageRecommendation: f.storageRecommendation || '',
        wasteCategory: f.wasteCategory || 'loading',
        userId: req.userId,
      })),
      skipDuplicates: true,
    });

    res.status(201).json({
      success: true,
      message: `${created.count} makanan berhasil ditambahkan`,
      count: created.count,
    });
  } catch (err) {
    console.error('[POST /foods/batch]', err);
    res.status(500).json({ success: false, message: 'Gagal batch insert makanan' });
  }
});

// ── PUT /foods/:id ────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.foodItem.findFirst({
      where: { id, userId: req.userId },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Makanan tidak ditemukan' });
    }

    const { name, expiryDate, imagePath, storageRecommendation, wasteCategory } = req.body;

    const updated = await prisma.foodItem.update({
      where: { id },
      data: {
        ...(name               && { name }),
        ...(expiryDate         && { expiryDate: new Date(expiryDate) }),
        ...(imagePath          !== undefined && { imagePath }),
        ...(storageRecommendation !== undefined && { storageRecommendation }),
        ...(wasteCategory      && { wasteCategory }),
      },
      select: {
        id: true,
        name: true,
        expiryDate: true,
        imagePath: true,
        storageRecommendation: true,
        wasteCategory: true,
      },
    });

    res.json({
      success: true,
      data: { ...updated, expiryDate: updated.expiryDate.toISOString() },
    });
  } catch (err) {
    console.error('[PUT /foods/:id]', err);
    res.status(500).json({ success: false, message: 'Gagal mengupdate makanan' });
  }
});

// ── DELETE /foods/:id ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.foodItem.findFirst({
      where: { id, userId: req.userId },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Makanan tidak ditemukan' });
    }

    await prisma.foodItem.delete({ where: { id } });
    res.json({ success: true, message: 'Makanan berhasil dihapus' });
  } catch (err) {
    console.error('[DELETE /foods/:id]', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus makanan' });
  }
});

// ── DELETE /foods/bulk ────────────────────────────────────────────
// Hapus banyak makanan sekaligus
// Body: { ids: ["id1", "id2", ...] }
router.delete('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids harus array dan tidak boleh kosong' });
    }

    const result = await prisma.foodItem.deleteMany({
      where: {
        id: { in: ids },
        userId: req.userId, // pastikan hanya hapus milik user ini
      },
    });

    res.json({
      success: true,
      message: `${result.count} makanan berhasil dihapus`,
      count: result.count,
    });
  } catch (err) {
    console.error('[DELETE /foods/bulk]', err);
    res.status(500).json({ success: false, message: 'Gagal bulk delete makanan' });
  }
});

module.exports = router;
