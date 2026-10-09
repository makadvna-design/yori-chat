import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 1. ТАНЗИМОТИ FIREBASE (МАЪЛУМОТИ ХУДРО ИНҶО ГУЗОРЕД)
// ==========================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "yori-app.firebaseapp.com",
  projectId: "yori-app",
  storageBucket: "yori-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Рақами телефони корбари ҷорӣ (аз LocalStorage мегирад ё пешфарз мегузорад)
let myPhone = localStorage.getItem("myPhone") || "+992900000000";
let activeChatPartner = null;

// ==========================================
// 2. ГУЗАРИШ БИНИ ТАБҲО (TAB NAVIGATION)
// ==========================================
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ==========================================
// 3. БОРГИРИ ВА САБТИ ПРОФИЛ
// ==========================================
async function loadProfile() {
  const profPhoneInput = document.getElementById("profPhone");
  if (profPhoneInput) profPhoneInput.value = myPhone;

  try {
    const snap = await getDoc(doc(db, "users", myPhone));
    if (snap.exists()) {
      const d = snap.data();
      if (document.getElementById("profName")) document.getElementById("profName").value = d.name || "";
      if (document.getElementById("profBio")) document.getElementById("profBio").value = d.bio || "";
      if (d.avatar && document.getElementById("myAvatar")) {
        document.getElementById("myAvatar").src = d.avatar;
      }
    }
  } catch (e) {
    console.error("Хатогӣ дар боргирии профил:", e);
  }
}

// Сабт кардани маълумоти профил
const saveProfBtn = document.getElementById("saveProfBtn");
if (saveProfBtn) {
  saveProfBtn.addEventListener("click", async () => {
    const name = document.getElementById("profName").value.trim();
    const bio = document.getElementById("profBio").value.trim();
    const avatar = document.getElementById("myAvatar").src;

    try {
      await setDoc(doc(db, "users", myPhone), {
        name: name,
        bio: bio,
        avatar: avatar,
        phone: myPhone,
        updatedAt: serverTimestamp()
      }, { merge: true });

      alert("Профил муваффақона сабт шуд!");
    } catch (e) {
      alert("Хатогӣ ҳангоми сабт: " + e.message);
    }
  });
}

// Тағйир додани аватари профил аз галерея
const avatarFile = document.getElementById("avatarFile");
if (avatarFile) {
  avatarFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById("myAvatar").src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}

// ==========================================
// 4. ҶУСТУҶӮ БО РАҚАМИ ТЕЛЕФОН ВА ЧАТИ МУСТАҚИМ
// ==========================================

// Функсияи кушодани чат бо рақам
window.startChatWithPhone = async function(phone) {
  if (!phone) return alert("Лутфан рақами телефонро ворид кунед!");

  activeChatPartner = phone;
  
  // Агар номи корбар дар база бошад, онро нишон медиҳад, вагарна худи рақамро
  const partnerNameEl = document.getElementById("chatPartnerName");
  if (partnerNameEl) partnerNameEl.textContent = phone;

  try {
    const snap = await getDoc(doc(db, "users", phone));
    if (snap.exists() && snap.data().name) {
      if (partnerNameEl) partnerNameEl.textContent = snap.data().name;
    }
  } catch (e) {
    console.log("Корбар ҳануз профил надорад.");
  }

  // Кушодани модали чат
  const chatModal = document.getElementById("chatModal");
  if (chatModal) chatModal.classList.add("open");

  // Идентификатори беназири суҳбати ду нафар (ID-и чат)
  const chatID = [myPhone, phone].sort().join("_");
  const q = query(collection(db, "chats", chatID, "messages"), orderBy("timestamp", "asc"));

  // Боргирии реалтими (Realtime) паёмҳо
  onSnapshot(q, (snapshot) => {
    const box = document.getElementById("messagesContainer");
    if (!box) return;
    box.innerHTML = "";

    snapshot.forEach(doc => {
      const m = doc.data();
      const div = document.createElement("div");
      div.style.alignSelf = m.sender === myPhone ? "flex-end" : "flex-start";
      div.style.background = m.sender === myPhone ? "#f43f5e" : "#1e293b";
      div.style.color = "#fff";
      div.style.padding = "10px 16px";
      div.style.borderRadius = "18px";
      div.style.maxWidth = "75%";
      div.style.marginBottom = "8px";
      div.textContent = m.text;
      box.appendChild(div);
    });
    
    // Автоматикӣ ба поёни чат скролл кардан
    box.scrollTop = box.scrollHeight;
  });
};

// Танзими тугмаи ҷустуҷӯ
const searchUserBtn = document.getElementById("searchUserBtn");
if (searchUserBtn) {
  searchUserBtn.addEventListener("click", () => {
    const phoneInput = document.getElementById("phoneSearchInput");
    const phone = phoneInput ? phoneInput.value.trim() : "";
    if (phone) {
      window.startChatWithPhone(phone);
    } else {
      alert("Рақамро нависед!");
    }
  });
}

// Ирсоли паём
const sendMsgBtn = document.getElementById("sendMsg");
if (sendMsgBtn) {
  sendMsgBtn.addEventListener("click", async () => {
    const input = document.getElementById("msgInput");
    const text = input ? input.value.trim() : "";

    if (!text || !activeChatPartner) return;

    const chatID = [myPhone, activeChatPartner].sort().join("_");
    
    try {
      await addDoc(collection(db, "chats", chatID, "messages"), {
        sender: myPhone,
        text: text,
        timestamp: serverTimestamp()
      });
      if (input) input.value = "";
    } catch (e) {
      alert("Хатогӣ ҳангоми ирсол: " + e.message);
    }
  });
}

// Пӯшидани равзанаи чат
const closeChatBtn = document.getElementById("closeChat");
if (closeChatBtn) {
  closeChatBtn.addEventListener("click", () => {
    const chatModal = document.getElementById("chatModal");
    if (chatModal) chatModal.classList.remove("open");
  });
}

// ==========================================
// 5. НАШРИ ПОСТҲО (FEED)
// ==========================================
const publishBtn = document.getElementById("publishBtn");
if (publishBtn) {
  publishBtn.addEventListener("click", async () => {
    const contentInput = document.getElementById("newPostContent");
    const text = contentInput ? contentInput.value.trim() : "";

    if (!text) return alert("Лутфан матн нависед!");

    try {
      await addDoc(collection(db, "posts"), {
        authorPhone: myPhone,
        text: text,
        timestamp: serverTimestamp()
      });

      if (contentInput) contentInput.value = "";
      alert("Паст муваффақона нашр шуд!");
      
      // Гузариш ба таби Лента
      const feedNavBtn = document.querySelector('[data-tab="feedTab"]');
      if (feedNavBtn) feedNavBtn.click();
    } catch (e) {
      alert("Хатогӣ ҳангоми нашри паст: " + e.message);
    }
  });
}

// Оғози кор ҳангоми кушодани сайт
loadProfile();
