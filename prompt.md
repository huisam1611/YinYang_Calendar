# Project Specification: Dual Chinese-Gregorian Calendar Dashboard

## 1. Project Overview

The goal is to build a responsive, single-page web application that serves as a **Dual Chinese-Gregorian Calendar Dashboard**. The application will feature clean, modern UI styling and must include two core functionalities: a dual-calendar month view and a precise bidirectional date conversion utility mapping the Western Gregorian calendar to the Traditional Chinese Calendar (农历/阴历).

## 2. Technical Stack

* **Structure:** Semantic HTML5
* **Styling:** Modern CSS (CSS Grid/Flexbox, Custom Properties for theme colors, fully responsive layout)
* **Logic:** Vanilla JavaScript (ES6+)
* **Core Dependency:** `solarlunar.js` loaded via CDN (`[https://unpkg.com/solarlunar/dist/solarlunar.min.js](https://unpkg.com/solarlunar/dist/solarlunar.min.js)`) to handle traditional Chinese calendar calculations.

---

## 3. Core Functional Requirements

### Function 1: Dual-Calendar Month Grid (Main View)

* **The Grid:** Display a standard monthly calendar view (7 columns: Sunday to Saturday).
* **Dual-Labeling:** Every day cell in the grid must display **two** distinct pieces of information:
1. The **Gregorian day number** (large, prominent text, e.g., `21`).
2. The corresponding **Traditional Chinese Calendar day name** (smaller subtitle text underneath, using standard Chinese notation like `初五`, `十五`, or the Chinese month name like `四月` if it is the first day of the Chinese month).


* **Navigation:** Include "Previous Month" and "Next Month" buttons along with a Header showing the current displayed Year and Month (e.g., *May 2026*).
* **Today Highlight:** The current real-world date should have a distinct visual background or border to instantly catch the user's eye.

### Function 2: Bidirectional Calendar Converter

Provide a dedicated widget panel split into two toggleable modes or distinct sections:

* **Mode A: Gregorian ➔ Chinese Calendar:** User selects a standard Western date using an HTML date picker (`<input type="date">`). On submit, output the structured Chinese Calendar Date string, including the Heavenly Stems/Earthly Branches Year (`干支`) and Chinese Zodiac animal (e.g., `丙午马年 四月初五`).
* **Mode B: Chinese Calendar ➔ Gregorian:** User inputs a Chinese Calendar Year, selects a Chinese Month (1–12), specifies if it is a Chinese Leap Month (`闰月`), and selects a Chinese Day (1–30). On submit, output the corresponding Gregorian date formatted clearly (e.g., `Thursday, May 21, 2026`).

---

## 4. UI/UX & Design Guidelines

* **Aesthetic:** Clean, minimalist Asian-modern design. Use a neutral background (e.g., off-white `#f8f9fa`) with deep accent tones (such as jade green `#2e7d32` or imperial red `#c62828`) to hint at the traditional Chinese calendar theme without looking dated.
* **Scannability:** The calendar grid must use distinct visual contrast so that Gregorian numbers and Chinese characters never blur together. Weekend columns should have a subtly tinted background.
* **State Handling:** If a user performs a conversion in the Converter panel, provide an option or button to *"Jump to this month in Calendar View"* so the two features feel interconnected.

---

## 5. Sample Data Mapping (For Testing)

When testing the accuracy of the integration, the following test cases must map correctly:

* **Gregorian Input:** `2026-05-21` ➔ **Chinese Calendar Output:** `丙午年(马) 肆月 初五`
* **Chinese Calendar Input:** `2026, Month 4, Day 5` ➔ **Gregorian Output:** `2026-05-21`

---