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
  };

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

  function toggleScript() {
    useTraditional = !useTraditional;
    if (els.scriptToggle) {
      els.scriptToggle.textContent = useTraditional ? '简体' : '繁體';
    }
    try { localStorage.setItem('calendar-script', useTraditional ? 't' : 's'); } catch (e) {}
    updateStaticText();
    renderCalendar();
    var curTab = document.querySelector('.tab.active');
    if (curTab) {
      var panelId = curTab.dataset.panel;
      if (panelId === 'solar2lunar' && els.solarDateInput && els.solarDateInput.value) convertSolarToLunar();
      else if (panelId === 'lunar2solar') convertLunarToSolar();
    }
  }

  function resolveLunarLib() {
    if (typeof solarLunar === 'undefined' || solarLunar === null) return null;
    if (typeof solarLunar.solar2lunar === 'function') return solarLunar;
    if (solarLunar.default && typeof solarLunar.default.solar2lunar === 'function') return solarLunar.default;
    return null;
  }

  function updateStaticText() {
    if (els.legendMonthStart) els.legendMonthStart.textContent = convertChinese('农历月初');
    if (els.legendLeap) els.legendLeap.textContent = convertChinese('闰月');
    if (els.tabSolar2lunar) els.tabSolar2lunar.innerHTML = convertChinese('公历') + ' &rarr; ' + convertChinese('农历');
    if (els.tabLunar2solar) els.tabLunar2solar.innerHTML = convertChinese('农历') + ' &rarr; ' + convertChinese('公历');
    if (els.panelDescSolar) els.panelDescSolar.textContent = convertChinese('选择公历日期，查看对应农历信息。');
    if (els.panelDescLunar) els.panelDescLunar.textContent = convertChinese('输入农历日期，转换为公历。');
    if (els.labelSolarDate) els.labelSolarDate.textContent = convertChinese('公历日期：');
    if (els.labelLunarYear) els.labelLunarYear.textContent = convertChinese('年份：');
    if (els.labelLunarMonth) els.labelLunarMonth.textContent = convertChinese('月份：');
    if (els.labelLunarDay) els.labelLunarDay.textContent = convertChinese('日期：');
    if (els.labelLeap) {
      els.labelLeap.innerHTML = convertChinese('闰月') + ' (<span class="chinese-leap-indicator">' + convertChinese('闰') + '</span>)';
    }
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
    if (els.scriptToggle) els.scriptToggle.textContent = useTraditional ? '简体' : '繁體';
    var today = new Date();
    state.year = today.getFullYear();
    state.month = today.getMonth() + 1;
    bindEvents();
    setDefaultSolarDate();
    renderCalendar();
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
    var leapM = SL.leapMonth(year);
    var label = els.lunarLeapInput.closest('.checkbox-label');
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
    var today = new Date();
    var y = today.getFullYear();
    var m = String(today.getMonth() + 1).padStart(2, '0');
    var d = String(today.getDate()).padStart(2, '0');
    els.solarDateInput.value = y + '-' + m + '-' + d;
  }

  function normalizeDate(year, month) {
    if (month < 1) { month += 12; year--; }
    else if (month > 12) { month -= 12; year++; }
    return { year: year, month: month };
  }

  function renderCalendar() {
    try {
      doRender();
    } catch (e) {
      if (els.calendarGrid) {
        els.calendarGrid.innerHTML = '<div style="grid-column:1/-1;padding:30px;text-align:center;color:var(--red)">' +
          '日历渲染失败。<br>错误：' + e.message + '</div>';
      }
    }
  }

  function doRender() {
    if (!SL) {
      if (els.calendarGrid) {
        els.calendarGrid.innerHTML = '<div style="grid-column:1/-1;padding:30px;text-align:center;color:var(--red)">' +
          '日历库未加载，请检查网络连接后刷新。</div>';
      }
      if (els.calendarHeader) els.calendarHeader.textContent = '--';
      return;
    }

    var year = state.year;
    var month = state.month;
    if (els.calendarHeader) els.calendarHeader.textContent = year + '年' + month + '月';

    var firstDay = new Date(year, month - 1, 1).getDay();
    var daysInMonth = new Date(year, month, 0).getDate();
    var daysInPrevMonth = new Date(year, month - 1, 0).getDate();
    var prevNorm = normalizeDate(year, month - 1);
    var nextNorm = normalizeDate(year, month + 1);

    var html = '';
    html += '<div class="day-header">日</div><div class="day-header">一</div><div class="day-header">二</div><div class="day-header">三</div><div class="day-header">四</div><div class="day-header">五</div><div class="day-header">六</div>';

    var dayCount = 1, nextMonthDay = 1, started = false;
    for (var row = 0; row < 6; row++) {
      for (var col = 0; col < 7; col++) {
        if (!started && row === 0 && col < firstDay) {
          html += buildCell(prevNorm.year, prevNorm.month, daysInPrevMonth - firstDay + col + 1, true);
        } else if (!started && row === 0 && col >= firstDay) {
          started = true;
          html += buildCell(year, month, dayCount, false);
          dayCount++;
        } else if (started && dayCount <= daysInMonth) {
          html += buildCell(year, month, dayCount, false);
          dayCount++;
        } else if (started) {
          html += buildCell(nextNorm.year, nextNorm.month, nextMonthDay, true);
          nextMonthDay++;
        }
      }
    }

    if (els.calendarGrid) els.calendarGrid.innerHTML = html;
  }

  function buildCell(year, month, day, isOther) {
    if (!SL) {
      return '<div class="day-cell' + (isOther ? ' other-month' : '') + '" data-year="' + year + '" data-month="' + month + '" data-day="' + day + '"><span class="gregorian-date">' + day + '</span></div>';
    }

    var lunar = SL.solar2lunar(year, month, day);
    var today = new Date();
    var todayStr = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var dateStr = year + '-' + month + '-' + day;
    var isToday = dateStr === todayStr;
    var isWeekend = new Date(year, month - 1, day).getDay();
    isWeekend = isWeekend === 0 || isWeekend === 6;

    var classes = 'day-cell';
    if (isOther) classes += ' other-month';
    if (isWeekend && !isOther) classes += ' weekend';
    if (isToday) classes += ' today';
    if (dateStr === state.selectedDate) classes += ' selected';

    var chineseText = lunar.dayCn;
    var chineseClass = 'chinese-date';
    if (lunar.lDay === 1) {
      chineseText = lunar.monthCn;
      chineseClass += ' month-start';
    }
    if (lunar.isLeap) chineseClass += ' leap-month';
    chineseText = convertChinese(chineseText);

    return '<div class="' + classes + '" data-year="' + year + '" data-month="' + month + '" data-day="' + day + '">' +
      '<span class="gregorian-date">' + day + '</span>' +
      '<span class="' + chineseClass + '">' + chineseText + '</span></div>';
  }

  function prevMonth() {
    state.month--;
    if (state.month < 1) { state.month = 12; state.year--; }
    renderCalendar();
  }

  function nextMonth() {
    state.month++;
    if (state.month > 12) { state.month = 1; state.year++; }
    renderCalendar();
  }

  function goToToday() {
    var today = new Date();
    state.year = today.getFullYear();
    state.month = today.getMonth() + 1;
    renderCalendar();
  }

  function convertSolarToLunar() {
    if (!SL) { setResult('result-solar2lunar', '库未加载，请检查网络连接。'); return; }
    var val = els.solarDateInput ? els.solarDateInput.value : '';
    if (!val) { setResult('result-solar2lunar', '请选择日期。'); return; }
    var parts = val.split('-');
    var lunar = SL.solar2lunar(parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10));
    if (!lunar || !lunar.dayCn) { setResult('result-solar2lunar', '转换失败。'); return; }
    var gzYear = convertChinese(lunar.gzYear);
    var animal = convertChinese(lunar.animal);
    var monthDay = convertChinese(lunar.monthCn + lunar.dayCn);
    setResult('result-solar2lunar',
      '<div class="result-label">' + convertChinese('农历') + '</div>' +
      '<div class="result-text"><span class="result-gz">' + gzYear + '</span>' + convertChinese('年') +
      '<span class="result-animal">(' + animal + ')</span> ' + monthDay + '</div>' +
      '<button class="btn btn-secondary" data-jump-year="' + parts[0] + '" data-jump-month="' + parts[1] + '">' +
      convertChinese('跳转到此月') + '</button>');
    bindJumpBtn('result-solar2lunar');
  }

  function convertLunarToSolar() {
    if (!SL) { setResult('result-lunar2solar', '库未加载，请检查网络连接。'); return; }
    var y = parseInt(els.lunarYearInput ? els.lunarYearInput.value : '', 10);
    var m = parseInt(els.lunarMonthInput ? els.lunarMonthInput.value : '', 10);
    var d = parseInt(els.lunarDayInput ? els.lunarDayInput.value : '', 10);
    var isLeap = els.lunarLeapInput ? els.lunarLeapInput.checked : false;
    if (isNaN(y) || y < 1900 || y > 2100) { setResult('result-lunar2solar', '请输入有效年份（1900–2100）。'); return; }
    var solar = SL.lunar2solar(y, m, d, isLeap);
    if (!solar || !solar.cDay) { setResult('result-lunar2solar', '转换失败，指定的农历日期可能不存在。'); return; }
    var dateObj = new Date(solar.cYear, solar.cMonth - 1, solar.cDay);
    var locale = useTraditional ? 'zh-TW' : 'zh-CN';
    var formatted = dateObj.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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
    [].forEach.call(els.tabs, function (t) { t.classList.remove('active'); });
    tabEl.classList.add('active');
    if (els.panels.solar2lunar) els.panels.solar2lunar.classList.toggle('active', tabId === 'solar2lunar');
    if (els.panels.lunar2solar) els.panels.lunar2solar.classList.toggle('active', tabId === 'lunar2solar');
  }

  function selectDate(year, month, day) {
    var m = String(month).padStart(2, '0');
    var d = String(day).padStart(2, '0');
    state.selectedDate = year + '-' + month + '-' + day;
    if (els.solarDateInput) els.solarDateInput.value = year + '-' + m + '-' + d;
    renderCalendar();
    convertSolarToLunar();
  }

  function bindEvents() {
    if (els.prevMonth) els.prevMonth.addEventListener('click', prevMonth);
    if (els.nextMonth) els.nextMonth.addEventListener('click', nextMonth);
    if (els.todayBtn) els.todayBtn.addEventListener('click', goToToday);
    if (els.calendarGrid) els.calendarGrid.addEventListener('click', function (e) {
      var cell = e.target.closest('.day-cell');
      if (!cell) return;
      var year = parseInt(cell.dataset.year, 10);
      var month = parseInt(cell.dataset.month, 10);
      var day = parseInt(cell.dataset.day, 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        state.year = year;
        state.month = month;
        selectDate(year, month, day);
      }
    });
    if (els.convertToLunar) els.convertToLunar.addEventListener('click', convertSolarToLunar);
    if (els.convertToSolar) els.convertToSolar.addEventListener('click', convertLunarToSolar);
    if (els.solarDateInput) els.solarDateInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') convertSolarToLunar();
    });
    if (els.lunarYearInput) els.lunarYearInput.addEventListener('change', updateLeapUI);
    if (els.lunarMonthInput) els.lunarMonthInput.addEventListener('change', updateLeapUI);
    if (els.scriptToggle) els.scriptToggle.addEventListener('click', toggleScript);
    [].forEach.call(els.tabs, function (tab) {
      tab.addEventListener('click', function () { switchTab(tab); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
