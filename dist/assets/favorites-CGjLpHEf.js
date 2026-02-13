import{b as d,p as n}from"./index-DwLuqkeG.js";import{trackListItem as r,setupTrackListListeners as m}from"./home-BNI_u4O8.js";async function f(s){var i,l;const t=d();if(s.innerHTML=`
    <div class="favorites-page animate-fade-in">
      <div class="favorites-header" style="margin-bottom:24px;">
        <h1>❤️ Lagu Favorit</h1>
        <p style="color:var(--text-secondary);font-size:0.85rem;margin-top:4px;">
          ${t.length} lagu
        </p>
      </div>

      ${t.length>0?`
        <div style="display:flex;gap:10px;margin-bottom:20px;">
          <button class="modal-btn modal-btn-confirm" id="fav-play-all" style="padding:10px 20px;font-size:0.85rem;">
            ▶ Putar Semua
          </button>
          <button class="modal-btn modal-btn-cancel" id="fav-shuffle" style="padding:10px 20px;font-size:0.85rem;">
            🔀 Acak
          </button>
        </div>
        <div class="batik-divider"></div>
        <div id="favorites-list">
          ${t.map((a,o)=>r(a,o)).join("")}
        </div>
      `:`
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z"/></svg>
          <h3>Belum ada favorit</h3>
          <p>Klik ❤️ pada lagu untuk menambahkan ke favorit</p>
        </div>
      `}
    </div>
  `,!t.length)return;(i=document.getElementById("fav-play-all"))==null||i.addEventListener("click",()=>{t.length&&n.play(t[0],t,0)}),(l=document.getElementById("fav-shuffle"))==null||l.addEventListener("click",()=>{const a=[...t].sort(()=>Math.random()-.5);n.play(a[0],a,0)});const e=document.getElementById("favorites-list");e&&m(e,t)}export{f as render};
