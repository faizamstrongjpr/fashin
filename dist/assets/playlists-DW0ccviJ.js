import{d as x,n as L,p as u,e as w,f as y,h as M,i as I,j as H}from"./index-DwLuqkeG.js";import{trackListItem as E,setupTrackListListeners as B}from"./home-BNI_u4O8.js";let v="my";async function f(t,l=null){l?l.includes("-")?z(t,l):P(t,l):T(t)}async function T(t){var e,s;t.innerHTML=`
        <div class="page-header">
            <h1>Koleksi Playlist</h1>
        </div>
        
        <div class="playlist-tabs">
            <button class="playlist-tab active" data-type="my">Pribadi</button>
            <button class="playlist-tab" data-type="curated">Rekomendasi</button>
        </div>
        
        <div id="playlist-content"></div>
    `;const l=t.querySelectorAll(".playlist-tab"),a=t.querySelector("#playlist-content");l.forEach(n=>{n.addEventListener("click",()=>{l.forEach(i=>i.classList.remove("active")),n.classList.add("active"),v=n.dataset.type,v==="my"?m(a):k(a)})}),v==="my"?m(a):((e=t.querySelector('.playlist-tab[data-type="curated"]'))==null||e.classList.add("active"),(s=t.querySelector('.playlist-tab[data-type="my"]'))==null||s.classList.remove("active"),k(a))}function m(t){var a;const l=M();t.innerHTML=`
    <div class="playlists-page animate-fade-in">
      <button class="create-playlist-btn" id="create-pl-btn">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        Buat Playlist Baru
      </button>

      <div class="batik-divider"></div>

      <div id="playlists-grid" class="cards-grid" style="grid-template-columns:1fr;">
        ${l.length?l.map(e=>`
          <div class="playlist-card" data-playlist-id="${e.id}">
            <div class="playlist-card-header">
              <div class="playlist-card-icon">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
              </div>
              <div>
                <div class="playlist-card-title">${e.name}</div>
                <div class="playlist-card-count">${e.tracks.length} lagu</div>
              </div>
            </div>
            <div class="playlist-card-actions">
              <button class="track-item-btn pl-play-btn" data-id="${e.id}" title="Play" style="opacity:1">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </button>
              <button class="track-item-btn pl-delete-btn" data-id="${e.id}" title="Delete" style="opacity:1">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
            </div>
          </div>
        `).join(""):`
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
            <h3>Belum ada playlist</h3>
            <p>Buat playlist pertamamu!</p>
          </div>
        `}
      </div>
    </div>
  `,(a=t.querySelector("#create-pl-btn"))==null||a.addEventListener("click",()=>{$()}),t.querySelectorAll(".playlist-card").forEach(e=>{e.addEventListener("click",s=>{s.target.closest(".pl-play-btn")||s.target.closest(".pl-delete-btn")||L(`playlists/${e.dataset.playlistId}`)})}),t.querySelectorAll(".pl-play-btn").forEach(e=>{e.addEventListener("click",s=>{s.stopPropagation();const n=x(e.dataset.id);n&&n.tracks.length?u.play(n.tracks[0],n.tracks,0):y("Playlist kosong")})}),t.querySelectorAll(".pl-delete-btn").forEach(e=>{e.addEventListener("click",s=>{s.stopPropagation(),confirm("Hapus playlist ini?")&&(I(e.dataset.id),m(t),y("Playlist dihapus"))})})}function z(t,l){var s,n;const a=x(l);if(!a){t.innerHTML='<div class="empty-state"><h3>Playlist tidak ditemukan</h3></div>';return}t.innerHTML=`
    <div class="playlist-detail-page animate-fade-in">
      <button class="section-link" id="back-to-playlists" style="margin-bottom:16px;display:inline-flex;align-items:center;gap:4px;">
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style="width:16px;height:16px"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        Kembali
      </button>

      <h1 style="margin-bottom:4px;">${a.name}</h1>
      <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:16px;">${a.tracks.length} lagu</p>

      ${a.tracks.length?`
        <div style="display:flex;gap:10px;margin-bottom:16px;">
          <button class="modal-btn modal-btn-confirm" id="pl-play-all" style="padding:10px 20px;font-size:0.85rem;">
            ▶ Putar Semua
          </button>
        </div>
        <div class="batik-divider"></div>
        <div id="pl-track-list">
          ${a.tracks.map((i,d)=>E(i,d)).join("")}
        </div>
      `:`
        <div class="empty-state">
          <h3>Playlist kosong</h3>
          <p>Cari lagu dan tambahkan ke playlist ini</p>
        </div>
      `}
    </div>
  `,(s=document.getElementById("back-to-playlists"))==null||s.addEventListener("click",()=>{L("playlists")}),(n=document.getElementById("pl-play-all"))==null||n.addEventListener("click",()=>{a.tracks.length&&u.play(a.tracks[0],a.tracks,0)});const e=document.getElementById("pl-track-list");e&&B(e,a.tracks)}function $(){const t=document.getElementById("playlist-modal"),l=document.getElementById("playlist-name-input"),a=document.getElementById("playlist-confirm"),e=document.getElementById("playlist-cancel");t.classList.remove("hidden"),l.value="",l.focus();const s=()=>{const c=l.value.trim();if(!c)return;H(c),t.classList.add("hidden"),y(`Playlist "${c}" dibuat!`);const p=document.getElementById("page-container").querySelector("#playlist-content");p&&v==="my"&&m(p),i()},n=()=>{t.classList.add("hidden"),i()},i=()=>{a.replaceWith(a.cloneNode(!0)),e.replaceWith(e.cloneNode(!0));const c=document.getElementById("playlist-confirm"),r=document.getElementById("playlist-cancel");c.addEventListener("click",s),r.addEventListener("click",n)};a.replaceWith(a.cloneNode(!0)),e.replaceWith(e.cloneNode(!0));const d=document.getElementById("playlist-confirm"),o=document.getElementById("playlist-cancel");d.addEventListener("click",s),o.addEventListener("click",n),l.onkeydown=c=>{c.key==="Enter"&&s()}}const q=[{title:"🔥 Indonesia Hype & Viral",queries:["Indonesia Top","Viral Indonesia","Top Hits Indonesia"]},{title:"😢 Galau & Sedih",queries:["Galau Indonesia","Lagu Sedih Indonesia","Patah Hati"]},{title:"⚡ Semangat Pagi",queries:["Mood Booster Indonesia","Semangat Pagi","Ceria Indonesia"]},{title:"🕰️ Throwback 2000an",queries:["Hits Indonesia 2000","Nostalgia Indonesia","Band Indonesia 2000"]},{title:"🎵 TikTok Viral",queries:["TikTok Indonesia","Lagu TikTok Viral","Jedag Jedug"]}];async function k(t){t.innerHTML=`
    <div class="loading-state" style="padding:40px;text-align:center;">
        <div class="spinner-ring" style="margin:0 auto 16px;"></div>
        <p>Memuat playlist Hype...</p>
    </div>
  `;try{const l=q.map(async e=>{const s=e.queries.map(d=>w(`/search/playlist?q=${encodeURIComponent(d)}&limit=4`)),n=await Promise.all(s);let i=[];return n.forEach(d=>{d.data&&i.push(...d.data)}),i=Array.from(new Map(i.map(d=>[d.id,d])).values()).slice(0,6),i.length===0?"":`
            <div class="playlist-category" style="margin-bottom: 32px;">
                <h3 style="margin: 0 0 16px; font-size: 1.1rem; color: var(--text-primary);">${e.title}</h3>
                <div class="cards-grid">
                    ${i.map(d=>`
                        <div class="playlist-card curated" data-playlist-id="${d.id}">
                            <div class="playlist-card-cover" style="background:url('${d.picture_big||d.picture_medium}') center/cover;aspect-ratio:1;border-radius:var(--radius-md);position:relative;overflow:hidden;">
                                <div class="playlist-play-overlay">
                                    <svg viewBox="0 0 24 24" fill="white" style="width:48px;height:48px;"><path d="M12 4.5C7.86 4.5 4.5 7.86 4.5 12s3.36 7.5 7.5 7.5 7.5-3.36 7.5-7.5-3.36-7.5-7.5-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm-1-8v6l5-3-5-3z"/></svg>
                                    <span style="color:white;font-weight:600;margin-top:8px;">Lihat</span>
                                </div>
                            </div>
                            <div style="padding:12px 0;">
                                <div class="playlist-card-title" style="font-weight:600;margin-bottom:4px;">${d.title}</div>
                                <div class="playlist-card-count" style="font-size:0.85rem;color:var(--text-secondary);">${d.nb_tracks} lagu</div>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
        `}),a=await Promise.all(l);t.innerHTML=a.join("")+`
        <style>
            .playlist-play-overlay {
                position: absolute;
                inset: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: 0.3s;
                backdrop-filter: blur(2px);
            }
            .playlist-card-cover:hover .playlist-play-overlay {
                opacity: 1 !important;
            }
        </style>
    `,t.querySelectorAll(".playlist-card.curated").forEach(e=>{e.addEventListener("click",()=>{P(document.getElementById("page-container"),e.dataset.playlistId)})})}catch(l){console.error("Failed to load curated playlists:",l),t.innerHTML='<div class="empty-state"><p>Gagal memuat playlist rekomendasi. Periksa koneksi.</p></div>'}}async function P(t,l){var a,e,s,n;t.innerHTML=`
        <div class="playlist-detail-page animate-fade-in">
            <button class="section-link" id="back-to-curated" style="margin-bottom:16px;display:inline-flex;align-items:center;gap:4px;">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                Kembali
            </button>
            
            <div class="loading-state" style="padding:40px;text-align:center;">
                <div class="spinner-ring" style="margin:0 auto 16px;"></div>
                <p>Memuat daftar lagu...</p>
            </div>
        </div>
    `,(a=document.getElementById("back-to-curated"))==null||a.addEventListener("click",()=>{f(t),setTimeout(()=>{const i=t.querySelector('.playlist-tab[data-type="curated"]');i&&i.click()},50)});try{const i=await w(`/playlist/${l}`),o=(((e=i.tracks)==null?void 0:e.data)||[]).map(r=>{var p,g,h,b;return{id:String(r.id),title:r.title_short||r.title,artist:((p=r.artist)==null?void 0:p.name)||"Unknown",album:((g=r.album)==null?void 0:g.title)||"",albumArt:((h=r.album)==null?void 0:h.cover_big)||((b=r.album)==null?void 0:b.cover_medium)||i.picture_big,duration:(r.duration||0)*1e3}});t.innerHTML=`
            <div class="playlist-detail-page animate-fade-in">
                <button class="section-link" id="back-to-curated-2" style="margin-bottom:16px;display:inline-flex;align-items:center;gap:4px;">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                    Kembali
                </button>

                <div class="playlist-header" style="display:flex;gap:24px;align-items:end;margin-bottom:24px;flex-wrap:wrap;">
                    <img src="${i.picture_medium||i.picture_big}" style="width:180px;height:180px;border-radius:var(--radius-lg);box-shadow:var(--shadow-xl);object-fit:cover;">
                    <div style="flex:1;">
                         <h2 style="margin-bottom:8px;font-size:2rem;line-height:1.2;">${i.title}</h2>
                         <p style="color:var(--text-secondary);margin-bottom:16px;">${i.nb_tracks} lagu • ${Math.floor(i.duration/60)} menit</p>
                         <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:16px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${i.description||""}</p>
                         
                         <button class="modal-btn modal-btn-confirm" id="pl-play-all" style="padding:12px 24px;font-size:1rem;">
                            ▶ Putar Playlist
                         </button>
                    </div>
                </div>

                <div class="batik-divider"></div>
                <div id="pl-track-list">
                  ${o.map((r,p)=>E(r,p)).join("")}
                </div>
            </div>
        `,(s=document.getElementById("back-to-curated-2"))==null||s.addEventListener("click",()=>{f(t),setTimeout(()=>{const r=t.querySelector('.playlist-tab[data-type="curated"]');r&&r.click()},50)}),(n=document.getElementById("pl-play-all"))==null||n.addEventListener("click",()=>{o.length&&(u.play(o[0],o,0),y("Memutar playlist..."))});const c=document.getElementById("pl-track-list");c&&B(c,o)}catch(i){console.error(i),y("Gagal memuat detail playlist"),t.innerHTML+='<div class="empty-state"><p>Gagal memuat detail.</p></div>'}}export{f as render};
