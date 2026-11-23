/* 관리자 화면 — 신청 내역(엑셀 내려받기), 이용권 관리, 기본 설정 */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var won = function (n) { return Number(n || 0).toLocaleString('ko-KR') + '원'; };
  var C = CP.content(), view = $('view'), tab = 'apps', apps = [], F = { cat: '', st: '', month: '', q: '' };
  var ST = { '신청': 's1', '확정': 's2', '취소요청': 's3', '취소': 's4' };
  function toast(m) { var t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2400); }
  function save() { return CP.saveContent(C).then(function () { toast('저장했습니다.'); }); }

  /* ---------- 로그인 ---------- */
  function gate() {
    var ok = false; try { ok = sessionStorage.getItem('cp_admin') === '1'; } catch (e) {}
    if (ok) return start();
    $('login').hidden = false;
    $('lf').onsubmit = function (e) {
      e.preventDefault();
      CP.login($('pw').value).then(function (r) {
        if (!r) { $('lerr').textContent = '비밀번호가 맞지 않습니다.'; return; }
        try { sessionStorage.setItem('cp_admin', '1'); } catch (e2) {} $('login').hidden = true; start();
      });
    };
  }
  function start() {
    $('adm').hidden = false; $('a-name').textContent = C.site.name + ' 관리자';
    $('tabs').onclick = function (e) { var b = e.target.closest('button'); if (b) go(b.dataset.t); };
    $('logout').onclick = function () { try { sessionStorage.removeItem('cp_admin'); } catch (e) {} location.reload(); };
    go('apps');
  }
  function go(t) { tab = t; document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === t); }); ({ apps: drawApps, items: drawItems, site: drawSite })[t](); }

  /* ---------- 신청 내역 ---------- */
  function filtered() {
    var k = F.q.trim().replace(/-/g, '');
    return apps.filter(function (a) {
      return (!F.cat || a.cat === F.cat) && (!F.st || a.status === F.st) && (!F.month || String(a.createdAt).slice(0, 7) === F.month) &&
        (!k || [a.name, a.phone, a.dong + '동', a.ho + '호', a.dong + '-' + a.ho, a.no, a.itemName].join(' ').replace(/-/g, '').indexOf(k) >= 0);
    });
  }
  function drawApps() {
    CP.apps().then(function (l) {
      apps = l;
      var months = []; l.forEach(function (a) { var m = String(a.createdAt).slice(0, 7); if (months.indexOf(m) < 0) months.push(m); });
      var cnt = function (s) { return l.filter(function (a) { return a.status === s; }).length; };
      view.innerHTML = '<div class="kpis">' + [['전체', l.length], ['신청(확인 전)', cnt('신청')], ['확정', cnt('확정')], ['취소 요청', cnt('취소요청')]].map(function (k) { return '<div><small>' + k[0] + '</small><b class="num">' + k[1] + '</b></div>'; }).join('') + '</div>' +
        '<div class="bar"><select id="f-cat"><option value="">전체 시설</option>' + C.cats.map(function (c) { return '<option value="' + c.id + '">' + esc(c.short) + '</option>'; }).join('') + '</select>' +
        '<select id="f-st"><option value="">전체 상태</option>' + CP.STATUS.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select>' +
        '<select id="f-month"><option value="">전체 기간</option>' + months.map(function (m) { return '<option value="' + m + '">' + m.replace('-', '년 ') + '월 신청</option>'; }).join('') + '</select>' +
        '<input id="f-q" placeholder="이름·연락처·동호수 검색"><button class="btn dark sm" id="xls" style="margin-left:auto;height:40px">⬇ 엑셀 내려받기</button></div><div id="tbl"></div>';
      ['cat', 'st', 'month'].forEach(function (k) { $('f-' + k).value = F[k]; $('f-' + k).onchange = function () { F[k] = this.value; table(); }; });
      $('f-q').value = F.q; $('f-q').oninput = function () { F.q = this.value; table(); };
      $('xls').onclick = excel; table();
    });
  }
  function table() {
    var l = filtered();
    $('tbl').innerHTML = l.length ? '<p class="cnt">조회 ' + l.length + '건 · 합계 <b class="num">' + won(l.filter(function (a) { return a.status !== '취소'; }).reduce(function (s, a) { return s + (a.amount || 0); }, 0)) + '</b> (취소 제외)</p><div class="tw"><table><thead><tr><th>신청일시</th><th>신청번호</th><th>이용권</th><th>이용자</th><th>동·호</th><th>연락처</th><th>생년월일</th><th>금액</th><th>상태</th><th>남긴 말</th><th></th></tr></thead><tbody>' +
      l.map(function (a) {
        return '<tr><td class="num">' + esc(a.createdAt) + '</td><td class="num">' + esc(a.no) + '</td><td>' + esc(a.itemName) + (a.qty > 1 ? ' ×' + a.qty : '') + '</td><td><b>' + esc(a.name) + '</b></td><td class="num">' + esc(a.dong) + '동 ' + esc(a.ho) + '호</td><td class="num">' + esc(a.phone) + '</td><td class="num">' + esc(a.birth || '') + '</td><td class="num">' + won(a.amount) + '</td>' +
          '<td><select class="stsel ' + ST[a.status] + '" data-no="' + esc(a.no) + '">' + CP.STATUS.map(function (s) { return '<option' + (s === a.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></td><td class="memo">' + esc(a.memo || '') + '</td><td><button class="del" data-del="' + esc(a.no) + '">삭제</button></td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="empty">조건에 맞는 신청 내역이 없습니다.</div>';
    $('tbl').querySelectorAll('.stsel').forEach(function (s) { s.onchange = function () { CP.setStatus(s.dataset.no, s.value).then(function () { toast('상태를 "' + s.value + '"(으)로 바꿨습니다.'); drawApps(); }); }; });
    $('tbl').querySelectorAll('[data-del]').forEach(function (b) {
      b.onclick = function () { if (b.dataset.arm) { CP.remove(b.dataset.del).then(drawApps); return; } b.dataset.arm = '1'; b.textContent = '한 번 더'; setTimeout(function () { delete b.dataset.arm; b.textContent = '삭제'; }, 3000); };
    });
  }
  /* 지금 화면에 걸린 조건 그대로 .xlsx 로 내려받기 */
  function excel() {
    var l = filtered();
    if (!l.length) return toast('내려받을 신청 내역이 없습니다.');
    if (!window.XLSX) return toast('엑셀 도구를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.');
    var head = ['신청번호', '신청일시', '시설', '이용권', '이용기간', '수량', '금액', '이용자', '동', '호', '연락처', '생년월일', '상태', '남긴 말'];
    var rows = l.map(function (a) { return [a.no, a.createdAt, a.catName || '', a.itemName, a.period || '', a.qty || 1, a.amount || 0, a.name, a.dong, a.ho, a.phone, a.birth || '', a.status, a.memo || '']; });
    var ws = XLSX.utils.aoa_to_sheet([head].concat(rows));
    ws['!cols'] = [12, 17, 16, 34, 24, 6, 10, 10, 7, 7, 15, 11, 9, 30].map(function (w) { return { wch: w }; });
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: head.length - 1 } }) };
    for (var r = 1; r <= rows.length; r++) { var cell = ws[XLSX.utils.encode_cell({ r: r, c: 6 })]; if (cell) cell.z = '#,##0'; }
    var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, '신청 내역');
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    XLSX.writeFile(wb, '이용권_신청내역_' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '.xlsx');
    toast(l.length + '건을 엑셀로 내려받았습니다.');
  }

  /* ---------- 이용권 관리 ---------- */
  function drawItems() {
    var cn = CP.counts();
    view.innerHTML = '<div class="bar"><b>이용권 ' + C.items.length + '개</b><button class="btn dark sm" id="add" style="margin-left:auto;height:40px">＋ 이용권 추가</button></div>' +
      C.items.map(function (i, n) {
        return '<div class="it" data-n="' + n + '"><div class="g"><label>시설<select data-f="cat">' + C.cats.map(function (c) { return '<option value="' + c.id + '"' + (c.id === i.cat ? ' selected' : '') + '>' + esc(c.short) + '</option>'; }).join('') + '</select></label>' +
          '<label class="w2">이용권 이름<input data-f="name" value="' + esc(i.name) + '"></label><label class="w2">한 줄 설명<input data-f="sum" value="' + esc(i.sum || '') + '"></label>' +
          '<label>이용기간<input data-f="period" value="' + esc(i.period || '') + '" placeholder="2026.12.01 ~ 2026.12.31"></label><label>금액(원)<input data-f="price" type="number" min="0" step="1000" value="' + (+i.price || 0) + '"></label>' +
          '<label>정가(할인 표시용)<input data-f="listPrice" type="number" min="0" step="1000" value="' + (+i.listPrice || 0) + '"></label><label>1인 최대 수량<input data-f="max" type="number" min="1" max="9" value="' + (+i.max || 1) + '"></label>' +
          '<label class="w4">상세 설명<textarea data-f="desc">' + esc(i.desc || '') + '</textarea></label></div>' +
          '<div class="ops"><label class="ck"><input type="checkbox" data-f="visible"' + (i.visible !== false ? ' checked' : '') + '> 사이트에 노출</label><label class="ck"><input type="checkbox" data-f="soldout"' + (i.soldout ? ' checked' : '') + '> 신청 마감</label>' +
          '<span class="cnt">신청 ' + (cn[i.id] || 0) + '건</span><button class="btn sm" data-copy="' + n + '">복사(다음 달용)</button><button class="del" data-rm="' + n + '">삭제</button></div></div>';
      }).join('') + '<div class="savebar"><button class="btn dark" id="isave">이용권 저장</button></div>';
    view.querySelectorAll('.it [data-f]').forEach(function (el) {
      el.oninput = el.onchange = function () {
        var i = C.items[+el.closest('.it').dataset.n], f = el.dataset.f;
        i[f] = el.type === 'checkbox' ? el.checked : (el.type === 'number' ? Math.max(0, +el.value || 0) : el.value);
      };
    });
    $('add').onclick = function () { C.items.unshift({ id: 'p' + Date.now().toString(36), cat: C.cats[0].id, name: '', sum: '', period: '', price: 0, listPrice: 0, max: 1, soldout: false, visible: false, desc: '' }); drawItems(); toast('맨 위에 빈 이용권을 추가했습니다. 내용을 적고 저장하세요.'); };
    view.querySelectorAll('[data-copy]').forEach(function (b) { b.onclick = function () { var s = C.items[+b.dataset.copy], c = JSON.parse(JSON.stringify(s)); c.id = 'p' + Date.now().toString(36); c.name = s.name + ' (복사)'; c.visible = false; c.soldout = false; C.items.splice(+b.dataset.copy, 0, c); drawItems(); toast('복사했습니다. 이름과 기간을 고친 뒤 저장하세요.'); }; });
    view.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { if (b.dataset.arm) { C.items.splice(+b.dataset.rm, 1); drawItems(); return; } b.dataset.arm = '1'; b.textContent = '한 번 더'; setTimeout(function () { delete b.dataset.arm; b.textContent = '삭제'; }, 3000); }; });
    $('isave').onclick = function () { if (C.items.some(function (i) { return !String(i.name).trim(); })) return toast('이름이 비어 있는 이용권이 있습니다.'); save(); };
  }

  /* ---------- 기본 설정 ---------- */
  function drawSite() {
    var s = C.site, area = function (k, label, arr) { return '<label class="w4">' + label + '<small>한 줄에 하나씩</small><textarea id="s-' + k + '" style="min-height:120px">' + esc(arr.join('\n')) + '</textarea></label>'; };
    view.innerHTML = '<div class="it"><div class="g"><label class="w2">단지·시설 이름<input id="s-name" value="' + esc(s.name) + '"></label><label class="w2">한 줄 소개<input id="s-tagline" value="' + esc(s.tagline) + '"></label>' +
      '<label class="w2">문의 전화<input id="s-phone" value="' + esc(s.phone) + '"></label><label class="w2">신청 시작 안내<input id="s-openNote" value="' + esc(s.openNote) + '"></label>' +
      '<label class="w4">맨 아래 사업자 정보<input id="s-bizInfo" value="' + esc(s.bizInfo) + '"></label>' + area('notice', '신청 시 주의사항', C.notice) + area('refund', '취소 안내', C.refund) + '</div></div>' +
      '<div class="it"><div class="g"><label class="w2">관리자 비밀번호 바꾸기<input id="npw" type="password" placeholder="새 비밀번호 (4자 이상)"></label></div></div>' +
      '<div class="savebar"><button class="btn dark" id="ssave">설정 저장</button></div>';
    $('ssave').onclick = function () {
      ['name', 'tagline', 'phone', 'openNote', 'bizInfo'].forEach(function (k) { s[k] = $('s-' + k).value.trim(); });
      ['notice', 'refund'].forEach(function (k) { C[k] = $('s-' + k).value.split('\n').map(function (t) { return t.trim(); }).filter(Boolean); });
      var npw = $('npw').value;
      if (npw && npw.length < 4) return toast('비밀번호는 4자 이상으로 정해 주세요.');
      (npw ? CP.setPassword(npw) : Promise.resolve()).then(save).then(function () { $('a-name').textContent = s.name + ' 관리자'; $('npw').value = ''; });
    };
  }
  gate();
})();
