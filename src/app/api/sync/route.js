export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Panduan Sync Google Sheets</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0a0a0f; color: #e4e4e7; line-height: 1.7; padding: 2rem 1rem;
    }
    .container { max-width: 720px; margin: 0 auto; }
    h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; color: #f4f4f5; }
    h2 { font-size: 1.2rem; font-weight: 600; margin: 1.5rem 0 0.75rem; color: #a1a1aa; }
    p, li { color: #a1a1aa; margin-bottom: 0.5rem; }
    ol, ul { padding-left: 1.25rem; }
    li { margin-bottom: 0.4rem; }
    code {
      background: #18181b; color: #e4e4e7; padding: 0.15rem 0.4rem;
      border-radius: 4px; font-size: 0.875rem;
    }
    pre {
      background: #18181b; border: 1px solid #27272a; border-radius: 8px;
      padding: 1rem; overflow-x: auto; font-size: 0.8rem; line-height: 1.5; margin: 1rem 0;
    }
    .step { margin-bottom: 1rem; }
    .copy-btn {
      background: #27272a; border: 1px solid #3f3f46; color: #e4e4e7;
      padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer;
      font-size: 0.75rem; float: right; margin-top: -2.5rem;
    }
    .copy-btn:hover { background: #3f3f46; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Cara Menghubungkan Google Sheets</h1>
    <p>Ikuti langkah-langkah di bawah untuk menyinkronkan transaksi ke Google Spreadsheet.</p>

    <h2>Langkah 1: Buat Google Apps Script</h2>
    <ol>
      <li>Buka spreadsheet Anda di <a href="https://sheets.google.com" style="color:#60a5fa">sheets.google.com</a></li>
      <li>Klik menu <strong>Extensions → Apps Script</strong></li>
      <li>Hapus semua kode yang ada, lalu paste kode di bawah:</li>
    </ol>
    <pre id="script">
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    const tx = data.data;

    sheet.appendRow([
      new Date().toISOString(),
      tx.name || "",
      tx.type || "",
      tx.amount || 0,
      tx.category || "",
      tx.source || "",
      tx.note || "",
    ]);
  } catch (err) {
    console.error(err);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ status: "ok" })
  ).setMimeType(ContentService.MimeType.JSON);
}
    </pre>
    <button class="copy-btn" onclick="copyScript()">Salin</button>

    <h2>Langkah 2: Deploy Script</h2>
    <ol>
      <li>Klik <strong>Deploy → New deployment</strong></li>
      <li>Pilih <strong>Web app</strong> sebagai jenis deployment</li>
      <li>Execute as: <strong>Me</strong></li>
      <li>Who has access: <strong>Anyone</strong></li>
      <li>Klik <strong>Deploy</strong></li>
      <li>Klik <strong>Review permissions → lanjutkan</strong> (pilih akun Google Anda)</li>
      <li>Klik <strong>Allow</strong></li>
      <li><strong>Salin URL Web App-nya</strong> (https://script.google.com/macros/s/.../exec)</li>
    </ol>

    <h2>Langkah 3: Hubungkan di Aplikasi</h2>
    <ol>
      <li>Buka menu <strong>Settings</strong> di aplikasi Finance Tracker</li>
      <li>Klik <strong>Hubungkan</strong> di bagian Google Sheets</li>
      <li>Paste URL dari Langkah 2</li>
      <li>Klik <strong>Hubungkan</strong></li>
    </ol>

    <p style="margin-top:2rem;color:#71717a;font-size:0.875rem">
      Setiap kali Anda menambahkan transaksi, data akan otomatis tersinkron ke spreadsheet.
    </p>
  </div>

  <script>
    function copyScript() {
      const el = document.getElementById('script');
      navigator.clipboard.writeText(el.textContent.trim());
      const btn = document.querySelector('.copy-btn');
      btn.textContent = 'Tersalin!';
      setTimeout(() => btn.textContent = 'Salin', 2000);
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
