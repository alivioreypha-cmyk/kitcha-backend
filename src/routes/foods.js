// src/routes/foods.js
// Semua endpoint butuh JWT — persis seperti DBHelper di Flutter sebelumnya

const router      = require('express').Router();
const prisma      = require('../lib/prisma');
const requireAuth = require('../middleware/auth');

// Semua route di sini wajib login
router.use(requireAuth);

// ── GET /foods  → getAllFoods ────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const foods = await prisma.foodItem.findMany({
      where: { userId: req.userId },
      orderBy: { expiryDate: 'asc' },
    });

    // Konversi ke format yang sama dengan FoodItem.fromMap() di Flutter
    const result = foods.map(f => ({
      id: f.id,
      name: f.name,
      expiryDate: f.expiryDate.toISOString(),
      imagePath: f.imagePath,
      storageRecommendation: f.storageRecommendation,
      wasteCategory: f.wasteCategory,
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[GET /foods]', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data makanan' });
  }
});

// ── POST /foods  → insertFood ────────────────────────────────────
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
    });

    res.status(201).json({
      success: true,
      data: {
        id: food.id,
        name: food.name,
        expiryDate: food.expiryDate.toISOString(),
        imagePath: food.imagePath,
        storageRecommendation: food.storageRecommendation,
        wasteCategory: food.wasteCategory,
      },
    });
  } catch (err) {
    // Conflict: ID sudah ada — upsert
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'ID makanan sudah ada' });
    }
    console.error('[POST /foods]', err);
    res.status(500).json({ success: false, message: 'Gagal menyimpan makanan' });
  }
});

// ── PUT /foods/:id  → updateFood ────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Pastikan makanan milik user ini
    const existing = await prisma.foodItem.findFirst({
      where: { id, userId: req.userId },
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
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        expiryDate: updated.expiryDate.toISOString(),
        imagePath: updated.imagePath,
        storageRecommendation: updated.storageRecommendation,
        wasteCategory: updated.wasteCategory,
      },
    });
  } catch (err) {
    console.error('[PUT /foods/:id]', err);
    res.status(500).json({ success: false, message: 'Gagal mengupdate makanan' });
  }
});

// ── DELETE /foods/:id  → deleteFood ─────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.foodItem.findFirst({
      where: { id, userId: req.userId },
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

module.exports = router;
