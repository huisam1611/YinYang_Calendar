(function () {
  'use strict';

  var MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  var state = { year: 0, month: 0 };
  var els = {};
  var SL = null;

  function resolveLunarLib() {
    if (typeof solarLunar === 'undefined' || solarLunar === null) return null;
    if (typeof solarLunar.solar2lunar === 'function') return solarLunar;
    if (solarLunar.default && typeof solarLunar.default.solar2lunar === 'function') return solarLunar.default;
    return null;
  }

  function init() {
    cacheElements();
    SL = resolveLunarLib();
    populateSelects();
    updateLeapUI();
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
          'Failed to render calendar. <br>Error: ' + e.message + '</div>';
      }
    }
  }

  function doRender() {
    if (!SL) {
      if (els.calendarGrid) {
        els.calendarGrid.innerHTML = '<div style="grid-column:1/-1;padding:30px;text-align:center;color:var(--red)">' +
          'Calendar library not loaded. Check your internet connection and refresh.</div>';
      }
      if (els.calendarHeader) els.calendarHeader.textContent = '--';
      return;
    }

    var year = state.year;
    var month = state.month;
    if (els.calendarHeader) els.calendarHeader.textContent = MONTH_NAMES[month - 1] + ' ' + year;

    var firstDay = new Date(year, month - 1, 1).getDay();
    var daysInMonth = new Date(year, month, 0).getDate();
    var daysInPrevMonth = new Date(year, month - 1, 0).getDate();
    var prevNorm = normalizeDate(year, month - 1);
    var nextNorm = normalizeDate(year, month + 1);

    var html = '';
    html += '<div class="day-header">Sun</div><div class="day-header">Mon</div><div class="day-header">Tue</div><div class="day-header">Wed</div><div class="day-header">Thu</div><div class="day-header">Fri</div><div class="day-header">Sat</div>';

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
      return '<div class="day-cell' + (isOther ? ' other-month' : '') + '"><span class="gregorian-date">' + day + '</span></div>';
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

    var chineseText = lunar.dayCn;
    var chineseClass = 'chinese-date';
    if (lunar.lDay === 1) {
      chineseText = lunar.monthCn;
      chineseClass += ' month-start';
    }
    if (lunar.isLeap) chineseClass += ' leap-month';

    return '<div class="' + classes + '">' +
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
    if (!SL) { setResult('result-solar2lunar', 'Library not loaded. Check your internet connection.'); return; }
    var val = els.solarDateInput ? els.solarDateInput.value : '';
    if (!val) { setResult('result-solar2lunar', 'Please select a date.'); return; }
    var parts = val.split('-');
    var lunar = SL.solar2lunar(parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10));
    if (!lunar || !lunar.dayCn) { setResult('result-solar2lunar', 'Conversion failed.'); return; }
    var monthDay = lunar.monthCn + lunar.dayCn;
    setResult('result-solar2lunar',
      '<div class="result-label">Chinese Calendar</div>' +
      '<div class="result-text"><span class="result-gz">' + lunar.gzYear + '</span>年' +
      '<span class="result-animal">(' + lunar.animal + ')</span> ' + monthDay + '</div>' +
      '<button class="btn btn-secondary" data-jump-year="' + parts[0] + '" data-jump-month="' + parts[1] + '">' +
      'Jump to this month in Calendar View</button>');
    bindJumpBtn('result-solar2lunar');
  }

  function convertLunarToSolar() {
    if (!SL) { setResult('result-lunar2solar', 'Library not loaded. Check your internet connection.'); return; }
    var y = parseInt(els.lunarYearInput ? els.lunarYearInput.value : '', 10);
    var m = parseInt(els.lunarMonthInput ? els.lunarMonthInput.value : '', 10);
    var d = parseInt(els.lunarDayInput ? els.lunarDayInput.value : '', 10);
    var isLeap = els.lunarLeapInput ? els.lunarLeapInput.checked : false;
    if (isNaN(y) || y < 1900 || y > 2100) { setResult('result-lunar2solar', 'Please enter a valid year (1900\u20132100).'); return; }
    var solar = SL.lunar2solar(y, m, d, isLeap);
    if (!solar || !solar.cDay) { setResult('result-lunar2solar', 'Conversion failed. The specified Chinese date may not exist.'); return; }
    var dateObj = new Date(solar.cYear, solar.cMonth - 1, solar.cDay);
    var formatted = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    setResult('result-lunar2solar',
      '<div class="result-label">Gregorian Calendar</div>' +
      '<div class="result-text">' + formatted + '</div>' +
      '<button class="btn btn-secondary" data-jump-year="' + solar.cYear + '" data-jump-month="' + solar.cMonth + '">' +
      'Jump to this month in Calendar View</button>');
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

  function bindEvents() {
    if (els.prevMonth) els.prevMonth.addEventListener('click', prevMonth);
    if (els.nextMonth) els.nextMonth.addEventListener('click', nextMonth);
    if (els.todayBtn) els.todayBtn.addEventListener('click', goToToday);
    if (els.convertToLunar) els.convertToLunar.addEventListener('click', convertSolarToLunar);
    if (els.convertToSolar) els.convertToSolar.addEventListener('click', convertLunarToSolar);
    if (els.solarDateInput) els.solarDateInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') convertSolarToLunar();
    });
    if (els.lunarYearInput) els.lunarYearInput.addEventListener('change', updateLeapUI);
    if (els.lunarMonthInput) els.lunarMonthInput.addEventListener('change', updateLeapUI);
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
