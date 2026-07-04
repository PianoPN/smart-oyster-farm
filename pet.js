// ตั้งค่า Firebase ดึงข้อมูลความจริงจากฟาร์มของคุณ
const firebaseConfig = {
    apiKey: "AIzaSyAlTdug7W4lsdzmSKg3VxrhZwCcikrXV-8",
    databaseURL: "https://smart-oyster-farm-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "smart-oyster-farm",
};
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// ตัวแปรเก็บสถานะการทำงานปัจจุบัน
let isRealtimeMode = true;
let liveSalinityVal = 25.0; // ค่าเริ่มต้นเผื่อโหลดช้า

// คลังข้อมูลอารมณ์ทั้งหมดของน้องหอย (ใช้ทั้งโหมดจำลอง และ Real-time)
const moodData = {
    happy: {
        text: "อารมณ์: มีความสุขสมบูรณ์",
        class: "badge-happy",
        desc: "สภาพน้ำเค็มและอุณหภูมิปกติ ผมพ่นฟองสบายใจเฉิบพร้อมกรองสารอาหารเต็มที่เลยครับโฮสต์!",
        cause: "ค่าความเค็ม อุณหภูมิ ออกซิเจนละลายน้ำ และค่า pH อยู่ในเกณฑ์เหมาะสมทั้งหมด",
        solution: "รักษาสภาพแวดล้อมแบบนี้ต่อไป หมั่นตรวจวัดค่าน้ำอย่างสม่ำเสมอเพื่อคงคุณภาพนี้ไว้"
    },
    scared: {
        text: "อารมณ์: เครียดจัด (น้ำจืดเกินไป)",
        class: "badge-scared",
        desc: "ช่วยด้วยครับ! ตอนนี้ความเค็มต่ำมาก น้ำจืดเข้าท่วมฟาร์มจนผมแสบตัว ต้องรีบปิดฝาเอาชีวิตรอด!",
        cause: "ความเค็มของน้ำต่ำกว่าเกณฑ์วิกฤต มักเกิดจากฝนตกหนักหรือน้ำจืดไหลบ่าเข้าฟาร์ม",
        solution: "ย้ายกระชังหอยไปพื้นที่ความเค็มสูงกว่าชั่วคราว หรือรอจนน้ำทะเลกลับสู่ระดับปกติ"
    },
    insomnia: {
        text: "อารมณ์: นอนไม่หลับ กระสับกระส่าย",
        class: "badge-warning",
        desc: "น้ำร้อนเกินไป แถมออกซิเจนในน้ำก็น้อยทำเอาอึดอัด แง้มฝาค้างจนนอนไม่หลับทั้งคืนเลย",
        cause: "อุณหภูมิน้ำสูงเกินไปประกอบกับออกซิเจนละลายน้ำต่ำ มักเกิดช่วงกลางวันที่แดดจัดหรือน้ำนิ่ง",
        solution: "เพิ่มการหมุนเวียนของน้ำหรือติดตั้งเครื่องเติมอากาศ และย้ายกระชังไปจุดที่มีร่มเงามากขึ้น"
    },
    acid: {
        text: "อารมณ์: อ่อนแอ เปลือกกัดกร่อน",
        class: "badge-scared",
        desc: "ค่าน้ำเป็นกรดต่ำกว่าเกณฑ์ ผิวเปลือกชั้นนอกของผมกำลังถูกกัดกร่อน เจ็บแสบไปหมดแล้วครับ",
        cause: "ค่า pH ของน้ำต่ำกว่าปกติ (เป็นกรด) อาจมาจากน้ำเสียปนเปื้อนหรือฝนกรด",
        solution: "ตรวจสอบแหล่งน้ำที่ไหลเข้าฟาร์ม พิจารณาปรับสภาพน้ำด้วยปูนขาวในปริมาณที่เหมาะสม"
    },
    alkaline: {
        text: "อารมณ์: อึดอัด ท้องอืดโตช้า",
        class: "badge-warning",
        desc: "น้ำเป็นด่างสูงจัดเนื่องจากแพลงก์ตอนบลูมหนาแน่น ทำให้ระบบทางเดินอาหารผมทำงานติดขัด",
        cause: "ค่า pH สูงผิดปกติจากการสังเคราะห์แสงของแพลงก์ตอนที่บลูมหนาแน่นเกินไป",
        solution: "ลดปริมาณธาตุอาหารที่ไหลลงน้ำ และเฝ้าระวังการบลูมของแพลงก์ตอนอย่างใกล้ชิด"
    },
    hibernating: {
        text: "อารมณ์: จำศีล หนีความหนาว",
        class: "badge-happy",
        desc: "น้ำเย็นยะเยือกเกินไป ผมขอปิดฝาล็อกตัวเองสนิท ไม่กิน ไม่ดิ้นรน เซฟพลังงานรอแดดออกนะ",
        cause: "อุณหภูมิน้ำต่ำกว่าเกณฑ์ที่เหมาะสม มักเกิดในช่วงฤดูหนาวหรือน้ำเย็นไหลเข้าฟาร์ม",
        solution: "ไม่ต้องกังวลมากนัก เป็นกลไกป้องกันตัวตามธรรมชาติ เพียงรอให้อุณหภูมิน้ำกลับสู่ปกติ"
    },
    choking: {
        text: "อารมณ์: สำลักคราบฝุ่นตะกอน",
        class: "badge-scared",
        desc: "น้ำขุ่นคลักไปด้วยเศษดินและตะกอนโคลนลอยฟุ้ง มันเข้าไปติดเหงือกจนผมหายใจไม่ออกแล้ว!",
        cause: "ความขุ่นของน้ำสูงเกินไปจากตะกอนดินหรือโคลน มักเกิดหลังฝนตกหนักหรือน้ำไหลแรง",
        solution: "รอให้ตะกอนตกตะกอนหรือติดตั้งม่านกันตะกอนรอบกระชัง ลดกิจกรรมที่ทำให้พื้นดินฟุ้งกระจาย"
    },
    hungry: {
        text: "อารมณ์: หิวโหย ไม่มีแรง",
        class: "badge-warning",
        desc: "แพลงก์ตอนในน้ำมีน้อยมาก ผมกรองอาหารแทบไม่เจอเลย ท้องร้องจ๊อกๆ หมดแรงจะเปิดฝาไหวมั้ยเนี่ย",
        cause: "ปริมาณแพลงก์ตอนและสารอาหารในน้ำต่ำกว่าเกณฑ์ อาจเกิดจากกระแสน้ำเปลี่ยนหรือช่วงเปลี่ยนฤดูกาล",
        solution: "พิจารณาย้ายกระชังไปจุดที่มีสารอาหารมากกว่า หรือปล่อยน้ำหมุนเวียนเพื่อนำพาแพลงก์ตอนใหม่เข้ามา"
    },
    toxic: {
        text: "อารมณ์: มึนงง พิษเข้าตัว",
        class: "badge-scared",
        desc: "มีอะไรแปลกปลอมปนอยู่ในน้ำ ผมรู้สึกมึนหัวและอ่อนแรงผิดปกติ ต้องรีบตรวจสอบด่วน!",
        cause: "ตรวจพบสารพิษหรือโลหะหนักปนเปื้อนในแหล่งน้ำ อาจมาจากของเสียโรงงานหรือสารเคมีทางการเกษตร",
        solution: "หยุดรับน้ำจากแหล่งที่ต้องสงสัยทันที ตรวจสอบคุณภาพน้ำอย่างละเอียดและแจ้งหน่วยงานที่เกี่ยวข้อง"
    },
    crowded: {
        text: "อารมณ์: อึดอัด แออัดยัดเยียด",
        class: "badge-warning",
        desc: "เพื่อนๆ เยอะแน่นจนแทบขยับตัวไม่ได้ แย่งอาหารและออกซิเจนกันวุ่นวายไปหมด",
        cause: "ความหนาแน่นของหอยในกระชังหรือแพเลี้ยงสูงเกินขนาดที่เหมาะสม",
        solution: "ลดความหนาแน่น แยกหอยบางส่วนไปยังกระชังใหม่ เพื่อให้มีพื้นที่และอาหารเพียงพอต่อตัว"
    },
    lovey: {
        text: "อารมณ์: ฟินสุดๆ พร้อมผสมพันธุ์",
        class: "badge-happy",
        desc: "สภาพน้ำดีเยี่ยมสุดๆ ผมรู้สึกพร้อมมากที่จะสืบพันธุ์ให้ลูกหอยตัวน้อยๆ เต็มฟาร์มเลย!",
        cause: "อุณหภูมิและสารอาหารเหมาะสมเป็นพิเศษ ตรงตามช่วงฤดูวางไข่ตามธรรมชาติของหอยนางรม",
        solution: "ช่วงเวลาดีเยี่ยมสำหรับการขยายพันธุ์ อาจพิจารณาเก็บตัวอ่อนเพื่อขยายฟาร์มเพิ่มเติม"
    },
    stormy: {
        text: "อารมณ์: เวียนหัว โคลงเคลง",
        class: "badge-warning",
        desc: "กระแสน้ำแรงจัดจนโยกไปโยกมา ผมเกาะแน่นสุดแรงแต่ก็ยังเวียนหัวอยู่ดี",
        cause: "คลื่นลมแรงหรือกระแสน้ำไหลเชี่ยวผิดปกติ อาจมาจากพายุหรือช่วงน้ำขึ้นน้ำลงรุนแรง",
        solution: "ตรวจสอบความแข็งแรงของทุ่นและเชือกยึดกระชัง เสริมจุดยึดให้มั่นคงก่อนช่วงมรสุม"
    }
};

// ── ฟังก์ชันคำนวณจาก Firebase จริง (Real-time) ──
database.ref('/sensor/salinity').on('value', (snapshot) => {
    liveSalinityVal = snapshot.val() || 0;

    const liveBadge = document.getElementById('live-badge');
    const liveNarrative = document.getElementById('live-narrative');

    if (liveSalinityVal < 10.0) {
        if (liveBadge) { liveBadge.innerText = "วิกฤต: เครียดน้ำจืด"; liveBadge.className = "pet-badge badge-scared"; }
        if (liveNarrative) liveNarrative.innerText = `ตรวจพบความเค็มต่ำวิกฤต (${liveSalinityVal.toFixed(1)} ppt) น้องหอยในฟาร์มกำลังเครียดหนัก`;
    } else {
        if (liveBadge) { liveBadge.innerText = "ปกติ: ร่าเริงดี"; liveBadge.className = "pet-badge badge-happy"; }
        if (liveNarrative) liveNarrative.innerText = `ความเค็มฟาร์มปกติ (${liveSalinityVal.toFixed(1)} ppt) หอยมีความสุขดีตามธรรมชาติ`;
    }

    if (isRealtimeMode) {
        updateRightDisplay(liveSalinityVal < 10.0 ? 'scared' : 'happy', `โหมด: Real-time ตรวจสอบฟาร์มจริง (${liveSalinityVal.toFixed(1)} ppt)`);
    }
});

// ── ฟังก์ชันคลิกเลือกดูตามอารมณ์ต่าง ๆ ──
function previewMood(moodKey) {
    isRealtimeMode = false;

    document.getElementById('btn-realtime').classList.remove('active-realtime');
    const allCards = document.querySelectorAll('.mood-list-container .status-menu-card');
    allCards.forEach(card => card.style.borderColor = '#E6F2FA');
    const selectedCard = document.getElementById(`mood-${moodKey}`);
    if (selectedCard) selectedCard.style.borderColor = '#3182ce';

    updateRightDisplay(moodKey, `โหมดจำลองพฤติกรรม: ภาวะ${moodKey}`);
}

// ── ฟังก์ชันสลับกลับมาดู Real-time ──
function switchToRealtime() {
    isRealtimeMode = true;
    document.getElementById('btn-realtime').classList.add('active-realtime');
    const allCards = document.querySelectorAll('.mood-list-container .status-menu-card');
    allCards.forEach(card => card.style.borderColor = '#E6F2FA');
    updateRightDisplay(liveSalinityVal < 10.0 ? 'scared' : 'happy', `โหมด: Real-time ตรวจสอบฟาร์มจริง (${liveSalinityVal.toFixed(1)} ppt)`);
}

// ── ฟังก์ชันอัปเดตหน้าตา อารมณ์ สาเหตุ และวิธีแก้ไข ฝั่งขวา ──
function updateRightDisplay(moodKey, modeTitle) {
    const avatarBox = document.getElementById('pet-oyster-group');
    const badgeEl = document.getElementById('display-badge');
    const storyEl = document.getElementById('display-narrative');
    const titleEl = document.getElementById('view-mode-title');
    const causeEl = document.getElementById('display-cause');
    const solutionEl = document.getElementById('display-solution');

    if (!avatarBox || !badgeEl || !storyEl || !titleEl) return;

    const data = moodData[moodKey];
    if (!data) return;

    avatarBox.className = `oyster-avatar-box ${moodKey}`;

    badgeEl.innerText = data.text;
    badgeEl.className = `pet-status-badge ${data.class}`;
    storyEl.innerText = data.desc;
    titleEl.innerText = modeTitle;
    if (causeEl) causeEl.innerText = data.cause;
    if (solutionEl) solutionEl.innerText = data.solution;
}

// ── เอฟเฟกต์ฟองอากาศพื้นหลังพาสเทล ──
window.onload = function () {
    const bgContainer = document.getElementById('bubble-bg');
    if (bgContainer) {
        for (let i = 0; i < 15; i++) {
            let bubble = document.createElement('div');
            bubble.className = 'bubble';
            let size = Math.random() * 15 + 5;
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            bubble.style.left = `${Math.random() * 100}%`;
            bubble.style.animationDelay = `${Math.random() * 5}s`;
            bgContainer.appendChild(bubble);
        }
    }
    setTimeout(switchToRealtime, 500);
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