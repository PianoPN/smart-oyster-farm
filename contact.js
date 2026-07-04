/**
 * ฟังก์ชันสลับเปิด-ปิดเนื้อหารายละเอียดของหน่วยงาน (Accordion/Expandable Card)
 * เมื่อคลิกจะทำการขยายกล่องและหมุนปุ่มลูกศรแบบนุ่มนวล
 */
function toggleCard(triggerElement) {
    const parentCard = triggerElement.parentElement;
    const expandableContent = triggerElement.nextElementSibling;

    // ตรวจสอบสถานะว่าเปิดอยู่หรือไม่
    if (expandableContent.style.display === "block") {
        // ทำการปิดกล่องรายละเอียด
        expandableContent.style.display = "none";
        parentCard.classList.remove("card-active-state");
    } else {
        // ทำการเปิดกล่องรายละเอียด
        expandableContent.style.display = "block";
        parentCard.classList.add("card-active-state");
    }
}
window.onload = function() {
    const userName = localStorage.getItem('user_fullname') || "ผู้ใช้";
    if(document.getElementById('welcome-text')) {
        document.getElementById('welcome-text').innerText = `ยินดีต้อนรับ คุณ ${userName}`;
    }
    getWeatherData();
};
/**
 * ฟังก์ชันการทำงานของปุ่มแคปซูลแอดมินส่วนท้ายหน้าจอ
 */
function openAdminContact() {
    console.log("กำลังนำทางผู้ใช้งานไปยังช่องทางแชทคุยกับทีมงานแอดมิน...");
    alert("ระบบกำลังเปิดหน้าต่างติดต่อส่งข้อความด่วนหา Admin ประจำเว็บโมเดลฟาร์มหอยนางรมอัจฉริยะ ยินดีให้บริการค่ะ!");
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