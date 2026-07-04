// รายชื่อเดือนภาษาไทย
const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

// กำหนดวันปัจจุบันของระบบ
let currentDate = new Date();
// ตัวแปรเก็บเดือน/ปี ที่ปฏิทินกำลังเปิดแสดงอยู่
let displayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

// ดึง Elements จาก HTML
const startDateInput = document.getElementById('startDate');
const harvestedCheck = document.getElementById('harvestedCheck');
const calculateBtn = document.getElementById('calculateBtn');
const monthYearDisplay = document.getElementById('monthYearDisplay');
const calendarDays = document.getElementById('calendarDays');
const currentDateBadge = document.getElementById('currentDateBadge');

// Elements สำหรับการ์ดรายงานสถานะ
const statusDot = document.getElementById('statusDot');
const statusTitle = document.getElementById('statusTitle');
const statusCountdown = document.getElementById('statusCountdown');
const statusDesc = document.getElementById('statusDesc');

// แสดงวันที่ปัจจุบันที่หัวแอป
currentDateBadge.innerText = `วันนี้: ${currentDate.getDate()} ${thaiMonths[currentDate.getMonth()]} ${currentDate.getFullYear() + 543}`;

// ตั้งค่าเริ่มต้นให้ Input วันที่เริ่มต้นเป็นวันปัจจุบัน
startDateInput.value = currentDate.toISOString().split('T')[0];

// Event Listeners สำหรับปุ่มเลื่อนเดือน
document.getElementById('prevMonthBtn').addEventListener('click', () => {
    displayDate.setMonth(displayDate.getMonth() - 1);
    renderCalendar();
});
document.getElementById('nextMonthBtn').addEventListener('click', () => {
    displayDate.setMonth(displayDate.getMonth() + 1);
    renderCalendar();
});

// เมื่อกดอัปเดตข้อมูล
calculateBtn.addEventListener('click', () => {
    renderCalendar();
    updateStatusCard();
});

// ฟังก์ชันคำนวณอายุหอย (หน่วยเป็นเดือน) จากวันเริ่มเลี้ยงเทียบกับวันที่ระบุ
function calculateAgeInMonths(startDate, targetDate) {
    let yearsDiff = targetDate.getFullYear() - startDate.getFullYear();
    let monthsDiff = targetDate.getMonth() - startDate.getMonth();
    let totalMonths = (yearsDiff * 12) + monthsDiff;
    
    // ถ้าวันของเดือนปัจจุบันยังมาไม่ถึงวันเริ่มเลี้ยง ให้ลบออก 1 เดือนเพื่อให้แม่นยำขึ้น
    if (targetDate.getDate() < startDate.getDate()) {
        totalMonths--;
    }
    return totalMonths < 0 ? -1 : totalMonths; 
}

// ฟังก์ชันวาดปฏิทินในโทรศัพท์
function renderCalendar() {
    calendarDays.innerHTML = '';
    
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    
    // แสดงหัวปฏิทิน เดือน ปี พ.ศ.
    monthYearDisplay.innerText = `${thaiMonths[month]} ${year + 543}`;
    
    // หาวันแรกของเดือนว่าตรงกับวันอะไรในสัปดาห์ (0 = อาทิตย์, 6 = เสาร์)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // หาจำนวนวันทั้งหมดในเดือนนั้น
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // สร้างช่องว่างก่อนวันแรกของเดือน
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day', 'empty');
        calendarDays.appendChild(emptyDiv);
    }
    
    // ดึงค่าวันเริ่มต้นเลี้ยงหอย
    const userStartDate = startDateInput.value ? new Date(startDateInput.value) : null;
    const isHarvested = harvestedCheck.checked;
    
    // สร้างตัวเลขวันที่ 1 ถึง สิ้นเดือน
    for (let day = 1; day <= totalDays; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
        dayDiv.innerText = day;
        
        const thisDaysDate = new Date(year, month, day);
        
        // ถ้าใส่ข้อมูลวันเริ่มเลี้ยงแล้ว ให้คำนวณสีพื้นหลังของแต่ละวันในปฏิทิน
        if (userStartDate && thisDaysDate >= userStartDate) {
            const ageMonths = calculateAgeInMonths(userStartDate, thisDaysDate);
            
            if (isHarvested) {
                dayDiv.classList.add('day-done');
                createDot(dayDiv, 'dot-done');
            } else if (ageMonths >= 0 && ageMonths < 10) {
                dayDiv.classList.add('day-growth');
                createDot(dayDiv, 'dot-growth');
            } else if (ageMonths >= 10 && ageMonths < 12) {
                dayDiv.classList.add('day-almost');
                createDot(dayDiv, 'dot-almost');
            } else if (ageMonths >= 12) {
                dayDiv.classList.add('day-ready');
                createDot(dayDiv, 'dot-ready');
            }
        }
        
        // เมื่อคลิกวันที่ในปฏิทิน จะอัปเดตรายละเอียดตามวันนั้นๆ
        dayDiv.addEventListener('click', () => {
            updateStatusCard(thisDaysDate);
        });
        
        calendarDays.appendChild(dayDiv);
    }
}

// ฟังก์ชันสร้างจุดสีใต้ตัวเลข
function createDot(parent, className) {
    const dot = document.createElement('span');
    dot.classList.add('day-dot', className);
    parent.appendChild(dot);
}

// ฟังก์ชันอัปเดตการ์ดสถานะรายละเอียดด้านล่าง (ตามวันที่เลือก หรือวันปัจจุบัน)
function updateStatusCard(targetDate = new Date()) {
    const userStartDate = startDateInput.value ? new Date(startDateInput.value) : null;
    const isHarvested = harvestedCheck.checked;
    
    if (!userStartDate) return;
    
    const ageMonths = calculateAgeInMonths(userStartDate, targetDate);
    const dateString = `${targetDate.getDate()} ${thaiMonths[targetDate.getMonth()]} ${targetDate.getFullYear() + 543}`;
    
    // รีเซ็ตสไตล์สีจุด
    statusDot.style.backgroundColor = '#bdc3c7';
    
    if (isHarvested) {
        statusDot.style.backgroundColor = 'var(--status-done)';
        statusTitle.innerText = "✅ เก็บเกี่ยวเรียบร้อยแล้ว";
        statusCountdown.innerText = `ข้อมูล ณ วันที่: ${dateString} | อายุหอยประมาณ ${ageMonths} เดือน`;
        statusDesc.innerText = "หอยในรุ่นนี้ถูกเก็บเกี่ยวครบถ้วนแล้ว ระบบจะไม่คำนวณการเติบโตเพิ่มเติม สามารถบันทึกผลผลิตหรือเริ่มรอบการเลี้ยงใหม่ได้";
    } else if (ageMonths < 0) {
        statusTitle.innerText = "ยังไม่ถึงรอบการเลี้ยง";
        statusCountdown.innerText = `วันที่เลือก: ${dateString}`;
        statusDesc.innerText = "วันที่คุณเลือกอยู่ก่อนหน้าวันเริ่มต้นการเลี้ยงหอยนางรม";
    } else if (ageMonths < 10) {
        let monthsLeft = 12 - ageMonths;
        statusDot.style.backgroundColor = 'var(--status-red)';
        statusTitle.innerText = "🔴 ระยะเติบโต (0–10 เดือน)";
        statusCountdown.innerText = `อีก ${monthsLeft} เดือนเก็บ | หอยกำลังสร้างเปลือก ห้ามรบกวน (ณ วันที่ ${dateString}, อายุ ${ageMonths} เดือน)`;
        statusDesc.innerText = "ความหมาย: หอยยังอยู่ในช่วงเจริญเติบโต เปลือกยังบางและแตกหักง่าย โครงสร้างภายในยังพัฒนาไม่เต็มที่ ควรเลี้ยงต่อเพื่อให้ได้ขนาดและคุณภาพที่เหมาะสม";
    } else if (ageMonths >= 10 && ageMonths < 12) {
        let monthsLeft = 12 - ageMonths;
        statusDot.style.backgroundColor = 'var(--status-yellow)';
        statusTitle.innerText = "🟡 ระยะใกล้พร้อมเก็บ (10–12 เดือน)";
        statusCountdown.innerText = `อีก ${monthsLeft} เดือนเก็บ | ฝาได้ขนาดแล้ว แต่เนื้อยังไม่อ้วนเต็มที่ (ณ วันที่ ${dateString}, อายุ ${ageMonths} เดือน)`;
        statusDesc.innerText = "ความหมาย: ขนาดภายนอกผ่านเกณฑ์แล้ว แต่ปริมาณและความแน่นของเนื้อยังเพิ่มได้อีก ควรรอให้ครบกำหนดเพื่อให้ได้ผลผลิตที่ดีที่สุด";
    } else {
        statusDot.style.backgroundColor = 'var(--status-green)';
        statusTitle.innerText = "🟢 ระยะพร้อมเก็บเกี่ยว (12 เดือนขึ้นไป)";
        statusCountdown.innerText = `🎉 ถึงกำหนดเก็บเกี่ยว! | หอยโตเต็มสมบูรณ์ตามเกณฑ์สายพันธุ์ (อายุ ${ageMonths} เดือน)`;
        statusDesc.innerText = "ความหมาย: หอยมีขนาดและคุณภาพเนื้ออยู่ในระดับสูงสุดของรอบการเลี้ยง พร้อมเข้าสู่ขั้นตอนล้างตัว คัดขนาด และนำไปจำหน่ายหรือใช้งานเก็บเกี่ยวเสร็จสิ้น";
    }
}

// สั่งรันปฏิทินครั้งแรกเมื่อโหลดหน้าเว็บ
renderCalendar();

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