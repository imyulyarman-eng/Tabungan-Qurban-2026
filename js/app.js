class App {
  static async load(){
    this.renderKelasFilter();
    await Promise.all([
      this.loadStats(),
      this.loadSiswa()
    ]);
    this.attachListeners();
  }

  static renderKelasFilter(){
    const select = document.getElementById("kelasFilter");
    select.innerHTML = `<option value="">Semua Kelas</option>`+
      CONFIG.KELAS_LIST.map(k=>`<option value="${k}">${k}</option>`).join("");
  }

  static attachListeners(){
    document.getElementById("kelasFilter").addEventListener("change", e=>{
      this.loadSiswa(e.target.value);
    });

    document.getElementById("btnCancel").addEventListener("click", ()=>this.hideModal());
    document.getElementById("formTambahTabungan").addEventListener("submit", e=>{
      e.preventDefault();
      this.submitTabungan();
    });
  }

  static formatRupiah(num){
    return num.toLocaleString("id-ID",{style:"currency",currency:"IDR"});
  }

  static async loadStats(){
    try{
      const res = await fetch(`${CONFIG.GAS_URL}?action=getRekapTotal`);
      const data = await res.json();
      if(!data.success) return;
      const stats = data.data;
      const container = document.getElementById("stats");
      container.innerHTML = `
        <div><h3>Total Tabungan Hari Ini</h3><p>${this.formatRupiah(stats.totalHari)}</p></div>
        <div><h3>Jumlah Transaksi Hari Ini</h3><p>${stats.jumlahTransaksiHari}</p></div>
        <div><h3>Total Keseluruhan Tabungan</h3><p>${this.formatRupiah(stats.totalKeseluruhan)}</p></div>
        <div><h3>Total Siswa</h3><p>${stats.totalSiswa}</p></div>
        <div><h3>Siswa Lunas Kambing</h3><p>${stats.lunasKambing}</p></div>
        <div><h3>Siswa Lunas Sapi</h3><p>${stats.lunasSapi}</p></div>
      `;
    }catch(error){
      console.error("Error loadStats:",error);
    }
  }

  static async loadSiswa(kelas=""){
    try{
      const url = kelas ? `${CONFIG.GAS_URL}?action=getSiswa&kelas=${kelas}` : `${CONFIG.GAS_URL}?action=getAllSiswa`;
      const res = await fetch(url);
      const data = await res.json();
      if(!data.success) return;
      const tbody = document.querySelector("#siswaTable tbody");
      if(data.data.length === 0){
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
            <span class="${s.Lunas ? "status-lunas" : "status-belum"}">${s.Lunas ? "LUNAS" : "BELUM LUNAS"}</span>
          </td>
          <td style="text-align:center;">
            <button class="btn-tambah-tabungan" data-id="${s.ID}" data-nama="${s.Nama}">Tambah Tabungan</button>
          </td>
        </tr>
      `).join("");
      // Attach listener tombol tambah tabungan
      document.querySelectorAll(".btn-tambah-tabungan").forEach(btn=>{
        btn.onclick = e=>{
          const id = e.currentTarget.dataset.id;
          const nama = e.currentTarget.dataset.nama;
          this.showModal(id, nama);
        };
      });
    }catch(error){
      console.error("Error loadSiswa:",error);
    }
  }

  static showModal(idSiswa, namaSiswa){
    const modal = document.getElementById("modalTambahTabungan");
    modal.setAttribute("aria-hidden","false");
    modal.classList.add("show");
    document.body.style.overflow = "hidden";

    document.getElementById("idSiswaTabungan").value = idSiswa;
    document.getElementById("jumlahSetoran").value = "";
    document.getElementById("keteranganSetoran").value = "";
    document.getElementById("metodePembayaran").value = "Tunai";

    modal.querySelector("h3").textContent = `Tambah Tabungan untuk ${namaSiswa}`;
    document.getElementById("jumlahSetoran").focus();
  }

  static hideModal(){
    const modal = document.getElementById("modalTambahTabungan");
    modal.setAttribute("aria-hidden","true");
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }

  static async submitTabungan(){
    const idSiswa = document.getElementById("idSiswaTabungan").value;
    const jumlah = Number(document.getElementById("jumlahSetoran").value);
    const metode = document.getElementById("metodePembayaran").value;
    const keterangan = document.getElementById("keteranganSetoran").value.trim();

    if(!idSiswa || !jumlah || jumlah <= 0 || !metode) {
      alert("Mohon lengkapi data dengan benar!");
      return;
    }

    try {
      const res = await fetch(CONFIG.GAS_URL, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          action:"addTabungan",
          idSiswa: idSiswa,
          jumlah: jumlah,
          metode: metode,
          keterangan: keterangan,
          adminUser: localStorage.getItem("qurban_user") || "Admin"
        })
      });
      const data = await res.json();
      if(data.success){
        alert("Setoran berhasil disimpan!");
        this.hideModal();
        this.loadStats();
        this.loadSiswa(document.getElementById("kelasFilter").value);
      } else {
        alert("Gagal simpan setoran: " + data.message);
      }
    } catch(err) {
      alert("Terjadi kesalahan: " + err.message);
    }
  }
}

window.App = App;
window.addEventListener("DOMContentLoaded", () => {
  // Load dashboard otomatis kalau mainApp muncul (di-show oleh auth)
  const mainApp = document.getElementById("mainApp");
  const observer = new MutationObserver(() => {
    if (mainApp.style.display !== "none") {
      App.load();
    }
  });
  observer.observe(mainApp, { attributes: true, attributeFilter: ["style"] });
});