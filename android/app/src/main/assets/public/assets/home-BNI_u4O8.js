import{p as d,t as p,f as h,k,l as u,m as y,o,q as f,s as l,u as b,v as E}from"./index-DwLuqkeG.js";const $=[{id:"pop",name:"Pop"},{id:"rock",name:"Rock"},{id:"hip-hop",name:"Hip Hop"},{id:"electronic",name:"Elektronik"},{id:"r-n-b",name:"R&B"},{id:"jazz",name:"Jazz"},{id:"classical",name:"Klasik"},{id:"indie",name:"Indie"},{id:"reggae",name:"Reggae"}];async function z(e){const a=new Date().getHours();let t="Selamat Malam";a<12?t="Selamat Pagi":a<15?t="Selamat Siang":a<18&&(t="Selamat Sore");const r=`${t} bbyy... 👋`;e.innerHTML=`
    <div class="home-page animate-fade-in">
      <!-- Hero Banner -->
      <div class="hero-banner hero-batik-bg batik-highlight">
        <div class="hero-content">
          <p class="hero-greeting">${r}</p>
          <h1 class="hero-title">FASHIN Play<br><span style="font-size:0.6em;font-weight:600;color:var(--text-primary)">FAIZ <span style="color:red">❤️</span> SHINTA</span></h1>
          <p class="hero-subtitle">Dengarkan musik favoritmu tanpa batas</p>
        </div>
      </div>

      <!-- Recently Played -->
      <div id="recent-section" class="section" style="display:none">
        <div class="section-header">
          <h2 class="section-title"><span class="batik-dot"></span> Baru Diputar</h2>
        </div>
        <div class="cards-scroll" id="recent-cards"></div>
      </div>

      <!-- Genres -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title"><span class="batik-dot"></span> Jelajahi Genre</h2>
        </div>
        <div class="cards-scroll" id="genre-cards">
          ${$.map(i=>`
            <div class="genre-card genre-card-batik" data-genre="${i.id}">
              ${i.name}
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Recommendations -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title"><span class="batik-dot"></span> Rekomendasi Untukmu</h2>
        </div>
        <div class="cards-scroll" id="recommend-cards">
          ${L(6)}
        </div>
      </div>

      <!-- Genre Tracks (shown when genre clicked) -->
      <div id="genre-tracks-section" class="section" style="display:none">
        <div class="section-header">
          <h2 class="section-title" id="genre-tracks-title"></h2>
        </div>
        <div id="genre-tracks-list"></div>
      </div>
    </div>
  `,T(),I(),e.querySelectorAll(".genre-card").forEach(i=>{i.addEventListener("click",()=>A(i.dataset.genre,i.textContent.trim()))})}function L(e){return Array(e).fill('<div class="skeleton skeleton-card"></div>').join("")}function T(){const e=o();e.length&&(document.getElementById("recent-section").style.display="",document.getElementById("recent-cards").innerHTML=e.slice(0,10).map(a=>m(a)).join(""),v(document.getElementById("recent-cards"),e.slice(0,10)))}async function I(){try{const e=document.getElementById("recommend-cards");if(!e)return;const a=o();let t=[],r="Rekomendasi Untukmu";if(a.length>0){const s=a[0];if(s.artistId)try{const c=await f(s.artistId);c.length>0&&(t=c,r=`Karena kamu mendengar ${s.artist}`)}catch(c){console.warn("Artist recs failed",c)}if(t.length===0){const c=await l(s.artist,10);c.length>0&&(t=c,r=`Mirip dengan ${s.artist}`)}}if(t.length<5){const s=await b();t=[...t,...s],t.length===s.length&&(r="Lagu Trending Saat Ini")}const i=Array.from(new Map(t.map(s=>[s.id,s])).values()).slice(0,15),n=e.parentElement.querySelector(".section-title");n&&(n.innerHTML=`<span class="batik-dot"></span> ${r}`),e.innerHTML=i.map(s=>m(s)).join(""),v(e,i)}catch(e){console.error("Failed to load recommendations:",e);const a=document.getElementById("recommend-cards");a&&(a.innerHTML='<p style="color:var(--text-secondary);font-size:0.85rem;padding:20px;">Gagal memuat rekomendasi. Periksa koneksi internet.</p>')}}const w={pop:132,rock:152,"hip-hop":116,electronic:113,"r-n-b":165,jazz:129,classical:98,reggae:144,indie:null};async function A(e,a){const t=document.getElementById("genre-tracks-section"),r=document.getElementById("genre-tracks-title"),i=document.getElementById("genre-tracks-list");t.style.display="",r.innerHTML=`<span class="batik-dot"></span> ${a}`,i.innerHTML=Array(5).fill('<div class="skeleton skeleton-item"></div>').join(""),t.scrollIntoView({behavior:"smooth"});try{let n=[];const s=w[e];if(s?n=await E(s,20):(n=await l(`genre:"${a}"`,20),n.length===0&&(n=await l(a,20))),n.length===0)throw new Error("No tracks found");i.innerHTML=n.map((c,g)=>H(c,g)).join(""),M(i,n)}catch(n){console.error(n),i.innerHTML='<p style="color:var(--text-secondary);padding:20px;">Gagal memuat lagu genre ini</p>'}}function m(e){return`
    <div class="track-card" data-track-id="${e.id}">
      <div class="track-card-img">
        <img src="${e.albumArt||e.albumArtSmall||""}" alt="${e.title}" loading="lazy"
          onerror="this.parentElement.style.background='var(--gradient-primary)'">
        <button class="track-card-play">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
      <div class="track-card-title" title="${e.title}">${e.title}</div>
      <div class="track-card-artist">${e.artist}</div>
    </div>
  `}function H(e,a){const t=u(e.id);return`
    <div class="track-item" data-track-id="${e.id}" data-index="${a}">
      <span class="track-item-num">${a+1}</span>
      <div class="track-item-img">
        <img src="${e.albumArtSmall||e.albumArt||""}" alt="" loading="lazy"
          onerror="this.parentElement.style.background='var(--gradient-primary)'">
      </div>
      <div class="track-item-info">
        <div class="track-item-title">${e.title}</div>
        <div class="track-item-artist">${e.artist}</div>
      </div>
      <span class="track-item-duration">${y(e.duration)}</span>
      <div class="track-item-actions">
        <button class="track-item-btn like-btn ${t?"liked":""}" data-track-id="${e.id}" title="Like">
          <svg viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z"/></svg>
        </button>
        <button class="track-item-btn add-to-pl-btn" data-track-id="${e.id}" title="Add to Playlist">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/></svg>
        </button>
      </div>
    </div>
  `}function v(e,a){e.querySelectorAll(".track-card").forEach(t=>{t.addEventListener("click",()=>{const r=t.dataset.trackId,i=a.find(n=>n.id===r);i&&d.play(i,a)})})}function M(e,a){e.querySelectorAll(".track-item").forEach(t=>{t.addEventListener("click",r=>{if(r.target.closest(".track-item-btn"))return;const i=parseInt(t.dataset.index);d.play(a[i],a,i)})}),e.querySelectorAll(".like-btn").forEach(t=>{t.addEventListener("click",r=>{r.stopPropagation();const i=t.dataset.trackId,n=a.find(s=>s.id===i);if(n){const s=p(n);t.classList.toggle("liked",s),h(s?"❤️ Ditambahkan ke Favorites":"Dihapus dari Favorites")}})}),e.querySelectorAll(".add-to-pl-btn").forEach(t=>{t.addEventListener("click",r=>{r.stopPropagation();const i=t.dataset.trackId,n=a.find(s=>s.id===i);n&&k(n)})})}export{z as render,v as setupTrackCardListeners,M as setupTrackListListeners,m as trackCard,H as trackListItem};
