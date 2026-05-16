// src/routes/profile.js
const router      = require('express').Router();
const prisma      = require('../lib/prisma');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

// ── GET /profile ─────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, phone: true, profileImage: true },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('[GET /profile]', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil profil' });
  }
});

// ── PUT /profile ─────────────────────────────────────────────────
// Body: { name?, phone?, profileImage? (base64 string atau path) }
router.put('/', async (req, res) => {
  try {
    const { name, phone, profileImage } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(name         !== undefined && { name }),
        ...(phone        !== undefined && { phone }),
        ...(profileImage !== undefined && { profileImage }),
      },
      select: { id: true, email: true, name: true, phone: true, profileImage: true },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[PUT /profile]', err);
    res.status(500).json({ success: false, message: 'Gagal mengupdate profil' });
  }
});

module.exports = router;
