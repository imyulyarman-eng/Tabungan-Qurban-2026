class App {
  static async load() {
    this.renderKelasFilter();
    await Promise.all([
      this.loadStats(),
      this.loadSiswa()
    ]);
    this.attachFilterListener();
    this.attachModalListeners();
  }

  static renderKelasFilter() {
    const select = document.getElementById("kelasFilter");
    select.innerHTML = `<option value="">Semua Kelas</option>` +
      CONFIG.KELAS_LIST.map(k => `<option value="${k}">${k}</option>`).join('');
  }

  static attachFilterListener() {
    document.getElementById("kelasFilter").addEventListener("change", e => {
      this.loadSiswa(e.target.value);
    });
  }

  static attachModalListeners() {
    const modal = document.getElementById("modalTambahTabungan");
    const btnCancel = document.getElementById("btnCancel");
    const form = document.getElementById("formTambahTabungan");

    btnCancel.addEventListener("click", () => this.hideModal());
    form.addEventListener("submit", e => {
      e.preventDefault();
      this.submitTabungan();
    });
  }

  static formatRupiah(num) {
    return num.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
  }

  static async loadStats() {
    try {
      const res = await fetch(`${CONFIG.GAS_URL}?action=getRekapTotal`);
      const data = await res.json();
      if (!data.success) {
        console.error("Gagal load stats:", data.message);
        return;
      }
      const stat = data.data;
      const statsEl = document.getElementById("stats");
      statsEl.innerHTML = `
        <div><h3>Total Tabungan Hari Ini</h3><p>${this.formatRupiah(stat.totalHari)}</p></div>
        <div><h3>Jumlah Transaksi Hari Ini</h3><p>${stat.jumlahTransaksiHari}</p></div>
        <div><h3>Total Keseluruhan Tabungan</h3><p>${this.formatRupiah(stat.totalKeseluruhan)}</p></div>
        <div><h3>Total Siswa</h3><p>${stat.totalSiswa}</p></div>
        <div><h3>Siswa Lunas Kambing</h3><p>${stat.lunasKambing}</p></div>
        <div><h3>Siswa Lunas Sapi</h3><p>${stat.lunasSapi}</p></div>
      `;
    } catch (error) {
      console.error("Error loadStats:", error);
    }
  }

  static async loadSiswa(kelasFilter = "") {
    try {
      const url = kelasFilter ? 
        `${CONFIG.GAS_URL}?action=getSiswa&kelas=${kelasFilter}` : 
        `${CONFIG.GAS_URL}?action=getAllSiswa`;

      const res = await fetch(url);
      const data = await res.json();
      if (!data.success) {
        console.error("Gagal load siswa:", data.message);
        return;
      }
      
      const tbody = document.querySelector("#siswaTable tbody");
      if (!data.data.length) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Tidak ada data siswa.</td></tr>';
        return;
      }
      
      tbody.innerHTML = data.data.map(s => `
        <tr>
          <td>${s.ID}</td>
          <td>${s.Nama}</td>
          <td>${s.Kelas}</td>
          <td>${s["Jenis Hewan"]}</td>
          <td style="text-align:right;">${this.formatRupiah(s.Target)}</td>
          <td style="text-align:right;">${this.formatRupiah(s.TotalTabungan)}</td>
          <td style="text-align:right;">${this.formatRupiah(s.Sisa)}</td>
          <td style="text-align:center;">
            <span class="${s.Lunas ? "status-lunas" : "status-belum"}">
              ${s.Lunas ? "LUNAS" : "BELUM LUNAS"}
            </span>
          </td>
          <td style="text-align:center;">
            <button class="btn-tambah-tabungan" data-id="${s.ID}" data-nama="${s.Nama}" aria-label="Tambah tabungan untuk ${s.Nama}">
              Tambah Tabungan
            </button>
          </td>
        </tr>
      `).join("");

      // Attach click listener pada tombol tambah tabungan
      document.querySelectorAll(".btn-tambah-tabungan").forEach(btn => {
        btn.addEventListener("click", e => {
          const id = e.currentTarget.getAttribute("data-id");
          const nama = e.currentTarget.getAttribute("data-nama");
          this.showModal(id, nama);
        });
      });
    } catch (error) {
      console.error("Error loadSiswa:", error);
    }
  }

  static showModal(idSiswa, nama) {
    const modal = document.getElementById("modalTambahTabungan");
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("show");
    document.body.style.overflow = "hidden";

    document.getElementById("idSiswaTabungan").value = idSiswa;
    document.getElementById("jumlahSetoran").value = "";
    document.getElementById("keteranganSetoran").value = "";
    document.getElementById("metodePembayaran").value = "Tunai";

    modal.querySelector("h3").textContent = `Tambah Tabungan untuk ${nama}`;
    document.getElementById("jumlahSetoran").focus();
  }

  static hideModal() {
    const modal = document.getElementById("modalTambahTabungan");
    modal.setAttribute("aria-hidden", "true");
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }

  static async submitTabungan() {
    const idSiswa = document.getElementById("idSiswaTabungan").value;
    const jumlah = Number(document.getElementById("jumlahSetoran").value);
    const metode = document.getElementById("metodePembayaran").value;
    const keterangan = document.getElementById("keteranganSetoran").value.trim();

    if (!idSiswa || !jumlah || jumlah <= 0 || !metode) {
      alert("Mohon lengkapi data dengan benar!");
      return;
    }

    try {
      const res = await fetch(CONFIG.GAS_URL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          action: "addTabungan",
          idSiswa: idSiswa,
          jumlah: jumlah,
          metode: metode,
          keterangan: keterangan,
          adminUser: localStorage.getItem("qurban_user") || "Admin"
        })
      });
      const data = await res.json();

      if (data.success) {
        alert("Setoran berhasil disimpan!");
        this.hideModal();
        this.loadStats();
        this.loadSiswa(document.getElementById("kelasFilter").value);
      } else {
        alert("Gagal menyimpan setoran: " + data.message);
      }
    } catch (error) {
      alert("Terjadi kesalahan: " + error.message);
    }
  }
}

// Set global var supaya bisa akses dari auth.js
window.App = App;

// Mulai load data saat dashboard siap
window.addEventListener("DOMContentLoaded", () => {
  const mainApp = document.getElementById("mainApp");
  if (mainApp.style.display !== "none") {
    App.load();
  }
});