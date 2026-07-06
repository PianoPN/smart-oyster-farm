// ==========================================
// 1. ส่วนควบคุมการเปลี่ยนหน้า (Navigation)
// ==========================================
function toggleNotify() { window.location.href = "notify.html"; }
function toggleProfile() { window.location.href = "window.html"; }
function toggleInfo() { window.location.href = "info.html"; }

// ==========================================
// 2. ส่วนของ AI Predictor & Global Variables
// ==========================================
let tempHistory = []; 
const HISTORY_LIMIT = 5; 
let lastPredictAlertTime = 0; 
let lastAlertTag = ""; 

// ตัวแปรเก็บบันทึกค่าล่าสุด
let liveTemp = 25.0; 
let livePh = 7.5;
let liveSalinity = 25.0; 
let liveTurbidity = 0.0; // เพิ่มตัวแปรเก็บค่าความขุ่นล่าสุด

function predictTrend(currentValue, type) {
    tempHistory.push(parseFloat(currentValue));
    if (tempHistory.length > HISTORY_LIMIT) tempHistory.shift();

    if (tempHistory.length >= 3) {
        const last = tempHistory[tempHistory.length - 1];
        const prev = tempHistory[tempHistory.length - 2];
        const oldest = tempHistory[tempHistory.length - 3];

        if (last > prev && prev > oldest) {
            const diff = (last - oldest).toFixed(2);
            const now = Date.now();
            
            if (diff > 0.3 && (now - lastPredictAlertTime > 60000)) {
                lastPredictAlertTime = now;
                return {
                    isDanger: true,
                    msg: `⚠️ AI คาดการณ์: ${type} กำลังสูงขึ้นต่อเนื่อง (+${diff}) อาจเกินเกณฑ์ใน 30 นาที!`
                };
            }
        }
    }
    return null;
}

function getThaiDateTime() {
    return new Date().toLocaleString('th-TH', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });
}

// แก้ไขฟังก์ชันอัปเดตคลาสสถานะให้ตรงกับ CSS (ใช้ sensor-status เป็นหลัก)
function updateStatusUI(elementId, statusText, statusClass) {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerText = statusText;
        el.className = `sensor-status ${statusClass}`;
    }
}

// ==========================================
// ==========================================
// 4. ระบบแจ้งเตือน (Notifications)
// ==========================================

// เก็บ "สถานะล่าสุด" ของแต่ละค่า ไว้เทียบว่าเปลี่ยนจากปกติ -> ผิดปกติ หรือกลับมาปกติหรือไม่
let alertState = {
    temp: 'normal',
    ph: 'normal',
    salinity: 'normal',
    turbidity: 'normal'
};

// เคลียร์ข้อความ "กำลังตรวจสอบ..." ตอนเริ่มต้น เมื่อมีข้อมูลจริงจาก Firebase เข้ามาแล้ว
function clearNotifyLoadingPlaceholder() {
    const fullList = document.getElementById('notification-list');
    if (!fullList) return;
    const loadingEl = fullList.querySelector('.loading-notify');
    if (loadingEl) {
        loadingEl.remove();
        // ถ้าเชื่อมต่อสำเร็จแต่ยังไม่มีการแจ้งเตือนใดๆ เกิดขึ้นเลย ให้ขึ้นข้อความว่าระบบพร้อมทำงานแล้ว
        if (fullList.children.length === 0) {
            const timeString = getThaiDateTime();
            const readyItem = document.createElement('div');
            readyItem.className = 'notify-item success';
            readyItem.innerHTML = `
                <span class="notify-time">[${timeString}]</span>
                <span class="notify-msg">✅ เชื่อมต่อเซนเซอร์สำเร็จ กำลังเฝ้าระวังค่าน้ำแบบเรียลไทม์</span>
            `;
            fullList.appendChild(readyItem);
        }
    }
}

function createNotifyItem(type, msg) {
    const timeString = getThaiDateTime();

    // 1) ส่งเข้าหน้า notify.html แบบเต็ม (ถ้าเปิดหน้านี้อยู่)
    const fullList = document.getElementById('notification-list');
    if (fullList) {
        const emptyMsg = fullList.querySelector('.empty-msg')
            || fullList.querySelector('.loading-notify')
            || fullList.querySelector('.notify-item[style*="border-color:#ccc"]');
        if (emptyMsg) emptyMsg.remove();

        const item = document.createElement('div');
        item.className = `notify-item ${type}`;
        item.innerHTML = `
            <span class="notify-time">[${timeString}]</span>
            <span class="notify-msg">${msg}</span>
        `;
        fullList.prepend(item);
    }

    // 2) ส่งเข้ากล่องแจ้งเตือนย่อบนหน้า dashboard.html (ถ้าเปิดหน้านี้อยู่)
    const miniList = document.getElementById('dashboard-alert-list');
    if (miniList) {
        const emptyEl = document.getElementById('dashboard-alert-empty');
        if (emptyEl) emptyEl.remove();

        const miniItem = document.createElement('div');
        miniItem.className = `mini-notify-item ${type}`;
        miniItem.innerHTML = `
            <span class="mini-notify-time">[${timeString}]</span>
            <span class="mini-notify-msg">${msg}</span>
        `;
        miniList.prepend(miniItem);

        // จำกัดไว้แค่ 5 รายการล่าสุด ไม่ให้กล่องยาวเกินไป
        const items = miniList.querySelectorAll('.mini-notify-item');
        if (items.length > 5) {
            items[items.length - 1].remove();
        }
    }
}

// ฟังก์ชันกลาง: เทียบสถานะใหม่กับสถานะเดิมของค่านั้นๆ
// ถ้าเปลี่ยนจากปกติ -> ผิดปกติ จะแจ้งเตือน (danger/warning)
// ถ้าเปลี่ยนจากผิดปกติ -> ปกติ จะแจ้งว่ากลับมาปกติแล้ว (success)
function notifyStatusChange(key, newStatus, alertType, alertMsg, recoveryMsg) {
    if (alertState[key] === newStatus) return; // สถานะเหมือนเดิม ไม่ต้องแจ้งซ้ำ

    if (newStatus !== 'normal') {
        createNotifyItem(alertType, alertMsg);
    } else if (alertState[key] !== 'normal') {
        createNotifyItem('success', recoveryMsg);
    }
    alertState[key] = newStatus;
}

function clearAllNotifications() {
    const list = document.getElementById('notification-list');
    if (list && confirm("ยืนยันว่าอ่านข้อความทั้งหมดแล้วใช่หรือไม่?")) {
        list.innerHTML = '<div class="notify-item" style="border-color:#ccc; color:#999; text-align:center; justify-content:center;">ไม่มีการแจ้งเตือนค้างอยู่</div>';
    }
}
// ==========================================
// 5. โครงสร้างเชื่อมต่อ Firebase & API สภาพอากาศ
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAlTdug7W4lsdzmSKg3VxrhZwCcikrXV-8",
    databaseURL: "https://smart-oyster-farm-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "smart-oyster-farm",
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 🌡️ อุณหภูมิ
// ⚠️ แก้ไข path ให้ตรงกับที่ Arduino ยิงขึ้นมา (Arduino ใช้ sendToFirebase("/current/temperature", ...))
database.ref('/current/temperature').on('value', (snapshot) => {
    const temp = snapshot.val();
    const tempValueElement = document.getElementById('card-temp-value');

    if (temp !== null && temp !== undefined) {
        liveTemp = temp;
        if (tempValueElement) tempValueElement.innerText = temp.toFixed(1) + " °C";
        clearNotifyLoadingPlaceholder();

        let status = 'normal';
        if (temp > 30) {
            status = 'high';
            updateStatusUI('card-temp-status', 'สูงเกินไป', 'status-high');
        } else if (temp < 24) {
            status = 'low';
            updateStatusUI('card-temp-status', 'ต่ำเกินไป', 'status-low');
        } else {
            updateStatusUI('card-temp-status', 'ปกติ', 'status-normal');
        }

        notifyStatusChange('temp', status,
            status === 'high' ? 'danger' : 'warning',
            status === 'high'
                ? `🔴 อันตราย: อุณหภูมิน้ำ (${temp.toFixed(1)}°C) สูงเกินไป อาจกระทบหอยนางรม!`
                : `🔸 แจ้งเตือน: อุณหภูมิน้ำ (${temp.toFixed(1)}°C) เริ่มเย็นเกินไป`,
            `✅ กลับมาปกติแล้ว: อุณหภูมิน้ำอยู่ที่ ${temp.toFixed(1)}°C`
        );

        const predictResult = predictTrend(temp, "อุณหภูมิ");
        if (predictResult && predictResult.isDanger) {
            createNotifyItem('warning', predictResult.msg);
        }

        calculateOverallWaterQuality(); // อัปเดตกล่องสรุปคุณภาพน้ำทันทีที่มีค่าใหม่เข้ามา
    } else {
        if (tempValueElement) tempValueElement.innerText = "--";
        updateStatusUI('card-temp-status', 'ไม่มีข้อมูล', '');
    }
});

// 🧪 ความขุ่น
// ⚠️ หมายเหตุ: ตอนนี้โค้ด Arduino ยังไม่มีเซ็นเซอร์วัดความขุ่น (turbidity) จึงยังไม่มีข้อมูลจริงส่งมาที่ path นี้
// การ์ดนี้จะขึ้น "ไม่มีข้อมูล" ไปก่อน จนกว่าจะเพิ่มเซ็นเซอร์และเพิ่มโค้ดส่งค่าใน .ino
database.ref('/sensor/turbidity').on('value', (snapshot) => {
    const turbidity = snapshot.val();
    const turbidityValueElement = document.getElementById('turbidity-value');

    if (turbidity !== null && turbidity !== undefined) {
        liveTurbidity = turbidity;
        if (turbidityValueElement) turbidityValueElement.innerText = turbidity.toFixed(1) + " NTU";
        clearNotifyLoadingPlaceholder();

        let status = 'normal';
        if (turbidity > 50) {
            status = 'high';
            updateStatusUI('status-turbidity', 'ขุ่นเกินไป', 'status-high');
        } else {
            updateStatusUI('status-turbidity', 'ปกติ', 'status-normal');
        }

        notifyStatusChange('turbidity', status, 'danger',
            `🔴 อันตราย: น้ำขุ่นเกินไป (${turbidity.toFixed(1)} NTU) อาจกระทบการกรองอาหารของหอย`,
            `✅ กลับมาปกติแล้ว: ความขุ่นของน้ำอยู่ที่ ${turbidity.toFixed(1)} NTU`
        );
    } else {
        if (turbidityValueElement) turbidityValueElement.innerText = "--";
        updateStatusUI('status-turbidity', 'ไม่มีข้อมูล', '');
    }
});

// 🧪 pH
// ⚠️ แก้ไข path ให้ตรงกับที่ Arduino ยิงขึ้นมา (Arduino ใช้ sendToFirebase("/current/ph", ...))
database.ref('/current/ph').on('value', (snapshot) => {
    const ph = snapshot.val();
    const phValueElement = document.getElementById('card-ph-value');

    if (ph !== null && ph !== undefined) {
        livePh = ph;
        if (phValueElement) phValueElement.innerText = ph.toFixed(2);
        clearNotifyLoadingPlaceholder();

        let status = 'normal';
        if (ph > 8.0) {
            status = 'high';
            updateStatusUI('card-ph-status', 'สูงเกินไป', 'status-high');
        } else if (ph < 6.5) {
            status = 'low';
            updateStatusUI('card-ph-status', 'ต่ำเกินไป', 'status-low');
        } else {
            updateStatusUI('card-ph-status', 'ปกติ', 'status-normal');
        }

        notifyStatusChange('ph', status, 'danger',
            status === 'high'
                ? `🔴 อันตราย: ค่า pH (${ph.toFixed(2)}) สูงเกินไป`
                : `🔴 อันตราย: ค่า pH ต่ำเกินไป (${ph.toFixed(2)}) อาจส่งผลต่อการสร้างเปลือกหอย!`,
            `✅ กลับมาปกติแล้ว: ค่า pH อยู่ที่ ${ph.toFixed(2)}`
        );

        calculateOverallWaterQuality();
    } else {
        if (phValueElement) phValueElement.innerText = "--";
        updateStatusUI('card-ph-status', 'ไม่มีข้อมูล', '');
    }
});

// 🌊 ความเค็ม
// ⚠️ แก้ไข path ให้ตรงกับที่ Arduino ยิงขึ้นมา (Arduino ใช้ sendToFirebase("/current/salinity", ...))
database.ref('/current/salinity').on('value', (snapshot) => {
    const salinity = snapshot.val();
    const salinityValueElement = document.getElementById('salinity-title');

    if (salinity !== null && salinity !== undefined) {
        liveSalinity = salinity;
        if (salinityValueElement) salinityValueElement.innerText = salinity.toFixed(1) + " ppt";
        clearNotifyLoadingPlaceholder();

        let status = 'normal';
        if (salinity < 10.0) {
            status = 'low';
            updateStatusUI('status-soil', 'จืดเกินไป', 'status-low');
        } else if (salinity > 35.0) {
            status = 'high';
            updateStatusUI('status-soil', 'เค็มเกินไป', 'status-high');
        } else {
            updateStatusUI('status-soil', 'ปกติ', 'status-normal');
        }

        notifyStatusChange('salinity', status, 'warning',
            status === 'low'
                ? `🔸 แจ้งเตือน: ค่าความเค็มน้ำ (${salinity.toFixed(1)} ppt) ต่ำเกินเกณฑ์สำหรับหอยนางรม`
                : `🔸 แจ้งเตือน: ค่าความเค็มน้ำ (${salinity.toFixed(1)} ppt) สูงเกินเกณฑ์`,
            `✅ กลับมาปกติแล้ว: ค่าความเค็มอยู่ที่ ${salinity.toFixed(1)} ppt`
        );

        calculateOverallWaterQuality();
    } else {
        if (salinityValueElement) salinityValueElement.innerText = "--";
        updateStatusUI('status-soil', 'ไม่มีข้อมูล', '');
    }
});

/* ส่วนพยากรณ์อากาศจาก OpenWeather API */
const API_KEY = "f0404e9cd40f393c38ea9842d0d799f2"; 

// 📍 ฟิกพิกัดไว้ที่ อ.เมือง จ.สงขลา (ไม่ใช้ตำแหน่งจริงของผู้ใช้แล้ว)
const FIXED_LOCATION = {
    name: "อ.เมือง จ.สงขลา",
    lat: 7.1756,
    lon: 100.6142
};

function getWeatherData() {
    const lat = FIXED_LOCATION.lat;
    const lon = FIXED_LOCATION.lon;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=th&appid=${API_KEY}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            updateWeatherUI(data);
        })
        .catch(err => {
            console.error("Error fetching weather:", err);
            const cityEl = document.getElementById('weather-city');
            if (cityEl) cityEl.innerText = "ไม่สามารถดึงข้อมูลอากาศได้";
        });
}

function updateWeatherUI(data) {
    if (!data || !data.main || !data.weather) {
        console.error("ไม่มีข้อมูลสภาพอากาศส่งมา!");
        return;
    }

    const cityElement = document.getElementById('weather-city');
    if (cityElement) { cityElement.innerHTML = `📍 ${FIXED_LOCATION.name}`; }
    
    const tempElement = document.getElementById('weather-temp');
    if (tempElement) { tempElement.innerText = `${Math.round(data.main.temp)}°C`; }
    
    const descElement = document.getElementById('weather-desc');
    if (descElement) { descElement.innerText = data.weather[0].description; }
    
    const iconImg = document.getElementById('weather-icon');
    if (iconImg && data.weather[0].icon) {
        const iconCode = data.weather[0].icon;
        iconImg.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        iconImg.style.display = 'inline-block';
    }
    
    const adviceElement = document.getElementById('weather-advice');
    if (adviceElement) {
        adviceElement.innerText = `พยากรณ์: วันนี้${data.weather[0].description} อากาศเหมาะกับการดูแลฟาร์มครับ`;
    }
}

// ==========================================
// 6. รันคำสั่งทั้งหมดเมื่อหน้าเว็บเริ่มโหลดขึ้นมาครั้งแรก (Single Point Entry)
// ==========================================
window.onload = function() {
    const userName = localStorage.getItem('user_fullname') || "ผู้ใช้";
    if(document.getElementById('welcome-text')) {
        document.getElementById('welcome-text').innerText = `ยินดีต้อนรับ คุณ ${userName}`;
    }
    getWeatherData();
};
// ==========================================================================
// 💧 1. (ย้ายไปรวมเป็นฟังก์ชันเดียวด้านล่าง เพื่อไม่ให้มี calculateOverallWaterQuality ซ้ำกัน 2 อัน)
// ==========================================================================

// ==========================================================================
// 🫧 2. ระบบสร้างฟองอากาศพาสเทลเบาๆ ลอยอยู่พื้นหลัง (มินิมอล)
// ==========================================================================
function initBackgroundBubbles() {
    const bgContainer = document.getElementById('bubble-bg');
    if (!bgContainer) return;
    
    // เคลียร์ฟองเก่าก่อนสร้างใหม่กันสแปม
    bgContainer.innerHTML = '';
    
    for (let i = 0; i < 15; i++) {
        let bubble = document.createElement('div');
        bubble.className = 'bubble';
        let size = Math.random() * 15 + 5; // สุ่มขนาดฟอง 5px - 20px
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.animationDelay = `${Math.random() * 8}s`;
        bubble.style.animationDuration = `${Math.random() * 5 + 6}s`;
        bgContainer.appendChild(bubble);
    }
}

// ==========================================================================
// ⚙️ 3. การเชื่อมต่อเรียกใช้งานเพิ่มเติมจากระบบเดิม
// ==========================================================================

// แนะนำให้นำคำสั่งสั้นๆ นี้ ไปใส่เพิ่มในฟังก์ชัน window.onload เดิมของคุณด้วยนะคะ
// เพื่อให้เปิดหน้าเว็บมาแล้วฟองอากาศทำงานทันที
setTimeout(() => {
    initBackgroundBubbles();
    calculateOverallWaterQuality();
}, 1000);

// แนะนำให้นำคำสั่ง calculateOverallWaterQuality(); ไปวางไว้ข้างในฟังก์ชัน 
// database.ref('/sensor/...').on('value', ...) ทุกตัวที่มีอยู่ 
// เวลาค่าน้ำจาก Firebase อัปเดต กล่องคุณภาพน้ำโดยรวมจะได้อัปเดตตามทันทีค่ะสุนีย์!
function calculateOverallWaterQuality() {
    const iconEl = document.getElementById('water-status-icon');
    const textEl = document.getElementById('water-status-text');
    const adviceEl = document.getElementById('water-status-advice');
    const alertListEl = document.getElementById('mini-alert-list');
    
    if (!iconEl || !textEl || !adviceEl || !alertListEl) return; 

    // ดึงค่าเซนเซอร์สดจากตัวแปร Global ในโปรเจกต์ของคุณ
    // (หากตัวแปรที่เก็บค่า Firebase ของคุณสะกดต่างจากนี้ เช่น live_temp ให้เปลี่ยนชื่อให้ตรงกันนะคะ)
    let currentTemp = typeof liveTemp !== 'undefined' ? liveTemp : 0;
    let currentPh = typeof livePh !== 'undefined' ? livePh : 0;
    let currentSalinity = typeof liveSalinity !== 'undefined' ? liveSalinity : 0; 

    let totalDangers = 0;
    let totalWarnings = 0;
    let advices = [];
    let alertHtml = ""; // ตัวแปรสำหรับเก็บรายการแจ้งเตือนจริง

    // ดึงเวลาปัจจุบันในระบบมาใช้จริง ไม่ Fix วันที่แล้ว
    let now = new Date();
    let timeString = now.toLocaleTimeString('th-TH') + " น.";

    // ── [คำนวณจริง 1] ตรวจสอบอุณหภูมิ ──
    if (currentTemp > 30) { 
        totalDangers++; 
        advices.push("อุณหภูมิน้ำร้อนเกินไป"); 
        alertHtml += `<div class="mini-notify-item danger">
                        <span class="mini-notify-time">[${timeString}]</span>
                        <span class="mini-notify-msg">🚨 อุณหภูมิสูงวิกฤต (${currentTemp}°C) ร้อนเกินไปสำหรับหอยนางรม</span>
                      </div>`;
    } else if (currentTemp < 24 && currentTemp > 0) { 
        totalWarnings++; 
        advices.push("อุณหภูมิน้ำเย็นเกินไป"); 
        alertHtml += `<div class="mini-notify-item warning">
                        <span class="mini-notify-time">[${timeString}]</span>
                        <span class="mini-notify-msg">⚠️ เฝ้าระวัง: อุณหภูมิน้ำต่ำ (${currentTemp}°C) น้ำเย็นเกินไป</span>
                      </div>`;
    }

    // ── [คำนวณจริง 2] ตรวจสอบค่า pH ──
    if (currentPh > 8.0) { 
        totalDangers++; 
        advices.push("ค่า pH เป็นด่างสูงเกินไป"); 
        alertHtml += `<div class="mini-notify-item danger">
                        <span class="mini-notify-time">[${timeString}]</span>
                        <span class="mini-notify-msg">🧪 วิกฤต: ค่า pH น้ำสูง (${currentPh}) น้ำเป็นด่างเกินไป</span>
                      </div>`;
    } else if (currentPh < 6.5 && currentPh > 0) { 
        totalDangers++; 
        advices.push("ค่า pH เป็นกรดวิกฤต"); 
        alertHtml += `<div class="mini-notify-item danger">
                        <span class="mini-notify-time">[${timeString}]</span>
                        <span class="mini-notify-msg">🧪 วิกฤต: ค่า pH น้ำต่ำ (${currentPh}) น้ำเป็นกรดอันตรายต่อเปลือกหอย</span>
                      </div>`;
    }

    // ── [คำนวณจริง 3] ตรวจสอบความเค็ม ──
    if (currentSalinity < 10.0 && currentSalinity > 0) { 
        totalDangers++; 
        advices.push("ความเค็มต่ำวิกฤต (น้ำจืดเกินไป)"); 
        alertHtml += `<div class="mini-notify-item danger">
                        <span class="mini-notify-time">[${timeString}]</span>
                        <span class="mini-notify-msg">🌊 วิกฤตความเค็ม: ค่าความเค็มต่ำมาก (${currentSalinity} ppt) น้ำจืดเกินไป รีบเปิดน้ำทะเลหนุนด่วน</span>
                      </div>`;
    } else if (currentSalinity > 35.0) { 
        totalWarnings++; 
        advices.push("ความเค็มสูงเกินเกณฑ์"); 
        alertHtml += `<div class="mini-notify-item warning">
                        <span class="mini-notify-time">[${timeString}]</span>
                        <span class="mini-notify-msg">⚠️ เฝ้าระวัง: ความเค็มน้ำสูง (${currentSalinity} ppt) ควรเติมน้ำสะอาดเจือจาง</span>
                      </div>`;
    }

    // ── render แสดงผลลัพธ์ตามค่าจริงที่คำนวณได้ ──
    if (totalDangers > 0) {
        iconEl.innerText = "😡";
        textEl.innerText = "ไม่เหมาะสม";
        textEl.style.color = "#ef4444";
        adviceEl.innerText = advices.join(" | ");
    } else if (totalWarnings > 0) {
        iconEl.innerText = "⚠️";
        textEl.innerText = "เฝ้าระวัง";
        textEl.style.color = "#f59e0b";
        adviceEl.innerText = advices.join(" | ");
    } else {
        iconEl.innerText = "🥰";
        textEl.innerText = "เหมาะสม";
        textEl.style.color = "#22c55e";
        adviceEl.innerText = "ค่าน้ำทุกอย่างอยู่ในเกณฑ์สมบูรณ์แบบ หอยนางรมเจริญเติบโตรวดเร็วและกินอาหารได้ดีมากครับ";
    }

    // แสดงรายการแจ้งเตือนจริงลงในกล่องแจ้งเตือนข้างล่าง ถ้าค่าน้ำปกติหมดจะขึ้นว่าฟาร์มปลอดภัย
    if (alertHtml !== "") {
        alertListEl.innerHTML = alertHtml;
    } else {
        alertListEl.innerHTML = `<div class="mini-notify-item success" style="border-left-color: #22c55e; background: #f0fdf4;">
                                    <span class="mini-notify-time">[${timeString}]</span>
                                    <span class="mini-notify-msg">✅ ฟาร์มปลอดภัย: ค่าน้ำทั้งหมดอยู่ในเกณฑ์ปกติ ไม่มีรายงานแจ้งเตือน</span>
                                 </div>`;
    }

    // 🐙 อัปเดตอารมณ์ AI Pet ตามค่าความเค็มจริง (น้ำจืดจัดเกินไป = เครียด)
    const petMood = (currentSalinity > 0 && currentSalinity < 10.0) ? 'scared' : 'happy';
    updateDashboardAiPetDisplay(petMood);
}
// ==========================================
// ── ระบบอัปเดต AI Pet Real-time บนหน้าแดชบอร์ด ──
// ==========================================
function updateDashboardAiPetDisplay(moodKey) {
    const avatarGroupEl = document.getElementById('pet-avatar-dashboard-group');
    const statusLabelEl = document.getElementById('ai-pet-status-label');
    
    if (!avatarGroupEl || !statusLabelEl) return; // ทำงานเฉพาะหน้าที่มีกล่อง AI Pet เท่านั้น

    // สลับคลาสอารมณ์ ( happy หรือ scared) เพื่อคุม SVG ด้วย CSS
    avatarGroupEl.className = `water-quality-content pet-avatar-display-set ${moodKey}`;

    // อัปเดตข้อความป้ายสถานะ
    if (moodKey === 'scared') {
        statusLabelEl.innerText = "อารมณ์: เครียด (น้ำจืดจัด)";
    } else {
        statusLabelEl.innerText = "อารมณ์: มีความสุขสบายใจ";
    }
}

// ===================================================
// ⚡ OCEAN ENGINE ADVANCED INTERACTION SCRIPT (guide.js)
// ===================================================

document.addEventListener("DOMContentLoaded", () => {
    initSmoothAccordion();
    spawnOceanBubbles(55); // 🫧 เรียกใช้งานฟองสบู่จำนวน 55 ลูกแบบสุ่มกระจายทั่วหน้าจอ
    spawnOceanFish(6);     // 🐟 ปล่อยปลาว่ายน้ำประกอบฉากจำลองระบบนิเวศ Aquarium
});

/**
 * 📐 ระบบควบคุมการเปิดการ์ดสไลด์นุ่มนวลแบบ Smooth Accordion (เปิดได้พร้อมกันอิสระ)
 */
function initSmoothAccordion() {
    const cards = document.querySelectorAll(".guide-card");
    
    cards.forEach(card => {
        const header = card.querySelector(".card-header");
        header.addEventListener("click", () => {
            card.classList.toggle("active");
        });
    });
}

/**
 * 🫧 ฟังก์ชันสร้างเม็ดฟองอากาศไดนามิกสุ่มขนาด ความเร็ว และทิศทางการลอยเลี้ยว
 */
function spawnOceanBubbles(count) {
    const container = document.getElementById("bubble-container");
    if (!container) return;

    for (let i = 0; i < count; i++) {
        const bubble = document.createElement("div");
        bubble.className = "bubble-node";
        
        const size = Math.random() * 18 + 6; // สุ่มขนาด 6px - 24px
        const leftPos = Math.random() * 100; // สุ่มตำแหน่งแนวนอน
        const duration = Math.random() * 6 + 6; // สุ่มความเร็วลอยตัว 6s - 12s
        const delay = Math.random() * 8; // สุ่มดีเลย์จุดเกิดอัตโนมัติ
        const drift = Math.random() * 60 - 30; // รัศมีการลอยเฉียงซ้ายขวา (--drift)

        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${leftPos}%`;
        bubble.style.animationDuration = `${duration}s`;
        bubble.style.animationDelay = `${delay}s`;
        bubble.style.setProperty("--drift", `${drift}px`);

        container.appendChild(bubble);
    }
}

/**
 * 🐟 ฟังก์ชันจำลองสิ่งมีชีวิตขนาดเล็กใต้วารีเพื่อเพิ่มมิติความสวยงามระดับพรีเมียม
 */
function spawnOceanFish(count) {
    const tank = document.getElementById("aquarium-fish-tank");
    if (!tank) return;

    for (let i = 0; i < count; i++) {
        const fish = document.createElement("div");
        fish.className = "fish-node";
        
        const topPos = Math.random() * 75 + 15; // สุ่มความลึกจุดว่าย
        const duration = Math.random() * 12 + 15; // ความเร็วการเคลื่อนที่
        const delay = Math.random() * 10; // ดีเลย์สุ่มปล่อยตัว
        const scale = Math.random() * 0.5 + 0.7; // สุ่มขนาดของตัวปลา

        fish.style.top = `${topPos}%`;
        fish.style.animationDuration = `${duration}s`;
        fish.style.animationDelay = `${delay}s`;
        fish.style.transform = `scale(${scale})`;

        tank.appendChild(fish);
    }
}
