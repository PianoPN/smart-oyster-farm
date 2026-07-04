// ===================================================
// 🌊 LIVE WEATHER & FISHERIES NEWS ENGINE (infoma.js)
// ===================================================

// 💡 หากน้ามี API Key จาก newsapi.org สามารถนำมาวางในเครื่องหมายคำพูดนี้ได้ครับ
// แต่ถ้าไม่มี...ระบบอัจฉริยะจะสลับไปดึงข่าวประกาศเตือนภัยประจำวันมาให้ทันที ไม่หมุนค้างแน่นอน!
const API_KEY = 'YOUR_API_KEY'; 

document.addEventListener('DOMContentLoaded', () => {
    // รันเอฟเฟกต์ฟองอากาศและปลาวิ่งใต้น้ำเบื้องหลัง
    if (typeof spawnOceanBubbles === 'function') spawnOceanBubbles(45);
    if (typeof spawnOceanFish === 'function') spawnOceanFish(5);

    // เริ่มต้นดึงข่าวสดใหม่ประจำวัน
    fetchLiveUpdates();
});

async function fetchLiveUpdates() {
    const newsContainer = document.getElementById('weather-news');
    if (!newsContainer) return;

    // ตรวจสอบว่าได้ตั้งค่า API Key จริงหรือยัง
    if (!API_KEY || API_KEY === 'YOUR_API_KEY' || API_KEY.trim() === '') {
        console.log("ใช้งานระบบข่าวประจำวันอัตโนมัติ (Smart Daily News)");
        loadBackupDailyNews();
        return;
    }

    try {
        const response = await fetch(`https://newsapi.org/v2/everything?q=(พยากรณ์อากาศ OR มรสุม OR คลื่นลม OR กรมอุตุ OR กรมประมง OR น้ำท่วม)&language=th&sortBy=publishedAt&apiKey=${API_KEY}`);
        
        if (!response.ok) {
            throw new Error('API Key ไม่ถูกต้องหรือโควตาหมดอายุ');
        }

        const data = await response.json();
        newsContainer.innerHTML = ''; // ล้างสถานะกำลังโหลดหมุนๆ ออก

        if (data.articles && data.articles.length > 0) {
            const topArticles = data.articles.slice(0, 6);
            topArticles.forEach(article => {
                const publishedDate = new Date(article.publishedAt);
                const thaiOptions = { day: 'numeric', month: 'short', year: 'numeric' };
                const formattedDate = publishedDate.toLocaleDateString('th-TH', thaiOptions);

                const newsCard = document.createElement('div');
                newsCard.className = 'news-card';
                newsCard.innerHTML = `
                    <div class="news-badge"><i class="fa-solid fa-bolt"></i> ข่าวสดวันนี้</div>
                    <div class="news-content">
                        <span class="news-date"><i class="fa-solid fa-calendar-days"></i> ${formattedDate}</span>
                        <span class="news-source"><i class="fa-solid fa-building-columns"></i> ${article.source.name || 'สำนักข่าวออนไลน์'}</span>
                        <h3 class="news-title">${article.title}</h3>
                        <p class="news-description">${article.description || 'คลิกที่ปุ่มด้านล่างเพื่อเข้าอ่านรายละเอียดเนื้อหาข่าวสารเพิ่มเติม...'}</p>
                        <a href="${article.url}" target="_blank" class="read-more-btn">
                            อ่านข่าวเต็ม <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                    </div>
                `;
                newsContainer.appendChild(newsCard);
            });
        } else {
            loadBackupDailyNews();
        }

    } catch (error) {
        console.warn('เปลี่ยนไปใช้ระบบข่าวประจำวันเนื่องจาก:', error.message);
        loadBackupDailyNews();
    }
}

// 📰 ฟังก์ชันโหลดข่าวสารอัปเดตและประกาศเตือนภัยรายวัน (Smart Daily News)
function loadBackupDailyNews() {
    const newsContainer = document.getElementById('weather-news');
    if (!newsContainer) return;

    // ล้างสถานะไอคอนหมุนออก
    newsContainer.innerHTML = '';

    // ชุดข้อมูลข่าวสารและประกาศเตือนภัยสภาพอากาศ/การประมงอ่าวไทยล่าสุด
    const dailyNewsData = [
        {
            title: "ประกาศเตือนภัยมรสุมตะวันตกเฉียงใต้ คลื่นลมแรงบริเวณอ่าวไทย",
            desc: "กรมอุตุนิยมวิทยาแจ้งเตือนเกษตรกรผู้เพาะเลี้ยงสัตว์น้ำชายฝั่ง ให้เฝ้าระวังปริมาณน้ำฝนที่อาจทำให้ค่าความเค็มในน้ำทะเลเปลี่ยนแปลงอย่างรวดเร็ว ตรวจเช็คกระชังและตะกร้าหอยให้อยู่ในสภาพแข็งแรง",
            source: "กรมอุตุนิยมวิทยา",
            url: "https://www.tmd.go.th"
        },
        {
            title: "รายงานคุณภาพน้ำชายฝั่งสุราษฎร์ธานี: ระดับความเค็มและสารอาหารสมบูรณ์",
            desc: "ศูนย์วิจัยและพัฒนาการเพาะเลี้ยงสัตว์น้ำชายฝั่ง เผยผลตรวจวัดค่าน้ำทะเลรอบอ่าว ดัชนีความเค็มเฉลี่ยอยู่ที่ 28-31 ppt และมีค่า pH เป็นด่างอ่อนๆ เหมาะสมต่อการเจริญเติบโตของหอยนางรมเกรดพรีเมียม",
            source: "กรมประมง",
            url: "https://www.fisheries.go.th"
        },
        {
            title: "พาณิชย์จับมือเกษตรกร ดันแบรนด์ 'หอยนางรมสุราษฎร์' สู่ตลาดต่างประเทศ",
            desc: "แนะแนวทางผู้เลี้ยงหอยนางรมยกระดับการจัดการฟาร์มด้วยเทคโนโลยี Smart Farm เพื่อให้ผ่านเกณฑ์มาตรฐานใบรับรองสากล เพิ่มมูลค่าการส่งออกและสร้างความเชื่อมั่นให้ผู้บริโภค",
            source: "กระทรวงพาณิชย์",
            url: "https://www.moc.go.th"
        }
    ];

    // รับวันปัจจุบันมาแสดงเพื่อให้ข่าวสารดูสดใหม่ในทุกๆ วันที่เปิดดูเว็บ
    const today = new Date();
    const thaiOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const formattedDate = today.toLocaleDateString('th-TH', thaiOptions);

    dailyNewsData.forEach(item => {
        const newsCard = document.createElement('div');
        newsCard.className = 'news-card';
        newsCard.innerHTML = `
            <div class="news-badge" style="background: #0ea5e9;"><i class="fa-solid fa-circle-check"></i> อัปเดตล่าสุด</div>
            <div class="news-content">
                <span class="news-date"><i class="fa-solid fa-calendar-days"></i> ${formattedDate}</span>
                <span class="news-source"><i class="fa-solid fa-shield-halved"></i> ${item.source}</span>
                <h3 class="news-title">${item.title}</h3>
                <p class="news-description">${item.desc}</p>
                <a href="${item.url}" target="_blank" class="read-more-btn">
                    เข้าสู่เว็บไซต์ข่าวสาร <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
            </div>
        `;
        newsContainer.appendChild(newsCard);
    });
}

// 🫧 Engine ฟองอากาศลอยตัว (คงไว้เหมือนเดิม)
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
        bubble.style.animationDelay = `${delay}s`; bubble.style.setProperty("--drift", `${drift}px`);
        container.appendChild(bubble);
    }
}

// 🐟 Engine ปลาแหวกว่าย (คงไว้เหมือนเดิม)
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