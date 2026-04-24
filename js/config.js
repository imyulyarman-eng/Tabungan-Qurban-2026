const CONFIG = {
  GAS_URL: "https://script.google.com/macros/s/AKfycbwlvZJAnrLlmzvKN9ArL1C3WOSGXXl6cjRIf7et_iQGpXVjeexnIpeV_zSUZItjtvlZKw/exec",
  LOGIN_PIN: "2512", // PIN 4 digit default
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 menit
  HARGA: {
    kambing: 4500000,
    sapi: 30000000,
  },
  KELAS_LIST: [
    "1A","1B","1C","2A","2B","2C","3A","3B","3C",
    "4A","4B","4C","5A","5B","5C","6A","6B","6C",
  ],
  METODE_PEMBAYARAN: ["Tunai", "Transfer", "QRIS"],
};