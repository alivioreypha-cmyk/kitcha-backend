// src/routes/auth.js
const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const prisma   = require('../lib/prisma');
const requireAuth = require('../middleware/auth');

// ── Helper buat token ────────────────────────────────────────────
function makeToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
}

// ── POST /auth/register ──────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name: name || 'Bunda' },
    });

    const token = makeToken(user.id);
    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ success: false, message: 'Gagal register' });
  }
});

// ── POST /auth/login ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const token = makeToken(user.id);
    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, profileImage: user.profileImage },
    });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ success: false, message: 'Gagal login' });
  }
});

// ── POST /auth/change-password  (butuh login) ───────────────────
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Password lama salah' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.userId }, data: { passwordHash } });

    res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (err) {
    console.error('[change-password]', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah password' });
  }
});

// ── DELETE /auth/delete-account  (butuh login) ──────────────────
router.delete('/delete-account', requireAuth, async (req, res) => {
  try {
    // Cascade delete — semua FoodItem user ikut terhapus (lihat schema)
    await prisma.user.delete({ where: { id: req.userId } });
    res.json({ success: true, message: 'Akun berhasil dihapus' });
  } catch (err) {
    console.error('[delete-account]', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus akun' });
  }
});

module.exports = router;
