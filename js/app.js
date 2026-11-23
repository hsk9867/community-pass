/* 고객 화면 — body[data-page] 로 페이지를 구분해 그립니다. */
(function () {
  var C = CP.content(), S = C.site, $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var won = function (n) { return Number(n || 0).toLocaleString('ko-KR') + '원'; };
  var q = function (k) { return new URLSearchParams(location.search).get(k) || ''; };
  var cat = function (id) { return C.cats.filter(function (c) { return c.id === id; })[0]; };
  var item = function (id) { return C.items.filter(function (i) { return i.id === id; })[0]; };
  var shown = function () { return C.items.filter(function (i) { return i.visible !== false; }); };
  var pct = function (i) { return i.listPrice > i.price ? Math.round((1 - i.price / i.listPrice) * 100) : 0; };
  function toast(m) { var t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600); }

  /* 선으로 그린 그림 (시설 사진을 받기 전 자리 표시) */
  var IC = {
    gym: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 24v16M17 19v26M47 19v26M54 24v16M17 32h30M5 32h5M54 32h5"/></svg>',
    study: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M32 18c-6-4-13-5-22-4v32c9-1 16 0 22 4 6-4 13-5 22-4V14c-9-1-16 0-22 4zM32 18v32"/></svg>',
    golf: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M26 52V10l20 8-20 9"/><ellipse cx="30" cy="53" rx="18" ry="4"/><circle cx="43" cy="44" r="2.6" fill="currentColor"/></svg>',
    locker: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><rect x="13" y="9" width="38" height="46" rx="4"/><path d="M32 9v46M21 17h5M21 22h5M38 17h5M38 22h5M26 34v5M38 34v5"/></svg>',
    sky: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 54h48M14 54V22l14-8v40M28 54V28l18-6v32M19 28v3M19 36v3M19 44v3M34 34v3M34 42v3M40 32v3M40 40v3"/></svg>',
    list: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="10" width="36" height="46" rx="4"/><path d="M23 23h18M23 33h18M23 43h10"/></svg>'
  };
  function art(kind, photo) { return photo ? '<div class="art" style="background-image:url(\'' + esc(photo) + '\')"></div>' : '<div class="art ' + kind + '">' + (IC[kind] || '') + '</div>'; }
  function tags(i) { var p = pct(i); return '<div class="tags">' + (i.soldout ? '<span class="badge out">마감</span>' : '') + (p ? '<span class="badge sale">' + p + '%</span>' : '') + '</div>'; }
  function priceHtml(i) { var p = pct(i); return '<div class="pr num">' + (p ? '<em>' + p + '%</em>' : '') + won(i.price) + (p ? '<del>' + won(i.listPrice) + '</del>' : '') + '</div>'; }
  function card(i, row) {
    var c = cat(i.cat) || {};
    return '<a class="card' + (row ? ' row' : '') + '" href="item.html?id=' + encodeURIComponent(i.id) + '"><div class="ph">' + art(i.cat, i.photo) + tags(i) + (i.soldout ? '<div class="dim"></div>' : '') + '</div>' +
      '<div><div class="meta">' + esc(c.short || '') + ' · ' + esc(i.sum || '') + '</div><h3>' + esc(i.name) + '</h3>' + priceHtml(i) + '</div>' + (row ? '<span class="go">›</span>' : '') + '</a>';
  }

  /* 공통 머리·바닥 */
  function shell(active) {
    var nav = C.cats.map(function (c) { return '<a href="list.html?cat=' + c.id + '"' + (active === c.id ? ' class="on"' : '') + '>' + esc(c.name) + '</a>'; }).join('');
    var h = document.createElement('header'); h.className = 'hd';
    h.innerHTML = '<div class="wrap"><a class="logo" href="index.html"><i>C</i>' + esc(S.name) + '</a><nav class="gnb">' + nav + '</nav>' +
      '<div class="r"><a class="pill keep" href="orders.html">신청내역 조회</a><button class="menu-btn" id="mbtn" aria-label="메뉴"><span></span></button></div></div>';
    var d = document.createElement('div'); d.className = 'drawer'; d.id = 'drawer';
    d.innerHTML = nav + '<a href="orders.html">신청내역 조회</a><a href="index.html#guide">이용 안내</a>';
    document.body.prepend(d); document.body.prepend(h);
    $('mbtn').onclick = function () { d.classList.toggle('on'); };
    var f = document.createElement('footer'); f.className = 'ft';
    f.innerHTML = '<div class="wrap"><div class="links"><a href="index.html#guide">이용 안내</a><a href="index.html#faq">자주 묻는 질문</a><a href="orders.html">신청내역 조회</a><a href="admin.html">관리자</a></div>' +
      '<p><b>' + esc(S.name) + '</b>' + (S.phone ? ' · 문의 ' + esc(S.phone) : '') + '</p>' + (S.bizInfo ? '<p>' + esc(S.bizInfo) + '</p>' : '') + '<p>© ' + new Date().getFullYear() + ' ' + esc(S.name) + '</p></div>';
    document.body.appendChild(f);
    var fab = document.createElement('div'); fab.className = 'fab';
    fab.innerHTML = '<a class="a1" href="list.html"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M9 15l2 2 4-4"/></svg>이용권 신청</a>' +
      '<a class="a2" href="orders.html"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/></svg>신청 조회</a>';
    document.body.appendChild(fab);
    document.title = (document.title ? document.title + ' | ' : '') + S.name;
  }

  var P = {};

  /* ---------- 첫 화면 ---------- */
  P.home = function (el) {
    shell('');
    var items = shown();
    var slides = [
      ['sky', S.tagline, S.name + '\n이용권 신청', S.openNote, 'list.html', '이용권 보러 가기'],
      ['gym', '이번 달도 꾸준하게', '헬스장 이용권\n신청 받습니다', '운영 시간 안에서 횟수 제한 없이 이용', 'list.html?cat=gym', '헬스장 이용권'],
      ['golf', '타석에서 가볍게', '골프연습장·라커\n함께 신청하세요', '라커는 골프연습장 이용 회원에게 배정', 'list.html?cat=golf', '골프연습장 이용권']
    ];
    var quick = C.cats.map(function (c) { return [c.desc.split(' ').slice(0, 2).join(' '), c.name, 'list.html?cat=' + c.id, c.id]; })
      .concat([['신청한 이용권 확인', '신청내역 조회', 'orders.html', 'list'], ['처음이신가요', '이용 안내', '#guide', 'sky']]);
    el.innerHTML = '<div class="wrap"><div class="top"><div class="hero" id="hero">' +
      slides.map(function (s, i) { return '<div class="slide' + (i ? '' : ' on') + '">' + art(s[0]) + '<div class="tx"' + (s[0] === 'gym' ? ' style="color:#fff"' : '') + '><small>' + esc(s[1]) + '</small><h1>' + esc(s[2]).replace(/\n/g, '<br>') + '</h1><p>' + esc(s[3]) + '</p><a class="btn ' + (s[0] === 'gym' ? '' : 'dark') + '" href="' + s[4] + '">' + esc(s[5]) + ' →</a></div></div>'; }).join('') +
      '<div class="nav"><button id="hp" aria-label="이전">‹</button><span class="num" id="hn">01 / 0' + slides.length + '</span><button id="hx" aria-label="다음">›</button></div></div>' +
      '<div class="qgrid">' + quick.map(function (k) { return '<a class="qcard" href="' + k[2] + '"><small>' + esc(k[0]) + '</small><b>' + esc(k[1]) + '</b><div class="cir">' + art(k[3]) + '</div></a>'; }).join('') + '</div></div>' +

      '<section class="sec"><div class="sec-h"><div><h2>이용권, 지금 바로 신청하세요</h2><p>' + esc(S.openNote) + '</p></div><a class="pill" href="list.html">전체 보기 ›</a></div>' +
      '<div class="grid">' + items.slice(0, 8).map(function (i) { return card(i); }).join('') + '</div></section>' +

      '<div class="strip"><div><b>신청한 이용권,<br>이름과 연락처로 바로 확인하세요</b><p>확정 여부 확인과 취소 요청을 한곳에서 할 수 있습니다.</p></div><a class="btn dark" href="orders.html">신청내역 조회</a></div>' +

      '<section class="sec" id="guide"><div class="sec-h"><div><h2>이용 안내</h2><p>신청부터 이용까지 네 단계면 됩니다.</p></div></div>' +
      '<ol class="steps"><li><b>이용권 고르기</b><p>이용할 시설과 달을 고릅니다.</p></li><li><b>신청서 작성</b><p>이용자 이름, 동·호수, 연락처를 적습니다.</p></li><li><b>관리자 확인</b><p>확인이 끝나면 상태가 "확정"으로 바뀝니다.</p></li><li><b>시설 이용</b><p>첫 방문 때 출입 등록 후 이용합니다.</p></li></ol>' +
      '<div class="talls" style="margin-top:20px">' + C.cats.map(function (c) { return '<a class="tall" href="list.html?cat=' + c.id + '">' + art(c.id) + '<div class="tx"><small>' + esc(c.short) + '</small><b>' + esc(c.desc) + '</b></div></a>'; }).join('') + '</div></section>' +

      '<section class="sec" id="faq"><div class="sec-h"><div><h2>자주 묻는 질문</h2></div></div><div class="faq">' + C.faqs.map(function (f) { return '<details><summary>' + esc(f.q) + '</summary><div class="a">' + esc(f.a) + '</div></details>'; }).join('') + '</div></section></div>';
    var cur = 0, sl = el.querySelectorAll('.slide'), go = function (n) { cur = (n + sl.length) % sl.length; sl.forEach(function (s, i) { s.classList.toggle('on', i === cur); }); $('hn').textContent = '0' + (cur + 1) + ' / 0' + sl.length; };
    var timer = setInterval(function () { go(cur + 1); }, 5500), stop = function () { clearInterval(timer); };
    $('hp').onclick = function () { stop(); go(cur - 1); }; $('hx').onclick = function () { stop(); go(cur + 1); };
  };

  /* ---------- 이용권 목록 ---------- */
  P.list = function (el) {
    var cid = q('cat'), c = cat(cid); shell(cid);
    var view = 'grid'; try { view = localStorage.getItem('cp_view') || 'grid'; } catch (e) {}
    document.title = (c ? c.name : '전체 이용권') + ' | ' + S.name;
    el.innerHTML = '<div class="wrap"><div class="page-h"><h1>' + esc(c ? c.name : '전체 이용권') + '</h1><p>' + esc(c ? c.desc : '시설별 이용권을 한눈에 보고 신청하세요.') + '</p></div>' +
      '<div class="tabs"><a class="tab' + (c ? '' : ' on') + '" href="list.html">전체<small>' + shown().length + '</small></a>' + C.cats.map(function (k) { return '<a class="tab' + (k.id === cid ? ' on' : '') + '" href="list.html?cat=' + k.id + '">' + esc(k.short) + '<small>' + shown().filter(function (i) { return i.cat === k.id; }).length + '</small></a>'; }).join('') + '</div>' +
      '<div class="tools"><span id="cnt"></span><select id="sort"><option value="">기본순</option><option value="low">낮은 가격순</option><option value="high">높은 가격순</option><option value="name">이름순</option></select>' +
      '<div class="vt"><button id="v-grid" aria-label="갤러리로 보기"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg></button><button id="v-row" aria-label="목록으로 보기"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="3" rx="1"/><rect x="1" y="6.5" width="14" height="3" rx="1"/><rect x="1" y="11" width="14" height="3" rx="1"/></svg></button></div></div><div id="out"></div></div>';
    function draw() {
      var l = shown().filter(function (i) { return !c || i.cat === cid; }), s = $('sort').value;
      if (s === 'low') l.sort(function (a, b) { return a.price - b.price; }); if (s === 'high') l.sort(function (a, b) { return b.price - a.price; }); if (s === 'name') l.sort(function (a, b) { return a.name.localeCompare(b.name, 'ko'); });
      $('cnt').textContent = '이용권 ' + l.length + '개';
      $('v-grid').classList.toggle('on', view === 'grid'); $('v-row').classList.toggle('on', view === 'row');
      $('out').innerHTML = l.length ? (view === 'row' ? '<div class="list-rows">' + l.map(function (i) { return card(i, true); }).join('') + '</div>' : '<div class="grid">' + l.map(function (i) { return card(i); }).join('') + '</div>') : '<div class="empty">지금 신청할 수 있는 이용권이 없습니다.</div>';
    }
    $('sort').onchange = draw;
    $('v-grid').onclick = function () { view = 'grid'; try { localStorage.setItem('cp_view', view); } catch (e) {} draw(); };
    $('v-row').onclick = function () { view = 'row'; try { localStorage.setItem('cp_view', view); } catch (e) {} draw(); };
    draw();
  };

  /* ---------- 이용권 상세 ---------- */
  P.item = function (el) {
    var i = item(q('id')); shell(i ? i.cat : '');
    if (!i || i.visible === false) { el.innerHTML = '<div class="wrap"><div class="empty" style="margin-top:40px">이용권을 찾을 수 없습니다. <a href="list.html" style="text-decoration:underline">전체 이용권 보기</a></div></div>'; return; }
    var c = cat(i.cat) || {}, p = pct(i), max = Math.max(1, +i.max || 1), n = 1;
    document.title = i.name + ' | ' + S.name; document.body.classList.add('has-bar');
    var others = shown().filter(function (x) { return x.cat === i.cat && x.id !== i.id; }).slice(0, 4);
    el.innerHTML = '<div class="wrap"><div class="crumb"><a href="index.html">홈</a> › <a href="list.html?cat=' + i.cat + '">' + esc(c.name || '') + '</a></div>' +
      '<div class="detail"><div class="ph">' + art(i.cat, i.photo) + tags(i) + '</div><div class="buy"><span class="chip">' + esc(c.short || '') + '</span><h1>' + esc(i.name) + '</h1><p class="sum">' + esc(i.sum || '') + '</p>' +
      '<div class="price num">' + (p ? '<em>' + p + '%</em>' : '') + won(i.price) + (p ? '<del>' + won(i.listPrice) + '</del>' : '') + '</div>' +
      '<dl class="kv"><div><dt>이용기간</dt><dd>' + esc(i.period || '-') + '</dd></div><div><dt>신청 수량</dt><dd>한 분당 최대 ' + max + '장</dd></div><div><dt>요금 납부</dt><dd>신청 확정 뒤 안내 (온라인 결제 없음)</dd></div>' +
      (max > 1 ? '<div><dt>수량</dt><dd><span class="qty"><button id="qm" aria-label="줄이기">−</button><span class="num" id="qn">1</span><button id="qp" aria-label="늘리기">＋</button></span></dd></div>' : '') + '</dl>' +
      '<div class="total"><span>신청 금액</span><b class="num" id="tot">' + won(i.price) + '</b></div>' +
      '<div class="buy-bar"><button class="btn dark full" id="go"' + (i.soldout ? ' disabled' : '') + '>' + (i.soldout ? '신청이 마감되었습니다' : '신청하기') + '</button></div></div></div>' +
      '<nav class="dtabs"><a href="#d1" class="on">내용</a><a href="#d2">비용</a><a href="#d3">신청 시 주의사항</a><a href="#d4">취소 안내</a></nav>' +
      '<section class="dsec" id="d1"><h2>이용권 안내</h2><div class="tx">' + esc(i.desc || '') + '</div></section>' +
      '<section class="dsec" id="d2"><h2>비용</h2><div class="note">' + esc(i.name) + ' — <b class="num">' + won(i.price) + '</b>' + (p ? ' (정가 ' + won(i.listPrice) + ', ' + p + '% 할인)' : '') + '<br>이 사이트에서는 결제하지 않으며, 신청이 확정되면 납부 방법을 안내해 드립니다.</div></section>' +
      '<section class="dsec" id="d3"><h2>신청 시 주의사항</h2><ul>' + C.notice.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></section>' +
      '<section class="dsec" id="d4"><h2>취소 안내</h2><ul>' + C.refund.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></section>' +
      (others.length ? '<section class="sec"><div class="sec-h"><div><h2>같은 시설의 다른 이용권</h2></div></div><div class="grid">' + others.map(function (x) { return card(x); }).join('') + '</div></section>' : '') + '</div>';
    var upd = function () { if ($('qn')) $('qn').textContent = n; $('tot').textContent = won(i.price * n); };
    if ($('qm')) { $('qm').onclick = function () { n = Math.max(1, n - 1); upd(); }; $('qp').onclick = function () { if (n >= max) toast('한 분당 최대 ' + max + '장까지 신청할 수 있습니다.'); n = Math.min(max, n + 1); upd(); }; }
    $('go').onclick = function () { location.href = 'apply.html?id=' + encodeURIComponent(i.id) + '&qty=' + n; };
    var tabs = el.querySelectorAll('.dtabs a');
    tabs.forEach(function (a) { a.onclick = function () { tabs.forEach(function (t) { t.classList.toggle('on', t === a); }); }; });
  };

  /* ---------- 신청서 ---------- */
  P.apply = function (el) {
    var i = item(q('id')); shell(i ? i.cat : '');
    if (!i || i.visible === false || i.soldout) { el.innerHTML = '<div class="wrap"><div class="empty" style="margin-top:40px">신청할 수 없는 이용권입니다. <a href="list.html" style="text-decoration:underline">전체 이용권 보기</a></div></div>'; return; }
    var n = Math.min(Math.max(1, +q('qty') || 1), Math.max(1, +i.max || 1)), c = cat(i.cat) || {};
    document.title = '이용권 신청 | ' + S.name;
    el.innerHTML = '<div class="wrap"><form class="form-wrap" id="af" novalidate><div class="page-h" style="padding-top:0"><h1>이용권 신청</h1><p>아래 내용을 적어 주시면 관리자가 확인한 뒤 확정해 드립니다.</p></div>' +
      '<div class="box" style="margin-top:18px"><h2>신청 이용권</h2><div class="sum-item"><div class="ph">' + art(i.cat, i.photo) + '</div><div><b>' + esc(i.name) + '</b><br><small style="color:var(--ink3)">' + esc(i.period || '') + ' · ' + n + '장</small><div class="num" style="font-weight:800;font-size:18px;margin-top:4px">' + won(i.price * n) + '</div></div></div></div>' +
      '<div class="box"><h2>이용자 정보</h2>' +
      '<div class="f"><label>이용자 이름 <i>*</i></label><input name="name" autocomplete="name" placeholder="실제 이용하실 분 이름" maxlength="20"></div>' +
      '<div class="row2"><div class="f"><label>동 <i>*</i></label><input name="dong" inputmode="numeric" placeholder="예: 101" maxlength="6"></div><div class="f"><label>호 <i>*</i></label><input name="ho" inputmode="numeric" placeholder="예: 1203" maxlength="6"></div></div>' +
      '<div class="f"><label>연락처 <i>*</i></label><input name="phone" inputmode="tel" autocomplete="tel" placeholder="010-0000-0000" maxlength="13"><small>신청내역 조회와 확정 안내에 사용합니다.</small></div>' +
      '<div class="f"><label>생년월일</label><input name="birth" inputmode="numeric" placeholder="예: 19800101 (할인 이용권은 꼭 적어 주십시오)" maxlength="8"></div>' +
      '<div class="f"><label>남기실 말씀</label><textarea name="memo" maxlength="300" placeholder="요청 사항이 있으면 적어 주십시오."></textarea></div></div>' +
      '<div class="box"><h2>확인 사항</h2><ul style="padding-left:18px;color:var(--ink2);font-size:14px;display:grid;gap:5px;margin-bottom:14px">' + C.notice.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '<label class="agree"><input type="checkbox" name="a1"><span>위 주의사항과 취소 안내를 확인했습니다. <b>(필수)</b></span></label>' +
      '<label class="agree"><input type="checkbox" name="a2"><span>이용권 신청·확인을 위해 이름, 동·호수, 연락처, 생년월일을 수집·이용하는 데 동의합니다. 이용 기간이 끝난 뒤 1년간 보관 후 삭제합니다. <b>(필수)</b></span></label>' +
      '<p class="err" id="err" style="color:var(--warn);font-size:14px;min-height:20px"></p><button class="btn dark full" type="submit">신청서 제출하기</button></div></form></div>';
    var f = $('af');
    f.phone.oninput = function () { var d = f.phone.value.replace(/\D/g, '').slice(0, 11); f.phone.value = d.length > 7 ? d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7) : d.length > 3 ? d.slice(0, 3) + '-' + d.slice(3) : d; };
    f.onsubmit = function (e) {
      e.preventDefault();
      var v = function (k) { return f[k].value.trim(); }, err = '';
      if (!v('name')) err = '이용자 이름을 적어 주십시오.';
      else if (!v('dong') || !v('ho')) err = '동과 호수를 적어 주십시오.';
      else if (v('phone').replace(/\D/g, '').length < 10) err = '연락처를 정확히 적어 주십시오.';
      else if (v('birth') && !/^(19|20)\d{6}$/.test(v('birth'))) err = '생년월일은 숫자 8자리로 적어 주십시오. (예: 19800101)';
      else if (!f.a1.checked || !f.a2.checked) err = '필수 확인 사항에 모두 체크해 주십시오.';
      $('err').textContent = err; if (err) return;
      CP.apply({ itemId: i.id, itemName: i.name, cat: i.cat, catName: c.name, period: i.period, price: i.price, qty: n, amount: i.price * n, name: v('name'), dong: v('dong'), ho: v('ho'), phone: v('phone'), birth: v('birth'), memo: v('memo') })
        .then(function (r) { try { sessionStorage.setItem('cp_last', JSON.stringify(r)); } catch (e2) {} location.href = 'done.html'; })
        .catch(function (e2) { $('err').textContent = e2.message; });
    };
  };

  /* ---------- 신청 완료 ---------- */
  P.done = function (el) {
    shell(''); var r = null; try { r = JSON.parse(sessionStorage.getItem('cp_last')); } catch (e) {}
    el.innerHTML = '<div class="wrap"><div class="form-wrap"><div class="done"><div class="ic">✓</div><h1>신청이 접수되었습니다</h1><p>관리자가 확인한 뒤 확정해 드립니다. 요금 납부는 확정 뒤 안내해 드립니다.</p></div>' +
      (r ? '<div class="box"><dl class="kv" style="border-top:0"><div><dt>신청번호</dt><dd class="num">' + esc(r.no) + '</dd></div><div><dt>이용권</dt><dd>' + esc(r.itemName) + '</dd></div><div><dt>이용기간</dt><dd>' + esc(r.period || '-') + '</dd></div><div><dt>이용자</dt><dd>' + esc(r.name) + ' · ' + esc(r.dong) + '동 ' + esc(r.ho) + '호</dd></div><div style="border-bottom:0"><dt>신청 금액</dt><dd class="num"><b>' + won(r.amount) + '</b></dd></div></dl></div>' : '') +
      '<div class="row2"><a class="btn" href="list.html">다른 이용권 보기</a><a class="btn dark" href="orders.html">신청내역 조회</a></div></div></div>';
  };

  /* ---------- 신청내역 조회 ---------- */
  P.orders = function (el) {
    shell('');
    var ST = { '신청': 's1', '확정': 's2', '취소요청': 's3', '취소': 's4' };
    el.innerHTML = '<div class="wrap"><div class="form-wrap"><div class="page-h" style="padding-top:0"><h1>신청내역 조회</h1><p>신청할 때 적은 이름과 연락처를 입력해 주십시오.</p></div>' +
      '<form class="box" id="of" style="margin-top:18px"><div class="row2"><div class="f"><label>이름</label><input name="name" autocomplete="name"></div><div class="f"><label>연락처</label><input name="phone" inputmode="tel" placeholder="010-0000-0000"></div></div><button class="btn dark full" type="submit">조회하기</button></form><div id="res"></div></div></div>';
    var f = $('of');
    function run() {
      var name = f.name.value.trim(), phone = f.phone.value.trim();
      if (!name || phone.replace(/\D/g, '').length < 10) { $('res').innerHTML = '<div class="empty">이름과 연락처를 정확히 입력해 주십시오.</div>'; return; }
      CP.lookup(name, phone).then(function (l) {
        $('res').innerHTML = l.length ? l.map(function (a) {
          var can = a.status === '신청' || a.status === '확정';
          return '<div class="ord"><div><small class="num">' + esc(a.createdAt) + ' · 신청번호 ' + esc(a.no) + '</small><h3>' + esc(a.itemName) + '</h3><small>' + esc(a.period || '') + ' · ' + a.qty + '장 · <span class="num">' + won(a.amount) + '</span></small></div><span class="st ' + ST[a.status] + '">' + esc(a.status) + '</span>' +
            (can ? '<div class="a"><button class="btn sm" data-no="' + esc(a.no) + '">취소 요청</button></div>' : '') + '</div>';
        }).join('') : '<div class="empty">신청 내역이 없습니다. 이름과 연락처를 다시 확인해 주십시오.</div>';
        $('res').querySelectorAll('[data-no]').forEach(function (b) {
          b.onclick = function () {
            if (b.dataset.arm) { CP.requestCancel(b.dataset.no, name, phone).then(function () { toast('취소 요청을 보냈습니다.'); run(); }); return; }
            b.dataset.arm = '1'; b.textContent = '한 번 더 누르면 취소 요청'; setTimeout(function () { delete b.dataset.arm; b.textContent = '취소 요청'; }, 3000);
          };
        });
      });
    }
    f.onsubmit = function (e) { e.preventDefault(); run(); };
  };

  document.addEventListener('DOMContentLoaded', function () { var el = document.getElementById('app'), p = document.body.dataset.page; if (P[p]) P[p](el); });
})();
