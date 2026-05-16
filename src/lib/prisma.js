// src/lib/prisma.js
// Singleton Prisma client — mencegah koneksi dobel saat hot-reload

const { PrismaClient } = require('@prisma/client');

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

module.exports = prisma;
