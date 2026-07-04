// ดึงข้อมูลเซนเซอร์จริงแบบเรียลไทม์ (ใส่ลิงก์ IP หรือ Endpoint ของบอร์ดเซนเซอร์ตัวเดียวกับหน้าแดชบอร์ด)
const SENSOR_API_URL = "http://192.168.1.X/data"; // 🛠️ เปลี่ยนเป็น IP บอร์ดของคุณครับ

function fetchRealtimeNotifications() {
    fetch(SENSOR_API_URL)
        .then(response => response.json())
        .then(data => {
            // สมมติโครงสร้างข้อมูล data = { temp: 25.0, pH: 7.66, salinity: 1.10 }
            generateAlerts(data);
        })
        .catch(error => {
            console.error("Error fetching sensor data:", error);
            document.getElementById("notification-list").innerHTML = `
                <div class="notify-item danger">
                    <span class="notify-time">[ระบบ]</span>
                    <span class="notify-msg">❌ ไม่สามารถเชื่อมต่อกับบอร์ดเซนเซอร์จริงได้ กรุณาตรวจสอบการเชื่อมต่อเครือข่าย</span>
                </div>
            `;
        });
}

function generateAlerts(sensorData) {
    const listContainer = document.getElementById("notification-list");
    let alertHTML = "";
    const now = new Date();
    const timeString = `[${now.toLocaleDateString('th-TH')} ${now.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}]`;

    // 1. ตรวจสอบสถานะค่า pH จริง (เกณฑ์ฟาร์มหอยนางรมที่ปลอดภัย: 7.5 - 8.4)
    if (sensorData.pH < 7.5) {
        alertHTML += `
            <div class="notify-item danger">
                <span class="notify-time">${timeString}</span>
                <span class="notify-msg">⚠️ วิกฤต: ค่า pH ในน้ำต่ำเกินไป (${sensorData.pH}) น้ำเริ่มเป็นกรด อาจส่งผลต่อการสร้างเปลือกของหอยนางรม!</span>
            </div>
        `;
    } else if (sensorData.pH > 8.4) {
        alertHTML += `
            <div class="notify-item danger">
                <span class="notify-time">${timeString}</span>
                <span class="notify-msg">⚠️ วิกฤต: ค่า pH ในน้ำสูงเกินไป (${sensorData.pH}) น้ำมีความเป็นด่างมากเกินไป</span>
            </div>
        `;
    }

    // 2. ตรวจสอบสถานะค่าความเค็มจริง (Salinity)
    if (sensorData.salinity < 1.0) { // ยกตัวอย่างถ้าน้ำจืดเกินไป
        alertHTML += `
            <div class="notify-item warning">
                <span class="notify-time">${timeString}</span>
                <span class="notify-msg">🔸 แจ้งเตือน: ค่าความเค็มต่ำเกินเกณฑ์ (${sensorData.salinity} ppt) น้ำจืดสลายตัวหนาแน่นในฟาร์ม</span>
            </div>
        `;
    }

    // หากเซนเซอร์ทุกตัวปกติ ไม่มีค่าไหนหลุดเกณฑ์เลย
    if (alertHTML === "") {
        alertHTML = `
            <div class="notify-item success">
                <span class="notify-time">${timeString}</span>
                <span class="notify-msg">✅ ระบบทำงานปกติ: สภาพน้ำและอุณหภูมิอยู่ในเกณฑ์ที่สมบูรณ์ดีเยี่ยมสำหรับหอยนางรม</span>
            </div>
        `;
    }

    listContainer.innerHTML = alertHTML;
}

// เคลียร์รายการแจ้งเตือนทั้งหมด
function clearAllNotifications() {
    document.getElementById("notification-list").innerHTML = `
        <div class="notify-item success">
            <span class="notify-time">[ระบบ]</span>
            <span class="notify-msg">✔️ เคลียร์บันทึกการแจ้งเตือนแล้ว ระบบกำลังรอรับข้อมูลรอบถัดไป...</span>
        </div>
    `;
}

// เรียกทำงานทันทีที่เปิดหน้าเว็บ และให้อัปเดตอัตโนมัติทุกๆ 5 วินาที
fetchRealtimeNotifications();
setInterval(fetchRealtimeNotifications, 5000);

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