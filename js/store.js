/* 저장 계층 — 지금(시안 단계)은 이 브라우저의 localStorage 에 저장합니다.
   Cloudflare(Worker + D1) 서버를 붙일 때 이 파일의 함수 안쪽만 서버 호출로 바꾸면 되고, 화면 코드는 그대로 씁니다.
   user() 만 동기(로그인 상태 캐시)이고 나머지는 Promise 를 돌려줍니다.
   ※ 시안 단계의 회원 정보·비밀번호는 브라우저 안에만 있는 연습용입니다. 실제 운영은 서버에서 처리합니다. */
(function () {
  var D = window.CP_DEFAULTS;
  var K = { content: 'cp_content_v1', apps: 'cp_apps_v1', pw: 'cp_admin_pw_v1', users: 'cp_users_v1', ses: 'cp_session_v1' };
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
  function hash(s) {
    if (!(window.crypto && crypto.subtle)) return Promise.resolve('plain:' + s);
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode('cp|' + s)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); });
  }
  function pub(u) { return u ? { id: u.id, name: u.name, dong: u.dong, ho: u.ho, phone: u.phone, birth: u.birth, joinedAt: u.joinedAt } : null; }
  function cur() { var id = get(K.ses, null); return id ? get(K.users, []).filter(function (u) { return u.id === id; })[0] || null : null; }
  function fail(m) { return Promise.reject(new Error(m)); }

  window.CP = {
    STATUS: ['신청', '확정', '취소요청', '취소'],
    content: content,
    saveContent: function (c) { return Promise.resolve(set(K.content, { site: c.site, items: c.items, notice: c.notice, refund: c.refund, faqs: c.faqs })); },

    /* ---------- 회원 ---------- */
    user: function () { return pub(cur()); },
    idTaken: function (id) { return Promise.resolve(get(K.users, []).some(function (u) { return u.id === String(id).toLowerCase(); })); },
    signup: function (r) {
      var id = String(r.id || '').toLowerCase(), list = get(K.users, []);
      if (!/^[a-z0-9_]{4,20}$/.test(id)) return fail('아이디는 영문 소문자·숫자 4~20자로 정해 주십시오.');
      if (String(r.password || '').length < 6) return fail('비밀번호는 6자 이상으로 정해 주십시오.');
      if (list.some(function (u) { return u.id === id; })) return fail('이미 사용 중인 아이디입니다.');
      if (list.some(function (u) { return u.name === r.name && digits(u.phone) === digits(r.phone); })) return fail('같은 이름과 연락처로 가입한 회원이 있습니다. 로그인해 주십시오.');
      return hash(r.password).then(function (h) {
        var u = { id: id, pw: h, name: r.name, dong: r.dong, ho: r.ho, phone: r.phone, birth: r.birth || '', joinedAt: stamp(new Date()) };
        list.unshift(u); if (!set(K.users, list)) throw new Error('저장하지 못했습니다.');
        set(K.ses, id); return pub(u);
      });
    },
    signin: function (id, pw) {
      id = String(id || '').toLowerCase();
      return hash(pw).then(function (h) {
        var u = get(K.users, []).filter(function (x) { return x.id === id && x.pw === h; })[0];
        if (!u) throw new Error('아이디 또는 비밀번호가 맞지 않습니다.');
        set(K.ses, id); return pub(u);
      });
    },
    signout: function () { try { localStorage.removeItem(K.ses); } catch (e) {} return Promise.resolve(true); },
    updateMe: function (r) {
      var me = cur(); if (!me) return fail('로그인이 필요합니다.');
      var list = get(K.users, []), done = function () { set(K.users, list); return pub(cur()); };
      var u = list.filter(function (x) { return x.id === me.id; })[0];
      ['name', 'dong', 'ho', 'phone', 'birth'].forEach(function (k) { if (r[k] !== undefined) u[k] = r[k]; });
      if (r.password) { if (String(r.password).length < 6) return fail('비밀번호는 6자 이상으로 정해 주십시오.'); return hash(r.password).then(function (h) { u.pw = h; return done(); }); }
      return Promise.resolve(done());
    },

    /* ---------- 신청 ---------- */
    apply: function (rec) {
      var me = cur(); if (!me) return fail('로그인이 필요합니다.');
      var list = get(K.apps, []), now = new Date();
      var dup = list.some(function (a) { return a.itemId === rec.itemId && a.userId === me.id && a.name === rec.name && a.status !== '취소'; });
      if (dup) return fail('같은 이용자 이름으로 이미 신청한 이용권입니다. 마이페이지에서 확인해 주십시오.');
      var day = '' + String(now.getFullYear()).slice(2) + pad(now.getMonth() + 1) + pad(now.getDate());
      var seq = list.filter(function (a) { return String(a.no).indexOf(day) === 0; }).length + 1;
      rec.no = day + '-' + ('00' + seq).slice(-3); rec.userId = me.id;
      rec.createdAt = stamp(now); rec.status = '신청';
      list.unshift(rec);
      if (!set(K.apps, list)) return fail('저장하지 못했습니다.');
      return Promise.resolve(rec);
    },
    myApps: function () { var me = cur(); return Promise.resolve(me ? get(K.apps, []).filter(function (a) { return a.userId === me.id; }) : []); },
    requestCancel: function (no) {
      var me = cur(), list = get(K.apps, []), hit = null;
      list.forEach(function (a) { if (me && a.no === no && a.userId === me.id && (a.status === '신청' || a.status === '확정')) { a.status = '취소요청'; hit = a; } });
      set(K.apps, list); return Promise.resolve(hit);
    },

    /* ---------- 관리자 ---------- */
    login: function (pw) { return Promise.resolve(String(pw) === String(get(K.pw, '0000'))); },
    setPassword: function (pw) { return Promise.resolve(set(K.pw, String(pw))); },
    apps: function () { return Promise.resolve(get(K.apps, [])); },
    users: function () { return Promise.resolve(get(K.users, []).map(pub)); },
    removeUser: function (id) { return Promise.resolve(set(K.users, get(K.users, []).filter(function (u) { return u.id !== id; }))); },
    setStatus: function (no, st) { var list = get(K.apps, []); list.forEach(function (a) { if (a.no === no) a.status = st; }); return Promise.resolve(set(K.apps, list)); },
    remove: function (no) { return Promise.resolve(set(K.apps, get(K.apps, []).filter(function (a) { return a.no !== no; }))); },
    counts: function () { var m = {}; get(K.apps, []).forEach(function (a) { if (a.status !== '취소') m[a.itemId] = (m[a.itemId] || 0) + (a.qty || 1); }); return m; }
  };
})();
