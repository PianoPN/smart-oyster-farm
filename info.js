// ==========================================
// 🔥 Firebase (ฐานข้อมูลเดียวกับ dashboard.html)
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAlTdug7W4lsdzmSKg3VxrhZwCcikrXV-8",
    databaseURL: "https://smart-oyster-farm-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "smart-oyster-farm",
};
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();
 
let farmChart = null;
let currentType = null;
 
const RECORD_INTERVAL_MS = 5 * 60 * 1000;   // บันทึกค่าลงประวัติทุก 5 นาที (กันสแปมเขียนถี่เกินไป)
const HISTORY_WINDOW_MS  = 24 * 60 * 60 * 1000; // แสดงย้อนหลัง 24 ชั่วโมงล่าสุด
const lastRecordTime = { temp: 0, salt: 0, ph: 0 };
 
// 📊 โครงสร้างเซนเซอร์หลัก 3 ค่า อ้างอิง path จริงจาก /sensor/... (ตรงกับ script.js ของ dashboard)
const sensorSettings = {
    temp: { path: 'temperature', label: '🌡️ อุณหภูมิน้ำทะเลย้อนหลัง (°C)', color: '#ef4444', min: 20, max: 36 },
    salt: { path: 'salinity',    label: '🌊 ความเค็มน้ำทะเลย้อนหลัง (ppt)', color: '#0284c7', min: 0,  max: 40 },
    ph:   { path: 'ph',          label: '🧪 ค่า pH น้ำทะเลย้อนหลัง',        color: '#10b981', min: 5,  max: 10 }
};
 
document.addEventListener("DOMContentLoaded", () => {
    // 🫧 รันระบบเอฟเฟกต์บรรยากาศตู้น้ำอัจฉริยะอัตโนมัติ
    spawnOceanBubbles(55);
    spawnOceanFish(6);
 
    // เริ่มฟังค่าจริงจากบอร์ดผ่าน Firebase + บันทึกลงประวัติ
    startHistoryRecorders();
 
    // เปิดใช้งานกราฟเซนเซอร์อุณหภูมิตั้งต้นทันที
    setType('temp');
});
 
function setType(type) {
    currentType = type;
 
    // 1. สลับไฮไลท์สีปุ่มกด
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-${type}`);
    if (activeBtn) activeBtn.classList.add('active');
 
    // 2. โหลดข้อมูลย้อนหลัง 24 ชม.จริงจาก Firebase มาวาดกราฟ
    loadAndRenderHistory(type);
}
 
// ==========================================
// 🔴 ฟังค่าปัจจุบันจาก /sensor/... แบบ real-time
//    แล้วบันทึกสะสมลง /history/{type} เพื่อสร้างข้อมูลย้อนหลังของจริง
// ==========================================
function startHistoryRecorders() {
    Object.keys(sensorSettings).forEach(type => {
        const path = sensorSettings[type].path;
 
        database.ref(`/sensor/${path}`).on('value', (snapshot) => {
            const val = snapshot.val();
            if (val === null || val === undefined) {
                // ไม่มีข้อมูลจากบอร์ดเลย
                if (currentType === type) loadAndRenderHistory(type);
                return;
            }
 
            const now = Date.now();
            if (now - lastRecordTime[type] >= RECORD_INTERVAL_MS) {
                lastRecordTime[type] = now;
                database.ref(`/history/${type}`).push({
                    value: val,
                    time: now
                });
            }
 
            // ถ้ากำลังเปิดดูกราฟประเภทนี้อยู่ ให้รีเฟรชให้ตรงกับค่าล่าสุด
            if (currentType === type) {
                loadAndRenderHistory(type);
            }
        }, (error) => {
            console.error("Firebase connection error:", error);
            if (currentType === type) showNoDataMessage();
        });
    });
}
 
// ==========================================
// 📥 ดึงข้อมูลย้อนหลัง 24 ชม.จริงจาก /history/{type} มาวาดกราฟ
// ==========================================
function loadAndRenderHistory(type) {
    const cutoff = Date.now() - HISTORY_WINDOW_MS;
 
    database.ref(`/history/${type}`)
        .orderByChild('time')
        .startAt(cutoff)
        .once('value')
        .then((snapshot) => {
            const records = [];
            snapshot.forEach((child) => {
                records.push(child.val());
            });
 
            if (records.length === 0) {
                showNoDataMessage();
            } else {
                renderChart(type, records);
            }
        })
        .catch((err) => {
            console.error("โหลดข้อมูลย้อนหลังไม่สำเร็จ:", err);
            showNoDataMessage();
        });
}
 
// ⬜ แสดงกรอบสีเทา "ไม่พบข้อมูล" ทับพื้นที่กราฟ เมื่อไม่มีข้อมูลจริง
function showNoDataMessage() {
    if (farmChart) {
        farmChart.destroy();
        farmChart = null;
    }
    const canvas = document.getElementById('farmChart');
    if (canvas) canvas.style.display = 'none';
 
    const overlay = document.getElementById('no-data-overlay');
    if (overlay) overlay.style.display = 'flex';
}
 
// 🛠️ ประกอบโครงสร้างกราฟเส้นจากข้อมูลจริงที่ดึงมาจาก Firebase
function renderChart(type, records) {
    const overlay = document.getElementById('no-data-overlay');
    if (overlay) overlay.style.display = 'none';
 
    const canvas = document.getElementById('farmChart');
    if (!canvas) return;
    canvas.style.display = 'block';
 
    const ctx = canvas.getContext('2d');
    const settings = sensorSettings[type];
 
    // เรียงตามเวลาก่อน-หลัง แล้วแปลงเป็น label เวลา + ค่า
    records.sort((a, b) => a.time - b.time);
    const labels = records.map((r) => {
        const d = new Date(r.time);
        return d.getHours().toString().padStart(2, '0') + ":" + d.getMinutes().toString().padStart(2, '0');
    });
    const dataValues = records.map((r) => r.value);
 
    if (farmChart) {
        farmChart.destroy();
    }
 
    farmChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: settings.label,
                data: dataValues,
                borderColor: settings.color,
                backgroundColor: `${settings.color}12`,
                borderWidth: 4,
                pointBackgroundColor: settings.color,
                pointRadius: 5,
                pointHoverRadius: 8,
                tension: 0.35,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        font: { family: 'Segoe UI', size: 18, weight: '700' },
                        color: '#1e293b'
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(0, 0, 0, 0.03)' },
                    ticks: {
                        color: '#334155',
                        font: { size: 16, weight: '600' }
                    }
                },
                y: {
                    min: settings.min,
                    max: settings.max,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: {
                        color: '#334155',
                        font: { size: 16, weight: '600' }
                    }
                }
            }
        }
    });
}
 
// 🫧 Engine ฟองอากาศเคลื่อนไหว
function spawnOceanBubbles(count) {
    const container = document.getElementById("bubble-container");
    if (!container) return;
    container.innerHTML = "";
    for (let i = 0; i < count; i++) {
        const bubble = document.createElement("div");
        bubble.className = "bubble-node";
        const size = Math.random() * 18 + 6;
        const leftPos = Math.random() * 100;
        const duration = Math.random() * 7 + 6;
        const delay = Math.random() * 6;
        const drift = Math.random() * 60 - 30;
 
        bubble.style.width = `${size}px`; bubble.style.height = `${size}px`;
        bubble.style.left = `${leftPos}%`; bubble.style.animationDuration = `${duration}s`;
        bubble.style.animationDelay = `${delay}s`;
        bubble.style.setProperty("--drift", `${drift}px`);
        container.appendChild(bubble);
    }
}
 
// 🐟 Engine ปล่อยตัวปลา
function spawnOceanFish(count) {
    const tank = document.getElementById("aquarium-fish-tank");
    if (!tank) return;
    tank.innerHTML = "";
    for (let i = 0; i < count; i++) {
        const fish = document.createElement("div");
        fish.className = "fish-node";
        const topPos = Math.random() * 70 + 15;
        const duration = Math.random() * 10 + 15;
        const delay = Math.random() * 12;
        const scale = Math.random() * 0.4 + 0.8;
 
        fish.style.top = `${topPos}%`; fish.style.animationDuration = `${duration}s`;
        fish.style.animationDelay = `-${delay}s`; fish.style.transform = `scale(${scale})`;
        tank.appendChild(fish);
    }
}