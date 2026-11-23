/* 저장 계층 — 지금(디자인 단계)은 이 브라우저의 localStorage 에 저장합니다.
   서버(호스팅)가 정해지면 이 파일의 함수 안쪽만 서버 호출로 바꾸면 되고, 화면 코드는 그대로 씁니다.
   모든 함수는 Promise 를 돌려줍니다. */
(function () {
  var D = window.CP_DEFAULTS;
  var K = { content: 'cp_content_v1', apps: 'cp_apps_v1', pw: 'cp_admin_pw_v1' };
  function get(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function content() {
    var s = get(K.content, null) || {};
    return {
      site: Object.assign({}, D.site, s.site || {}),
      cats: D.cats,
      items: Array.isArray(s.items) ? s.items : D.items,
      notice: Array.isArray(s.notice) ? s.notice : D.notice,
      refund: Array.isArray(s.refund) ? s.refund : D.refund,
      faqs: Array.isArray(s.faqs) ? s.faqs : D.faqs
    };
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function stamp(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }

  window.CP = {
    STATUS: ['신청', '확정', '취소요청', '취소'],
    content: content,
    saveContent: function (c) { return Promise.resolve(set(K.content, { site: c.site, items: c.items, notice: c.notice, refund: c.refund, faqs: c.faqs })); },
    /* 신청 접수 */
    apply: function (rec) {
      var list = get(K.apps, []), now = new Date();
      var dup = list.some(function (a) { return a.itemId === rec.itemId && a.name === rec.name && digits(a.phone) === digits(rec.phone) && a.status !== '취소'; });
      if (dup) return Promise.reject(new Error('같은 이름과 연락처로 이미 신청한 이용권입니다. 신청내역 조회에서 확인해 주십시오.'));
      var day = '' + String(now.getFullYear()).slice(2) + pad(now.getMonth() + 1) + pad(now.getDate());
      var seq = list.filter(function (a) { return String(a.no).indexOf(day) === 0; }).length + 1;
      rec.no = day + '-' + ('00' + seq).slice(-3);
      rec.createdAt = stamp(now); rec.status = '신청';
      list.unshift(rec);
      if (!set(K.apps, list)) return Promise.reject(new Error('저장하지 못했습니다.'));
      return Promise.resolve(rec);
    },
    /* 고객: 이름+연락처로 조회 */
    lookup: function (name, phone) {
      var p = digits(phone);
      return Promise.resolve(get(K.apps, []).filter(function (a) { return a.name === String(name).trim() && digits(a.phone) === p; }));
    },
    requestCancel: function (no, name, phone) {
      var list = get(K.apps, []), hit = null;
      list.forEach(function (a) { if (a.no === no && a.name === name && digits(a.phone) === digits(phone) && (a.status === '신청' || a.status === '확정')) { a.status = '취소요청'; hit = a; } });
      set(K.apps, list); return Promise.resolve(hit);
    },
    /* 관리자 */
    login: function (pw) { return Promise.resolve(String(pw) === String(get(K.pw, '0000'))); },
    setPassword: function (pw) { return Promise.resolve(set(K.pw, String(pw))); },
    apps: function () { return Promise.resolve(get(K.apps, [])); },
    setStatus: function (no, st) { var list = get(K.apps, []); list.forEach(function (a) { if (a.no === no) a.status = st; }); return Promise.resolve(set(K.apps, list)); },
    setMemo: function (no, memo) { var list = get(K.apps, []); list.forEach(function (a) { if (a.no === no) a.adminMemo = memo; }); return Promise.resolve(set(K.apps, list)); },
    remove: function (no) { return Promise.resolve(set(K.apps, get(K.apps, []).filter(function (a) { return a.no !== no; }))); },
    /* 신청 수(확정+신청) — 정원 관리용 */
    counts: function () { var m = {}; get(K.apps, []).forEach(function (a) { if (a.status !== '취소') m[a.itemId] = (m[a.itemId] || 0) + (a.qty || 1); }); return m; }
  };
})();
