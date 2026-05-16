// src/routes/shelflife.js
// Database referensi ketahanan bahan makanan
// 20 item Indonesia + 10 item internasional

const router      = require('express').Router();
const requireAuth = require('../middleware/auth');

// ── Database shelf life ──────────────────────────────────────────
const SHELF_LIFE_DB = [
  // ═══════════════════════════════════
  // INDONESIA (20 item)
  // ═══════════════════════════════════
  {
    id: 1,
    name: 'Ayam Segar',
    aliases: ['ayam', 'daging ayam', 'chicken'],
    category: 'Daging & Unggas',
    shelfLifeDays: { fridge: 2, freezer: 270, roomTemp: 0 },
    storageRecommendation: 'Simpan di kulkas maks 2 hari atau freezer hingga 9 bulan. Bungkus rapat agar tidak terkontaminasi.',
    wasteCategory: 'organic',
    tips: 'Jangan cuci ayam sebelum disimpan, cuci saat akan dimasak saja.'
  },
  {
    id: 2,
    name: 'Tempe',
    aliases: ['tempe', 'tempeh'],
    category: 'Protein Nabati',
    shelfLifeDays: { fridge: 7, freezer: 60, roomTemp: 2 },
    storageRecommendation: 'Simpan di kulkas hingga 7 hari atau bungkus plastik di suhu ruang maks 2 hari.',
    wasteCategory: 'organic',
    tips: 'Jangan bungkus tempe terlalu rapat agar tidak berlendir.'
  },
  {
    id: 3,
    name: 'Tahu',
    aliases: ['tahu', 'tofu'],
    category: 'Protein Nabati',
    shelfLifeDays: { fridge: 4, freezer: 30, roomTemp: 1 },
    storageRecommendation: 'Rendam dalam air bersih dan simpan di kulkas, ganti airnya setiap hari. Tahan hingga 4 hari.',
    wasteCategory: 'organic',
    tips: 'Tahu yang sudah asam berbau masam, segera buang.'
  },
  {
    id: 4,
    name: 'Kangkung',
    aliases: ['kangkung', 'water spinach'],
    category: 'Sayuran',
    shelfLifeDays: { fridge: 3, freezer: 0, roomTemp: 1 },
    storageRecommendation: 'Bungkus dengan koran lembab dan simpan di laci sayur kulkas. Hindari mencuci sebelum disimpan.',
    wasteCategory: 'organic',
    tips: 'Kangkung cepat layu, masak sesegera mungkin.'
  },
  {
    id: 5,
    name: 'Bayam',
    aliases: ['bayam', 'spinach'],
    category: 'Sayuran',
    shelfLifeDays: { fridge: 3, freezer: 0, roomTemp: 1 },
    storageRecommendation: 'Simpan dalam wadah tertutup di kulkas. Jangan dicuci sebelum disimpan.',
    wasteCategory: 'organic',
    tips: 'Bayam tidak boleh dipanaskan ulang karena nitrat bisa menjadi nitrit berbahaya.'
  },
  {
    id: 6,
    name: 'Ikan Segar',
    aliases: ['ikan', 'ikan segar', 'fish'],
    category: 'Ikan & Seafood',
    shelfLifeDays: { fridge: 2, freezer: 180, roomTemp: 0 },
    storageRecommendation: 'Bersihkan isi perut lalu simpan dalam wadah tertutup di kulkas maks 2 hari atau freezer 6 bulan.',
    wasteCategory: 'organic',
    tips: 'Ikan segar berbau laut ringan, bukan amis menyengat.'
  },
  {
    id: 7,
    name: 'Telur Ayam',
    aliases: ['telur', 'telur ayam', 'egg', 'eggs'],
    category: 'Telur & Susu',
    shelfLifeDays: { fridge: 35, freezer: 0, roomTemp: 14 },
    storageRecommendation: 'Simpan di kulkas bagian dalam (bukan pintu) posisi ujung runcing ke bawah. Tahan 5 minggu.',
    wasteCategory: 'organic',
    tips: 'Tes kesegaran: masukkan ke air, telur segar tenggelam.'
  },
  {
    id: 8,
    name: 'Nasi Putih',
    aliases: ['nasi', 'nasi putih', 'rice', 'cooked rice'],
    category: 'Karbohidrat',
    shelfLifeDays: { fridge: 4, freezer: 60, roomTemp: 0 },
    storageRecommendation: 'Nasi matang simpan di wadah tertutup di kulkas maks 4 hari. Panaskan hingga benar-benar panas sebelum makan.',
    wasteCategory: 'organic',
    tips: 'Nasi tidak boleh dibiarkan di suhu ruang lebih dari 2 jam.'
  },
  {
    id: 9,
    name: 'Daging Sapi',
    aliases: ['daging sapi', 'sapi', 'beef'],
    category: 'Daging & Unggas',
    shelfLifeDays: { fridge: 3, freezer: 270, roomTemp: 0 },
    storageRecommendation: 'Simpan di kulkas maks 3 hari atau freezer hingga 9 bulan. Bungkus vakum agar tahan lebih lama.',
    wasteCategory: 'organic',
    tips: 'Daging sapi segar berwarna merah cerah, bukan kecoklatan.'
  },
  {
    id: 10,
    name: 'Toge',
    aliases: ['toge', 'tauge', 'bean sprouts'],
    category: 'Sayuran',
    shelfLifeDays: { fridge: 2, freezer: 0, roomTemp: 0 },
    storageRecommendation: 'Simpan dalam wadah berisi air di kulkas. Ganti air setiap hari. Gunakan dalam 2 hari.',
    wasteCategory: 'organic',
    tips: 'Toge busuk berbau asam dan berlendir, segera buang.'
  },
  {
    id: 11,
    name: 'Santan Segar',
    aliases: ['santan', 'coconut milk'],
    category: 'Bumbu & Pelengkap',
    shelfLifeDays: { fridge: 2, freezer: 30, roomTemp: 0 },
    storageRecommendation: 'Simpan santan segar di kulkas maks 2 hari atau bekukan dalam es batu untuk penyimpanan lebih lama.',
    wasteCategory: 'organic',
    tips: 'Santan basi berbau asam dan berubah warna kekuningan.'
  },
  {
    id: 12,
    name: 'Tahu Sumedang',
    aliases: ['tahu sumedang', 'tahu goreng'],
    category: 'Protein Nabati',
    shelfLifeDays: { fridge: 3, freezer: 0, roomTemp: 1 },
    storageRecommendation: 'Simpan dalam wadah tertutup di kulkas. Hangatkan kembali dengan digoreng sebentar sebelum dimakan.',
    wasteCategory: 'organic',
    tips: 'Hindari menyimpan tahu goreng di wadah tertutup rapat saat masih panas.'
  },
  {
    id: 13,
    name: 'Pisang',
    aliases: ['pisang', 'banana'],
    category: 'Buah',
    shelfLifeDays: { fridge: 7, freezer: 90, roomTemp: 4 },
    storageRecommendation: 'Simpan di suhu ruang jauh dari buah lain. Masukkan kulkas hanya jika sudah matang untuk memperlambat pembusukan.',
    wasteCategory: 'organic',
    tips: 'Bungkus tangkai pisang dengan plastik untuk memperlambat pematangan.'
  },
  {
    id: 14,
    name: 'Pepaya',
    aliases: ['pepaya', 'papaya'],
    category: 'Buah',
    shelfLifeDays: { fridge: 5, freezer: 0, roomTemp: 3 },
    storageRecommendation: 'Pepaya matang simpan di kulkas hingga 5 hari. Pepaya mentah biarkan di suhu ruang hingga matang.',
    wasteCategory: 'organic',
    tips: 'Potong pepaya dan keluarkan bijinya sebelum disimpan di kulkas.'
  },
  {
    id: 15,
    name: 'Cabai Merah',
    aliases: ['cabai', 'cabe', 'cabai merah', 'chili'],
    category: 'Bumbu & Pelengkap',
    shelfLifeDays: { fridge: 14, freezer: 180, roomTemp: 5 },
    storageRecommendation: 'Simpan cabai kering di kulkas dalam kantong kertas. Bisa dibekukan utuh hingga 6 bulan.',
    wasteCategory: 'organic',
    tips: 'Jangan cuci cabai sebelum disimpan agar tidak cepat berjamur.'
  },
  {
    id: 16,
    name: 'Bawang Merah',
    aliases: ['bawang merah', 'shallot'],
    category: 'Bumbu & Pelengkap',
    shelfLifeDays: { fridge: 30, freezer: 0, roomTemp: 30 },
    storageRecommendation: 'Simpan di tempat kering, gelap, dan berventilasi baik. Jangan simpan di dekat kentang.',
    wasteCategory: 'organic',
    tips: 'Bawang yang sudah tumbuh tunas masih bisa dimakan tapi rasanya lebih pahit.'
  },
  {
    id: 17,
    name: 'Bawang Putih',
    aliases: ['bawang putih', 'garlic'],
    category: 'Bumbu & Pelengkap',
    shelfLifeDays: { fridge: 60, freezer: 0, roomTemp: 60 },
    storageRecommendation: 'Simpan utuh di tempat sejuk dan kering. Setelah dikupas simpan di kulkas dalam wadah tertutup.',
    wasteCategory: 'organic',
    tips: 'Bawang putih yang sudah tumbuh tunas hijau masih aman dimakan.'
  },
  {
    id: 18,
    name: 'Udang Segar',
    aliases: ['udang', 'shrimp', 'prawn'],
    category: 'Ikan & Seafood',
    shelfLifeDays: { fridge: 2, freezer: 180, roomTemp: 0 },
    storageRecommendation: 'Simpan di kulkas maks 2 hari. Untuk freezer, kupas kulit dan kepala terlebih dahulu.',
    wasteCategory: 'organic',
    tips: 'Udang segar berbau laut ringan. Udang basi berbau amonia menyengat.'
  },
  {
    id: 19,
    name: 'Singkong',
    aliases: ['singkong', 'ubi kayu', 'cassava'],
    category: 'Karbohidrat',
    shelfLifeDays: { fridge: 14, freezer: 365, roomTemp: 4 },
    storageRecommendation: 'Singkong segar tahan 4 hari di suhu ruang. Kupas, potong, bekukan untuk penyimpanan hingga setahun.',
    wasteCategory: 'organic',
    tips: 'Singkong yang sudah berubah warna ungu/hitam di dalam masih aman dimakan setelah dimasak matang.'
  },
  {
    id: 20,
    name: 'Susu Sapi Segar',
    aliases: ['susu', 'susu sapi', 'milk'],
    category: 'Telur & Susu',
    shelfLifeDays: { fridge: 7, freezer: 90, roomTemp: 0 },
    storageRecommendation: 'Simpan di kulkas bagian paling dingin (bukan pintu). Konsumsi sebelum tanggal kedaluwarsa.',
    wasteCategory: 'organic',
    tips: 'Susu basi berbau asam dan menggumpal. Jangan konsumsi jika sudah basi.'
  },

  // ═══════════════════════════════════
  // INTERNASIONAL (10 item)
  // ═══════════════════════════════════
  {
    id: 21,
    name: 'Keju Cheddar',
    aliases: ['keju', 'cheddar', 'cheese'],
    category: 'Telur & Susu',
    shelfLifeDays: { fridge: 28, freezer: 180, roomTemp: 0 },
    storageRecommendation: 'Bungkus keju dengan kertas lilin lalu plastik wrap dan simpan di kulkas. Ganti pembungkus setelah dibuka.',
    wasteCategory: 'organic',
    tips: 'Keju keras berjamur bisa dipotong bagian berjamurnya (2cm), sisanya masih aman.'
  },
  {
    id: 22,
    name: 'Wortel',
    aliases: ['wortel', 'carrot'],
    category: 'Sayuran',
    shelfLifeDays: { fridge: 21, freezer: 365, roomTemp: 5 },
    storageRecommendation: 'Potong ujung daunnya dan simpan dalam kantong plastik berlubang di laci sayur kulkas. Tahan hingga 3 minggu.',
    wasteCategory: 'organic',
    tips: 'Wortel yang sedikit layu bisa direndam air dingin selama 30 menit untuk segar kembali.'
  },
  {
    id: 23,
    name: 'Kentang',
    aliases: ['kentang', 'potato'],
    category: 'Karbohidrat',
    shelfLifeDays: { fridge: 0, freezer: 0, roomTemp: 30 },
    storageRecommendation: 'Simpan di tempat gelap, sejuk, dan berventilasi. Jangan simpan di kulkas karena pati berubah menjadi gula.',
    wasteCategory: 'organic',
    tips: 'Jauhkan kentang dari bawang karena saling mempercepat pembusukan.'
  },
  {
    id: 24,
    name: 'Brokoli',
    aliases: ['brokoli', 'broccoli'],
    category: 'Sayuran',
    shelfLifeDays: { fridge: 5, freezer: 365, roomTemp: 1 },
    storageRecommendation: 'Simpan brokoli utuh tanpa dicuci di kantong plastik berlubang di kulkas. Tahan hingga 5 hari.',
    wasteCategory: 'organic',
    tips: 'Brokoli yang menguning masih bisa dimakan, tapi kurang bergizi.'
  },
  {
    id: 25,
    name: 'Tomat',
    aliases: ['tomat', 'tomato'],
    category: 'Sayuran',
    shelfLifeDays: { fridge: 7, freezer: 0, roomTemp: 5 },
    storageRecommendation: 'Tomat matang simpan di suhu ruang jauh dari sinar matahari. Masukkan kulkas hanya jika sudah sangat matang.',
    wasteCategory: 'organic',
    tips: 'Jangan simpan tomat di kulkas sebelum matang karena merusak tekstur dan rasa.'
  },
  {
    id: 26,
    name: 'Apel',
    aliases: ['apel', 'apple'],
    category: 'Buah',
    shelfLifeDays: { fridge: 42, freezer: 0, roomTemp: 7 },
    storageRecommendation: 'Simpan di laci sayur kulkas. Jauhkan dari sayuran lain karena apel mengeluarkan etilen yang mempercepat pembusukan.',
    wasteCategory: 'organic',
    tips: 'Olesi potongan apel dengan air lemon untuk mencegah cokelat.'
  },
  {
    id: 27,
    name: 'Daging Babi',
    aliases: ['pork', 'babi', 'daging babi'],
    category: 'Daging & Unggas',
    shelfLifeDays: { fridge: 3, freezer: 180, roomTemp: 0 },
    storageRecommendation: 'Simpan di kulkas maks 3 hari dalam wadah tertutup. Bekukan dalam porsi kecil untuk kemudahan penggunaan.',
    wasteCategory: 'organic',
    tips: 'Daging babi harus dimasak hingga suhu internal 71°C untuk keamanan.'
  },
  {
    id: 28,
    name: 'Mentega',
    aliases: ['mentega', 'butter'],
    category: 'Lemak & Minyak',
    shelfLifeDays: { fridge: 30, freezer: 270, roomTemp: 2 },
    storageRecommendation: 'Simpan mentega terbungkus di kulkas. Bisa dibekukan hingga 9 bulan tanpa kehilangan kualitas.',
    wasteCategory: 'nonOrganic',
    tips: 'Mentega yang berbau tengik sudah tidak layak konsumsi.'
  },
  {
    id: 29,
    name: 'Salmon Segar',
    aliases: ['salmon', 'ikan salmon'],
    category: 'Ikan & Seafood',
    shelfLifeDays: { fridge: 2, freezer: 90, roomTemp: 0 },
    storageRecommendation: 'Simpan di bagian terdingin kulkas maks 2 hari. Bekukan dalam plastik kedap udara hingga 3 bulan.',
    wasteCategory: 'organic',
    tips: 'Salmon segar berbau laut ringan dan teksturnya kenyal.'
  },
  {
    id: 30,
    name: 'Yogurt',
    aliases: ['yogurt', 'yoghurt'],
    category: 'Telur & Susu',
    shelfLifeDays: { fridge: 14, freezer: 60, roomTemp: 0 },
    storageRecommendation: 'Simpan di kulkas dalam wadah aslinya. Aduk cairan yang terpisah sebelum dikonsumsi.',
    wasteCategory: 'organic',
    tips: 'Yogurt yang masih baik mungkin ada cairan bening di atas, itu whey dan masih aman.'
  },
  {
    id: 31,
    name: 'Jagung',
    aliases: ['jagung', 'corn'],
    category: 'Karbohidrat',
    shelfLifeDays: { fridge: 3, freezer: 365, roomTemp: 1 },
    storageRecommendation: 'Simpan jagung dengan kulitnya di kulkas maks 3 hari. Untuk freezer, blanching dulu sebelum dibekukan.',
    wasteCategory: 'organic',
    tips: 'Jagung paling manis dalam 24 jam setelah dipetik.'
  },
  {
    id: 32,
    name: 'Alpukat',
    aliases: ['alpukat', 'avocado'],
    category: 'Buah',
    shelfLifeDays: { fridge: 5, freezer: 0, roomTemp: 4 },
    storageRecommendation: 'Alpukat mentah biarkan matang di suhu ruang. Setelah matang simpan di kulkas hingga 5 hari.',
    wasteCategory: 'organic',
    tips: 'Olesi potongan alpukat dengan air lemon dan bungkus rapat untuk mencegah pencoklatan.'
  },
];

// ── GET /shelflife/search?q=ayam ─────────────────────────────────
// Cari item berdasarkan nama atau alias
router.get('/search', requireAuth, (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();

  if (!q || q.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Query minimal 2 karakter',
    });
  }

  const results = SHELF_LIFE_DB.filter(item =>
    item.name.toLowerCase().includes(q) ||
    item.aliases.some(alias => alias.toLowerCase().includes(q))
  );

  res.json({
    success: true,
    data: results.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      shelfLifeDays: item.shelfLifeDays,
      storageRecommendation: item.storageRecommendation,
      wasteCategory: item.wasteCategory,
      tips: item.tips,
    })),
    total: results.length,
  });
});

// ── GET /shelflife/all ───────────────────────────────────────────
// Ambil semua item (untuk keperluan display atau cache di Flutter)
router.get('/all', requireAuth, (req, res) => {
  const { category } = req.query;

  let data = SHELF_LIFE_DB;
  if (category) {
    data = SHELF_LIFE_DB.filter(
      item => item.category.toLowerCase() === category.toLowerCase()
    );
  }

  res.json({
    success: true,
    data: data.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      shelfLifeDays: item.shelfLifeDays,
      storageRecommendation: item.storageRecommendation,
      wasteCategory: item.wasteCategory,
      tips: item.tips,
    })),
    total: data.length,
  });
});

// ── GET /shelflife/categories ────────────────────────────────────
router.get('/categories', requireAuth, (req, res) => {
  const categories = [...new Set(SHELF_LIFE_DB.map(item => item.category))];
  res.json({ success: true, data: categories });
});

module.exports = router;
module.exports.SHELF_LIFE_DB = SHELF_LIFE_DB; // export untuk dipakai di route lain
