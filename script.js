(function () {
  'use strict';

  var WEEK_CN = ['日', '一', '二', '三', '四', '五', '六'];

  var S2T = {
    '闰': '閏', '龙': '龍', '鸡': '雞', '猪': '豬', '马': '馬',
    '岁': '歲', '苏': '蘇', '腊': '臘',
    '双': '雙', '历': '曆', '农': '農', '仪': '儀',
    '转': '轉', '换': '換', '选': '選', '择': '擇',
    '输': '輸', '术': '術', '请': '請', '检': '檢',
    '库': '庫', '载': '載', '败': '敗', '错': '錯', '误': '誤',
    '网': '網', '络': '絡', '连': '連', '后': '後',
    '无': '無', '对': '對', '应': '應', '为': '為',
    '内': '內', '围': '圍', '暂': '暫', '调': '調', '试': '試',
  };

  var MIN_SOLAR = { year: 1900, month: 1, day: 31 };
  var MAX_SOLAR = { year: 2100, month: 12, day: 31 };
  var state = { year: 0, month: 0, selectedDate: '' };
  var els = {};
  var SL = null;
  var useTraditional = false;

  function convertChinese(text) {
    if (!useTraditional) return text;
    var out = '';
    for (var i = 0; i < text.length; i++) {
      out += S2T[text[i]] || text[i];
    }
    return out;
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function formatDateKey(year, month, day) {
    return year + '-' + pad2(month) + '-' + pad2(day);
  }

  function parseDateValue(value) {
    var parts = String(value || '').split('-');
    if (parts.length !== 3) return null;
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return { year: year, month: month, day: day };
  }

  function dateNumber(year, month, day) {
    return year * 10000 + month * 100 + day;
  }

  function isSupportedDate(year, month, day) {
    var value = dateNumber(year, month, day);
    if (value < dateNumber(MIN_SOLAR.year, MIN_SOLAR.month, MIN_SOLAR.day) ||
        value > dateNumber(MAX_SOLAR.year, MAX_SOLAR.month, MAX_SOLAR.day)) return false;
    var date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }

  function isSupportedMonth(year, month) {
    var value = year * 12 + month;
    return value >= MIN_SOLAR.year * 12 + MIN_SOLAR.month &&
      value <= MAX_SOLAR.year * 12 + MAX_SOLAR.month;
  }

  function getTodayParts() {
    var today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
  }

  function firstSupportedDay(year, month) {
    var daysInMonth = new Date(year, month, 0).getDate();
    for (var day = 1; day <= daysInMonth; day++) {
      if (isSupportedDate(year, month, day)) return day;
    }
    return 1;
  }

  function getRovingDateKey() {
    var selected = parseDateValue(state.selectedDate);
    if (selected && selected.year === state.year && selected.month === state.month &&
        isSupportedDate(selected.year, selected.month, selected.day)) {
      return formatDateKey(selected.year, selected.month, selected.day);
    }
    var today = getTodayParts();
    if (today.year === state.year && today.month === state.month &&
        isSupportedDate(today.year, today.month, today.day)) {
      return formatDateKey(today.year, today.month, today.day);
    }
    return formatDateKey(state.year, state.month, firstSupportedDay(state.year, state.month));
  }

  function toggleScript() {
    useTraditional = !useTraditional;
    try { localStorage.setItem('calendar-script', useTraditional ? 't' : 's'); } catch (e) {}
    updateStaticText();
    renderCalendar();
    if (els.resultSolar2Lunar && els.resultSolar2Lunar.textContent.trim()) convertSolarToLunar();
    if (els.resultLunar2Solar && els.resultLunar2Solar.textContent.trim()) convertLunarToSolar();
  }

  function resolveLunarLib() {
    if (typeof solarLunar === 'undefined' || solarLunar === null) return null;
    if (typeof solarLunar.solar2lunar === 'function') return solarLunar;
    if (solarLunar.default && typeof solarLunar.default.solar2lunar === 'function') return solarLunar.default;
    return null;
  }

  function updateStaticText() {
    document.documentElement.lang = useTraditional ? 'zh-TW' : 'zh-CN';
    document.title = convertChinese('双历仪表板');
    if (els.scriptToggle) els.scriptToggle.textContent = useTraditional ? '简体' : '繁體';
    if (els.legendMonthStart) els.legendMonthStart.textContent = convertChinese('农历月初');
    if (els.legendLeap) els.legendLeap.textContent = convertChinese('闰月');
    if (els.tabSolar2lunar) {
      els.tabSolar2lunar.innerHTML = convertChinese('公历') + ' &rarr; ' + convertChinese('农历');
      els.tabSolar2lunar.setAttribute('aria-label', convertChinese('公历') + ' ' + convertChinese('转为') + ' ' + convertChinese('农历'));
    }
    if (els.tabLunar2solar) {
      els.tabLunar2solar.innerHTML = convertChinese('农历') + ' &rarr; ' + convertChinese('公历');
      els.tabLunar2solar.setAttribute('aria-label', convertChinese('农历') + ' ' + convertChinese('转为') + ' ' + convertChinese('公历'));
    }
    if (els.converterTabs) els.converterTabs.setAttribute('aria-label', convertChinese('日期转换方向'));
    if (els.panelDescSolar) els.panelDescSolar.textContent = convertChinese('选择公历日期，查看对应农历信息。');
    if (els.panelDescLunar) els.panelDescLunar.textContent = convertChinese('输入农历日期，转换为公历。');
    if (els.labelSolarDate) els.labelSolarDate.textContent = convertChinese('公历日期：');
    if (els.labelLunarYear) els.labelLunarYear.textContent = convertChinese('年份：');
    if (els.labelLunarMonth) els.labelLunarMonth.textContent = convertChinese('月份：');
    if (els.labelLunarDay) els.labelLunarDay.textContent = convertChinese('日期：');
    if (els.labelLeapText) {
      els.labelLeapText.innerHTML = convertChinese('闰月') + ' (<span class="chinese-leap-indicator">' + convertChinese('闰') + '</span>)';
    }
    if (els.todayBtn) els.todayBtn.textContent = convertChinese('今天');
    if (els.convertToLunar) els.convertToLunar.textContent = convertChinese('转换');
    if (els.convertToSolar) els.convertToSolar.textContent = convertChinese('转换');
    if (els.prevMonth) els.prevMonth.setAttribute('aria-label', convertChinese('上一月'));
    if (els.nextMonth) els.nextMonth.setAttribute('aria-label', convertChinese('下一月'));
    if (els.title) els.title.textContent = convertChinese('双历仪表板');
    if (els.subtitle) els.subtitle.textContent = convertChinese('公历 · 农历 双历仪表板');
    if (els.footerTech) els.footerTech.textContent = convertChinese('技术支持');
    if (els.sectionTitle) els.sectionTitle.textContent = convertChinese('日期转换');
  }

  function init() {
    cacheElements();
    SL = resolveLunarLib();
    try { useTraditional = localStorage.getItem('calendar-script') === 't'; } catch (e) {}
    populateSelects();
    updateLeapUI();
    updateStaticText();
    var today = new Date();
    state.year = today.getFullYear();
    state.month = today.getMonth() + 1;
    bindEvents();
    setDefaultSolarDate();
    renderCalendar();
    convertSolarToLunar();
  }

  function cacheElements() {
    els.calendarGrid = document.getElementById('calendar-grid');
    els.calendarHeader = document.getElementById('calendar-header');
    els.prevMonth = document.getElementById('prev-month');
    els.nextMonth = document.getElementById('next-month');
    els.todayBtn = document.getElementById('today-btn');
    els.solarDateInput = document.getElementById('solar-date-input');
    els.convertToLunar = document.getElementById('convert-to-lunar');
    els.resultSolar2Lunar = document.getElementById('result-solar2lunar');
    els.convertToSolar = document.getElementById('convert-to-solar');
    els.resultLunar2Solar = document.getElementById('result-lunar2solar');
    els.lunarYearInput = document.getElementById('lunar-year-input');
    els.lunarMonthInput = document.getElementById('lunar-month-input');
    els.lunarDayInput = document.getElementById('lunar-day-input');
    els.lunarLeapInput = document.getElementById('lunar-leap-input');
    els.scriptToggle = document.getElementById('script-toggle');
    els.converterTabs = document.querySelector('.converter-tabs');
    els.legendMonthStart = document.querySelector('.legend-text-month');
    els.legendLeap = document.querySelector('.legend-text-leap');
    els.tabSolar2lunar = document.querySelector('.tab[data-panel="solar2lunar"]');
    els.tabLunar2solar = document.querySelector('.tab[data-panel="lunar2solar"]');
    els.panelDescSolar = document.querySelector('#panel-solar2lunar .panel-desc');
    els.panelDescLunar = document.querySelector('#panel-lunar2solar .panel-desc');
    els.labelSolarDate = document.querySelector('label[for="solar-date-input"]');
    els.labelLunarYear = document.querySelector('label[for="lunar-year-input"]');
    els.labelLunarMonth = document.querySelector('label[for="lunar-month-input"]');
    els.labelLunarDay = document.querySelector('label[for="lunar-day-input"]');
    els.labelLeap = document.querySelector('.checkbox-label');
    els.labelLeapText = document.querySelector('.lunar-leap-text');
    els.title = document.querySelector('h1');
    els.subtitle = document.querySelector('.app-subtitle');
    els.sectionTitle = document.querySelector('.section-title');
    els.footerTech = document.getElementById('footer-tech');
    els.tabs = document.querySelectorAll('.tab');
    els.panels = {
      solar2lunar: document.getElementById('panel-solar2lunar'),
      lunar2solar: document.getElementById('panel-lunar2solar'),
    };
  }

  function populateSelects() {
    if (!els.lunarMonthInput || !els.lunarDayInput) return;
    for (var m = 1; m <= 12; m++) {
      var opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      els.lunarMonthInput.appendChild(opt);
    }
    els.lunarMonthInput.value = 4;
    for (var d = 1; d <= 30; d++) {
      var opt2 = document.createElement('option');
      opt2.value = d;
      opt2.textContent = d;
      els.lunarDayInput.appendChild(opt2);
    }
    els.lunarDayInput.value = 5;
  }

  function updateLeapUI() {
    if (!SL || !els.lunarLeapInput || !els.lunarMonthInput || !els.lunarYearInput) return;
    var year = parseInt(els.lunarYearInput.value, 10);
    var month = parseInt(els.lunarMonthInput.value, 10);
    if (isNaN(year) || isNaN(month)) return;
    var label = els.lunarLeapInput.closest('.checkbox-label');
    if (year < MIN_SOLAR.year || year > MAX_SOLAR.year) {
      els.lunarLeapInput.checked = false;
      els.lunarLeapInput.disabled = true;
      if (label) label.style.display = 'none';
      return;
    }
    var leapM = SL.leapMonth(year);
    if (leapM === month) {
      if (label) label.style.display = '';
      els.lunarLeapInput.disabled = false;
    } else {
      els.lunarLeapInput.checked = false;
      els.lunarLeapInput.disabled = true;
      if (label) label.style.display = 'none';
    }
  }

  function setDefaultSolarDate() {
    if (!els.solarDateInput) return;
    var today = getTodayParts();
    var dateKey = formatDateKey(today.year, today.month, today.day);
    els.solarDateInput.value = dateKey;
    state.selectedDate = dateKey;
  }

  function normalizeDate(year, month) {
    if (month < 1) { month += 12; year--; }
    else if (month > 12) { month -= 12; year++; }
    return { year: year, month: month };
  }

  function renderCalendar(focusDateKey) {
    try {
      doRender(focusDateKey);
    } catch (e) {
      if (els.calendarGrid) {
        els.calendarGrid.innerHTML = '<div style="grid-column:1/-1;padding:30px;text-align:center;color:var(--red)">' +
          convertChinese('日历渲染失败，请检查日期范围后刷新。') + '</div>';
      }
    }
  }

  function doRender(focusDateKey) {
    if (!SL) {
      if (els.calendarGrid) {
        els.calendarGrid.innerHTML = '<div style="grid-column:1/-1;padding:30px;text-align:center;color:var(--red)">' +
          convertChinese('日历库未加载，请检查网络连接后刷新。') + '</div>';
      }
      if (els.calendarHeader) els.calendarHeader.textContent = '--';
      updateMonthNav();
      return;
    }

    var year = state.year;
    var month = state.month;
    if (els.calendarHeader) els.calendarHeader.textContent = convertChinese(year + '年' + month + '月');
    updateMonthNav();

    var firstDay = new Date(year, month - 1, 1).getDay();
    var daysInMonth = new Date(year, month, 0).getDate();
    var daysInPrevMonth = new Date(year, month - 1, 0).getDate();
    var prevNorm = normalizeDate(year, month - 1);
    var nextNorm = normalizeDate(year, month + 1);

    var html = '';
    for (var weekday = 0; weekday < WEEK_CN.length; weekday++) {
      html += '<div class="day-header">' + convertChinese(WEEK_CN[weekday]) + '</div>';
    }
    var rovingDateKey = getRovingDateKey();

    var dayCount = 1, nextMonthDay = 1, started = false;
    for (var row = 0; row < 6; row++) {
      for (var col = 0; col < 7; col++) {
        if (!started && row === 0 && col < firstDay) {
          html += buildCell(prevNorm.year, prevNorm.month, daysInPrevMonth - firstDay + col + 1, true, rovingDateKey);
        } else if (!started && row === 0 && col >= firstDay) {
          started = true;
          html += buildCell(year, month, dayCount, false, rovingDateKey);
          dayCount++;
        } else if (started && dayCount <= daysInMonth) {
          html += buildCell(year, month, dayCount, false, rovingDateKey);
          dayCount++;
        } else if (started) {
          html += buildCell(nextNorm.year, nextNorm.month, nextMonthDay, true, rovingDateKey);
          nextMonthDay++;
        }
      }
    }

    if (els.calendarGrid) {
      els.calendarGrid.innerHTML = html;
      if (focusDateKey) focusDateButton(focusDateKey);
    }
  }

  function updateMonthNav() {
    if (!els.prevMonth || !els.nextMonth) return;
    var prevNorm = normalizeDate(state.year, state.month - 1);
    var nextNorm = normalizeDate(state.year, state.month + 1);
    var canPrev = isSupportedMonth(prevNorm.year, prevNorm.month);
    var canNext = isSupportedMonth(nextNorm.year, nextNorm.month);
    els.prevMonth.disabled = !canPrev;
    els.nextMonth.disabled = !canNext;
    els.prevMonth.setAttribute('aria-disabled', String(!canPrev));
    els.nextMonth.setAttribute('aria-disabled', String(!canNext));
  }

  function buildCell(year, month, day, isOther, rovingDateKey) {
    var dateStr = formatDateKey(year, month, day);
    var isSupported = isSupportedDate(year, month, day);
    var today = getTodayParts();
    var isToday = dateStr === formatDateKey(today.year, today.month, today.day);
    var isSelected = dateStr === state.selectedDate;
    var classes = 'day-cell';
    if (isOther) classes += ' other-month';
    if (!isSupported) classes += ' unsupported-date';
    if (isToday) classes += ' today';
    if (isSelected) classes += ' selected';
    var tabIndex = isSupported && dateStr === rovingDateKey ? '0' : '-1';
    var stateAttrs = isToday ? ' aria-current="date"' : '';
    stateAttrs += ' aria-pressed="' + String(isSelected) + '"';

    if (!isSupported) {
      return '<button type="button" class="' + classes + '" data-date="' + dateStr + '" data-year="' + year + '" data-month="' + month + '" data-day="' + day + '" tabindex="-1" disabled aria-disabled="true" aria-label="' +
        convertChinese('公历') + ' ' + year + convertChinese('年') + month + convertChinese('月') + day + convertChinese('日，暂不可用') + '">' +
        '<span class="gregorian-date">' + day + '</span></button>';
    }

    if (!SL) {
      return '<button type="button" class="' + classes + '" data-date="' + dateStr + '" data-year="' + year + '" data-month="' + month + '" data-day="' + day + '" tabindex="' + tabIndex + '"' + stateAttrs + ' aria-label="' + convertChinese('公历') + ' ' + year + convertChinese('年') + month + convertChinese('月') + day + convertChinese('日') + '"><span class="gregorian-date">' + day + '</span></button>';
    }

    var lunar = SL.solar2lunar(year, month, day);
    var isWeekend = new Date(year, month - 1, day).getDay();
    isWeekend = isWeekend === 0 || isWeekend === 6;
    if (isWeekend && !isOther) classes += ' weekend';

    var chineseText = lunar.dayCn;
    var chineseClass = 'chinese-date';
    if (lunar.lDay === 1) {
      chineseText = lunar.monthCn;
      chineseClass += ' month-start';
    }
    if (lunar.isLeap) chineseClass += ' leap-month';
    chineseText = convertChinese(chineseText);

    var lunarLabel = convertChinese((lunar.gzYear || '') + convertChinese('年') + (lunar.animal ? '(' + lunar.animal + ') ' : '') + lunar.monthCn + lunar.dayCn);
    var ariaLabel = convertChinese('公历') + ' ' + year + convertChinese('年') + month + convertChinese('月') + day + convertChinese('日，') +
      convertChinese('农历') + ' ' + lunarLabel;
    if (isToday) ariaLabel += convertChinese('，今天');
    if (isSelected) ariaLabel += convertChinese('，已选');

    return '<button type="button" class="' + classes + '" data-date="' + dateStr + '" data-year="' + year + '" data-month="' + month + '" data-day="' + day + '" tabindex="' + tabIndex + '"' + stateAttrs + ' aria-label="' + ariaLabel + '">' +
      '<span class="gregorian-date">' + day + '</span>' +
      '<span class="' + chineseClass + '">' + chineseText + '</span></button>';
  }

  function prevMonth() {
    var prevNorm = normalizeDate(state.year, state.month - 1);
    if (!isSupportedMonth(prevNorm.year, prevNorm.month)) return;
    state.year = prevNorm.year;
    state.month = prevNorm.month;
    renderCalendar();
  }

  function nextMonth() {
    var nextNorm = normalizeDate(state.year, state.month + 1);
    if (!isSupportedMonth(nextNorm.year, nextNorm.month)) return;
    state.year = nextNorm.year;
    state.month = nextNorm.month;
    renderCalendar();
  }

  function goToToday() {
    var today = getTodayParts();
    if (isSupportedDate(today.year, today.month, today.day)) {
      selectDate(today.year, today.month, today.day, true);
    }
  }

  function convertSolarToLunar() {
    if (!SL) { setResult('result-solar2lunar', convertChinese('库未加载，请检查网络连接。')); return; }
    var val = els.solarDateInput ? els.solarDateInput.value : '';
    if (!val) { setResult('result-solar2lunar', convertChinese('请选择日期。')); return; }
    var parts = parseDateValue(val);
    if (!parts || !isSupportedDate(parts.year, parts.month, parts.day)) {
      setResult('result-solar2lunar', convertChinese('请输入1900年1月31日至2100年12月31日内的日期，然后再转换。'));
      return;
    }
    var lunar = SL.solar2lunar(parts.year, parts.month, parts.day);
    if (!lunar || !lunar.dayCn) { setResult('result-solar2lunar', convertChinese('转换失败，请检查日期后再试。')); return; }
    var gzYear = convertChinese(lunar.gzYear);
    var animal = convertChinese(lunar.animal);
    var monthDay = convertChinese(lunar.monthCn + lunar.dayCn);
    setResult('result-solar2lunar',
      '<div class="result-label">' + convertChinese('农历') + '</div>' +
      '<div class="result-text"><span class="result-gz">' + gzYear + '</span>' + convertChinese('年') +
      '<span class="result-animal">(' + animal + ')</span> ' + monthDay + '</div>' +
      '<button class="btn btn-secondary" data-jump-year="' + parts.year + '" data-jump-month="' + parts.month + '">' +
      convertChinese('跳转到此月') + '</button>');
    bindJumpBtn('result-solar2lunar');
  }

  function convertLunarToSolar() {
    if (!SL) { setResult('result-lunar2solar', convertChinese('库未加载，请检查网络连接。')); return; }
    var y = parseInt(els.lunarYearInput ? els.lunarYearInput.value : '', 10);
    var m = parseInt(els.lunarMonthInput ? els.lunarMonthInput.value : '', 10);
    var d = parseInt(els.lunarDayInput ? els.lunarDayInput.value : '', 10);
    var isLeap = els.lunarLeapInput ? els.lunarLeapInput.checked : false;
    if (isNaN(y) || y < MIN_SOLAR.year || y > MAX_SOLAR.year) { setResult('result-lunar2solar', convertChinese('请输入有效年份（1900–2100）。')); return; }
    var solar = SL.lunar2solar(y, m, d, isLeap);
    if (!solar || !solar.cDay || !isSupportedDate(solar.cYear, solar.cMonth, solar.cDay)) {
      setResult('result-lunar2solar', convertChinese('转换失败，指定的农历日期可能不存在，请调整日期后再试。'));
      return;
    }
    var dateObj = new Date(solar.cYear, solar.cMonth - 1, solar.cDay);
    var locale = useTraditional ? 'zh-TW' : 'zh-CN';
    var formatted = convertChinese(dateObj.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    setResult('result-lunar2solar',
      '<div class="result-label">' + convertChinese('公历') + '</div>' +
      '<div class="result-text">' + formatted + '</div>' +
      '<button class="btn btn-secondary" data-jump-year="' + solar.cYear + '" data-jump-month="' + solar.cMonth + '">' +
      convertChinese('跳转到此月') + '</button>');
    bindJumpBtn('result-lunar2solar');
  }

  function setResult(id, content) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = content;
  }

  function bindJumpBtn(resultId) {
    var container = document.getElementById(resultId);
    if (!container) return;
    var btn = container.querySelector('[data-jump-year]');
    if (btn) {
      btn.addEventListener('click', function () {
        state.year = parseInt(this.dataset.jumpYear, 10);
        state.month = parseInt(this.dataset.jumpMonth, 10);
        renderCalendar();
        var section = document.getElementById('calendar-section');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  function switchTab(tabEl) {
    var tabId = tabEl.dataset.panel;
    if (!tabId) return;
    [].forEach.call(els.tabs, function (t) {
      var active = t === tabEl;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', String(active));
      t.setAttribute('tabindex', active ? '0' : '-1');
    });
    [].forEach.call(Object.keys(els.panels), function (id) {
      var panel = els.panels[id];
      var active = id === tabId;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
  }

  function focusDateButton(dateKey) {
    if (!els.calendarGrid) return;
    var button = els.calendarGrid.querySelector('.day-cell[data-date="' + dateKey + '"]');
    if (!button || button.disabled) button = els.calendarGrid.querySelector('.day-cell[tabindex="0"]');
    if (button) button.focus({ preventScroll: true });
  }

  function selectDate(year, month, day, shouldFocus) {
    if (!isSupportedDate(year, month, day)) return;
    var dateKey = formatDateKey(year, month, day);
    state.year = year;
    state.month = month;
    state.selectedDate = dateKey;
    if (els.solarDateInput) els.solarDateInput.value = dateKey;
    renderCalendar(shouldFocus ? dateKey : '');
    convertSolarToLunar();
  }

  function moveDateBy(cell, delta) {
    var year = parseInt(cell.dataset.year, 10);
    var month = parseInt(cell.dataset.month, 10);
    var day = parseInt(cell.dataset.day, 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return;
    var date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + delta);
    if (!isSupportedDate(date.getFullYear(), date.getMonth() + 1, date.getDate())) return;
    selectDate(date.getFullYear(), date.getMonth() + 1, date.getDate(), true);
  }

  function bindEvents() {
    if (els.prevMonth) els.prevMonth.addEventListener('click', prevMonth);
    if (els.nextMonth) els.nextMonth.addEventListener('click', nextMonth);
    if (els.todayBtn) els.todayBtn.addEventListener('click', goToToday);
    if (els.calendarGrid) els.calendarGrid.addEventListener('click', function (e) {
      var cell = e.target.closest('.day-cell');
      if (!cell || cell.disabled) return;
      var year = parseInt(cell.dataset.year, 10);
      var month = parseInt(cell.dataset.month, 10);
      var day = parseInt(cell.dataset.day, 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        selectDate(year, month, day, true);
      }
    });
    if (els.calendarGrid) els.calendarGrid.addEventListener('keydown', function (e) {
      var cell = e.target.closest('.day-cell');
      if (!cell || cell.disabled) return;
      var delta = 0;
      if (e.key === 'ArrowLeft') delta = -1;
      else if (e.key === 'ArrowRight') delta = 1;
      else if (e.key === 'ArrowUp') delta = -7;
      else if (e.key === 'ArrowDown') delta = 7;
      if (!delta) return;
      e.preventDefault();
      moveDateBy(cell, delta);
    });
    if (els.convertToLunar) els.convertToLunar.addEventListener('click', convertSolarToLunar);
    if (els.convertToSolar) els.convertToSolar.addEventListener('click', convertLunarToSolar);
    if (els.solarDateInput) els.solarDateInput.addEventListener('change', function () {
      var date = parseDateValue(els.solarDateInput.value);
      if (!date || !isSupportedDate(date.year, date.month, date.day)) {
        setResult('result-solar2lunar', convertChinese('请输入1900年1月31日至2100年12月31日内的日期，然后再转换。'));
        return;
      }
      selectDate(date.year, date.month, date.day, false);
    });
    if (els.solarDateInput) els.solarDateInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') convertSolarToLunar();
    });
    if (els.lunarYearInput) els.lunarYearInput.addEventListener('change', updateLeapUI);
    if (els.lunarMonthInput) els.lunarMonthInput.addEventListener('change', updateLeapUI);
    if (els.scriptToggle) els.scriptToggle.addEventListener('click', toggleScript);
    [].forEach.call(els.tabs, function (tab) {
      tab.addEventListener('click', function () { switchTab(tab); });
      tab.addEventListener('keydown', function (e) {
        var index = Array.prototype.indexOf.call(els.tabs, tab);
        var nextIndex = index;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextIndex = (index + 1) % els.tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nextIndex = (index - 1 + els.tabs.length) % els.tabs.length;
        else if (e.key === 'Home') nextIndex = 0;
        else if (e.key === 'End') nextIndex = els.tabs.length - 1;
        else return;
        e.preventDefault();
        switchTab(els.tabs[nextIndex]);
        els.tabs[nextIndex].focus();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
