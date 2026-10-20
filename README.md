# 陰陽曆儀表板 / Dual Calendar Dashboard

一個輕量、響應式的公曆與農曆月曆工具，可在瀏覽器中直接使用。

A lightweight, responsive Gregorian–Chinese lunar calendar that runs directly in the browser.

[繁體中文](#繁體中文) · [English](#english)

---

## 繁體中文

### 功能

- 同時顯示公曆日期與農曆日期的月曆
- 公曆與農曆雙向日期轉換
- 自動識別並顯示閏月選項
- 從轉換結果跳轉至對應月份
- 簡體／繁體中文切換，並在瀏覽器中保存偏好
- 支援方向鍵操作日期，以及頁籤鍵盤導覽
- 桌面以月曆為主、右側顯示所選日期與轉換器；手機先顯示日期對照，轉換區可展開
- 支援日期範圍：`1900-01-31` 至 `2100-12-31`

### 使用方式

1. 下載或複製此專案。
2. 直接用瀏覽器開啟 `index.html`。
3. 保持網路連線，以便從 CDN 載入 `solarlunar.js`。

此專案不需要 npm、建置工具或後端服務。

### 專案結構

```text
YinYang_Calendar/
├── index.html   # 頁面結構
├── styles.css   # 版面、色彩與響應式樣式
├── script.js    # 月曆、轉換與互動邏輯
└── README.md
```

### 技術

- HTML5
- CSS Grid、Flexbox 與自訂屬性
- 原生 JavaScript
- [solarlunar.js](https://www.npmjs.com/package/solarlunar)

### 無障礙功能

- 日期格可使用鍵盤方向鍵操作
- 轉換頁籤支援方向鍵、Home 與 End
- 動態結果與月份標題提供螢幕閱讀器通知
- 互動元件具有清楚的焦點樣式與最小觸控尺寸
- 遵循系統的減少動態效果偏好

### 介面回歸測試

測試環境需有 Node.js、Playwright 與 Chrome。執行 `node tests/ui-smoke.cjs`，測試會自動啟動並關閉本機伺服器。

測試涵蓋桌面／手機配置、雙向轉換、閏月、簡繁切換、鍵盤選日及日期邊界。一般使用不需要這些測試工具。

---

## English

### Features

- Monthly calendar showing Gregorian and Chinese lunar dates together
- Two-way Gregorian and lunar date conversion
- Automatic leap-month detection
- Jump from a conversion result to the corresponding calendar month
- Simplified/Traditional Chinese toggle with saved browser preference
- Arrow-key date navigation and keyboard-accessible tabs
- Calendar-first desktop layout with a selected-date sidebar; mobile date summary and expandable converter
- Supported date range: `1900-01-31` to `2100-12-31`

### Usage

1. Download or clone this project.
2. Open `index.html` in a browser.
3. Keep an internet connection available so `solarlunar.js` can load from the CDN.

No npm installation, build process, or backend service is required.

### Project Structure

```text
YinYang_Calendar/
├── index.html   # Page structure
├── styles.css   # Layout, colors, and responsive styles
├── script.js    # Calendar, conversion, and interaction logic
└── README.md
```

### Technology

- HTML5
- CSS Grid, Flexbox, and custom properties
- Vanilla JavaScript
- [solarlunar.js](https://www.npmjs.com/package/solarlunar)

### Accessibility

- Arrow-key navigation between calendar dates
- Arrow keys, Home, and End support for conversion tabs
- Screen-reader announcements for dynamic results and month changes
- Visible focus states and touch-friendly control sizes
- Reduced-motion preference support

### UI Regression Check

The test environment requires Node.js, Playwright, and Chrome. Run `node tests/ui-smoke.cjs`; the check starts and stops its own local server.

The check covers desktop/mobile layouts, both conversion directions, leap months, language switching, keyboard selection, and date boundaries. These test tools are not required for normal use.
