import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBD8wPkiO3FN3r6RIUTII5LAXbz2sCPSFc",
  authDomain: "social-chat-395a7.firebaseapp.com",
  projectId: "social-chat-395a7",
  storageBucket: "social-chat-395a7.firebasestorage.app",
  messagingSenderId: "557779904939",
  appId: "1:557779904939:web:54e7ac9367c19a7de58aee",
  measurementId: "G-KLCJ97KF5T"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let myPhone = localStorage.getItem("myPhone") || "+992900000000";
let activeChatPartner = null;

// Switch Tabs
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// Profile Management
async function loadProfile() {
  document.getElementById("profPhone").value = myPhone;
  const snap = await getDoc(doc(db, "users", myPhone));
  if (snap.exists()) {
    const d = snap.data();
    document.getElementById("profName").value = d.name || "";
    document.getElementById("profBio").value = d.bio || "";
    if (d.avatar) document.getElementById("myAvatar").src = d.avatar;
  }
}

document.getElementById("saveProfBtn").addEventListener("click", async () => {
  await setDoc(doc(db, "users", myPhone), {
    name: document.getElementById("profName").value,
    bio: document.getElementById("profBio").value,
    avatar: document.getElementById("myAvatar").src,
    phone: myPhone
  }, { merge: true });
  alert("Профил нав шуд!");
});

// Search User & Direct Messaging
document.getElementById("searchUserBtn").addEventListener("click", async () => {
  const phone = document.getElementById("phoneSearchInput").value.trim();
  if(!phone) return;
  
  const snap = await getDoc(doc(db, "users", phone));
  if (snap.exists()) {
    openChat(phone, snap.data().name || phone);
  } else {
    alert("Корбар бо ин рақам ёфт нашуд!");
  }
});

function openChat(partnerPhone, partnerName) {
  activeChatPartner = partnerPhone;
  document.getElementById("chatPartnerName").textContent = partnerName;
  document.getElementById("chatModal").classList.add("open");

  const chatID = [myPhone, partnerPhone].sort().join("_");
  const q = query(collection(db, "chats", chatID, "messages"), orderBy("timestamp", "asc"));

  onSnapshot(q, (snapshot) => {
    const box = document.getElementById("messagesContainer");
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
      div.textContent = m.text;
      box.appendChild(div);
    });
  });
}

document.getElementById("sendMsg").addEventListener("click", async () => {
  const input = document.getElementById("msgInput");
  if (!input.value.trim() || !activeChatPartner) return;

  const chatID = [myPhone, activeChatPartner].sort().join("_");
  await addDoc(collection(db, "chats", chatID, "messages"), {
    sender: myPhone,
    text: input.value,
    timestamp: serverTimestamp()
  });
  input.value = "";
});

document.getElementById("closeChat").addEventListener("click", () => {
  document.getElementById("chatModal").classList.remove("open");
});

loadProfile();
