// ==========================================
// 📝 สคริปต์ระบบบันทึกประจำวัน Real CRUD (diary.js)
// ==========================================

let currentImgBase64 = ""; // ตัวแปรเก็บสายอักขระรูปภาพเพื่อเซฟลงเครื่อง

// ฟังก์ชันเปิดพรีวิวรูปภาพและดึงค่าดิบเข้าระบบจริง
function previewFile() {
    const preview = document.getElementById('img_preview');
    const placeholder = document.getElementById('upload-placeholder');
    const file = document.getElementById('diary_img_input').files[0];
    const reader = new FileReader();

    reader.onloadend = function() {
        currentImgBase64 = reader.result; // แปลงรูปสำเร็จ
        preview.src = reader.result;
        preview.style.display = "block";
        placeholder.style.display = "none";
    }

    if (file) {
        reader.readAsDataURL(file);
    }
}

// ===================================================
// 📝 สิ่งที่ต้องเพิ่ม: ฟังก์ชันดึงอีเมลของผู้ใช้ที่ล็อกอินอยู่ปัจจุบัน
// ===================================================
function getCurrentUserEmail() {
    // ดึงค่าอีเมลที่ล็อกอิน (ลองเปลี่ยนคำว่า 'user_email' ให้ตรงกับระบบ login ของคุณนะครับ)
    return localStorage.getItem('user_email') || 'guest_user'; 
}

// 1. แก้ไขฟังก์ชันโหลดข้อมูล (โหลดเฉพาะของอีเมลตัวเอง)
function loadDiaryLogs() {
    const logsList = document.getElementById('logs-list');
    const allLogs = JSON.parse(localStorage.getItem('smart_farm_diary')) || [];
    
    // 🛠️ คัดกรอง: เอาเฉพาะบันทึกที่มีอีเมลตรงกับผู้ที่ล็อกอินอยู่ตอนนี้เท่านั้น
    const currentUser = getCurrentUserEmail();
    const logs = allLogs.filter(item => item.userEmail === currentUser);

    if (logs.length === 0) {
        logsList.innerHTML = `<div class="no-logs">ยังไม่มีบันทึกข้อมูลของบัญชีนี้ เริ่มบันทึกที่ฟอร์มด้านบนได้เลย!</div>`;
        return;
    }

    logsList.innerHTML = logs.map(log => `
        <div class="log-card" id="log-${log.id}">
            <div class="log-actions">
                <button class="btn-action edit" onclick="editLog('${log.id}')" title="แก้ไข"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-action delete" onclick="deleteLog('${log.id}')" title="ลบ"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class="log-img-box">
                <img src="${log.image || 'https://placehold.co/150?text=No+Image'}" alt="Oyster">
            </div>
            <div class="log-info-box">
                <div class="log-date"><i class="fa-regular fa-calendar-days"></i> วันเวลาบันทึก: ${log.datetime}</div>
                <div class="status-item"><span class="status-label">🌡️ สถานะอุณหภูมิน้ำ:</span> ${log.temp}</div>
                <div class="status-item"><span class="status-label">🧪 สถานะค่า pH ของน้ำ:</span> ${log.ph}</div>
                ${log.note ? `<div class="log-note"><strong>📝 บันทึกเพิ่มเติม:</strong> ${log.note}</div>` : ''}
            </div>
        </div>
    `).join('');
}

// 2. แก้ไขฟังก์ชันบันทึกข้อมูล (แนบอีเมลคนบันทึกไปด้วย)
function saveDiary(e) {
    e.preventDefault();
    
    const editId = document.getElementById('edit-id').value;
    const tempValue = document.querySelector('input[name="diary_temp"]:checked').value;
    const phValue = document.querySelector('input[name="diary_ph"]:checked').value;
    const noteValue = document.getElementById('diary_note').value;
    const currentUser = getCurrentUserEmail(); // ดึงอีเมลคนกดบันทึก

    let logs = JSON.parse(localStorage.getItem('smart_farm_diary')) || [];

    if (editId) {
        logs = logs.map(item => {
            if (item.id === editId) {
                return {
                    ...item,
                    temp: tempValue,
                    ph: phValue,
                    note: noteValue,
                    image: currentImgBase64 || item.image
                };
            }
            return item;
        });
        alert("แก้ไขบันทึกเรียบร้อยแล้ว!");
    } else {
        const now = new Date();
        const timeString = `${now.toLocaleDateString('th-TH')} เวลา ${now.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} น.`;
        
        const newLog = {
            id: 'id_' + Date.now(),
            userEmail: currentUser, // 🛠️ แอบหยอดอีเมลผู้ใช้ฝังลงไปในกล่องบันทึกนี้
            datetime: timeString,
            temp: tempValue,
            ph: phValue,
            note: noteValue,
            image: currentImgBase64
        };
        logs.push(newLog);
        alert("บันทึกข้อมูลเรียบร้อยแล้ว!");
    }

    localStorage.setItem('smart_farm_diary', JSON.stringify(logs));
    resetForm();
    loadDiaryLogs();
}
// กดปุ่มดินสอเพื่อดึงข้อมูลเดิมกลับขึ้นไปแก้ไขบนฟอร์ม
function editLog(id) {
    const logs = JSON.parse(localStorage.getItem('smart_farm_diary')) || [];
    const log = logs.find(item => item.id === id);
    
    if (!log) return;

    // ส่งค่ากลับไปบรรจุที่ฟอร์มด้านบน
    document.getElementById('edit-id').value = log.id;
    document.getElementById('diary_note').value = log.note;
    
    // ติ๊กเลือกวิทยุสถานะตามค่านั้นๆ
    document.querySelector(`input[name="diary_temp"][value="${log.temp}"]`).checked = true;
    document.querySelector(`input[name="diary_ph"][value="${log.ph}"]`).checked = true;

    // แสดงรูปเดิม
    if (log.image) {
        document.getElementById('img_preview').src = log.image;
        document.getElementById('img_preview').style.display = "block";
        document.getElementById('upload-placeholder').style.display = "none";
        currentImgBase64 = log.image;
    }

    // ปรับหน้าตากลุ่มปุ่มเป็นโหมดแก้ไข
    document.getElementById('submit-btn').innerText = "🔄 อัปเดตข้อมูลที่แก้ไข";
    document.getElementById('cancel-edit-btn').style.display = "inline-block";
    
    // เลื่อนหน้าจอนุ่มนวลกลับขึ้นไปข้างบนเพื่อเปิดดูฟอร์ม
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ลบบันทึกที่ไม่ต้องการออกจากระบบ
function deleteLog(id) {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเอกสารบันทึกของวันนี้ทิ้ง?")) return;

    let logs = JSON.parse(localStorage.getItem('smart_farm_diary')) || [];
    logs = logs.filter(item => item.id !== id);
    
    localStorage.setItem('smart_farm_diary', JSON.stringify(logs));
    loadDiaryLogs();
}

// รีเซ็ตค่าฟอร์มกลับไปจุดเริ่มต้น
function resetForm() {
    document.getElementById('edit-id').value = "";
    document.getElementById('diaryForm').reset();
    document.getElementById('img_preview').src = "";
    document.getElementById('img_preview').style.display = "none";
    document.getElementById('upload-placeholder').style.display = "block";
    currentImgBase64 = "";

    document.getElementById('submit-btn').innerText = "💾 บันทึกข้อมูลรายงาน";
    document.getElementById('cancel-edit-btn').style.display = "none";
}

// ทำระบบฟองอากาศทำงานเบื้องหลัง
function initBubbles() {
    const bgContainer = document.getElementById('bubble-bg');
    if (!bgContainer) return;
    for (let i = 0; i < 12; i++) {
        let bubble = document.createElement('div');
        bubble.className = 'bubble';
        let size = Math.random() * 15 + 5;
        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';
        bubble.style.left = Math.random() * 100 + '%';
        bubble.style.animationDelay = Math.random() * 5 + 's';
        bubble.style.animationDuration = (Math.random() * 5 + 5) + 's';
        bgContainer.appendChild(bubble);
    }
}

// เริ่มต้นเปิดระบบงานเมื่อหน้าเอกสารเว็บพร้อมใช้งาน
window.onload = function() {
    initBubbles();
    loadDiaryLogs();

    const imgInput = document.getElementById('diary_img_input');
    if (imgInput) imgInput.addEventListener('change', previewFile);

    const diaryForm = document.getElementById('diaryForm');
    if (diaryForm) diaryForm.addEventListener('submit', saveDiary);
};

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