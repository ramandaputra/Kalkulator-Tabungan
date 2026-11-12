/**
 * Kalkulator Keuangan Fleksibel
 * Pengaturan rasio 50:20:20:10 atau persentase kustom bebas dengan chart bulat SVG interaktif.
 */

(function () {
  "use strict";

  // Radius dan Keliling Lingkaran SVG Donut (r = 80)
  const CIRCLE_RADIUS = 80;
  const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS; // ~502.6548

  // State Aplikasi
  let currentRawAmount = 0;
  let copyFeedbackTimer = null;
  const ratios = {
    needs: 50,
    wants: 20,
    savings: 20,
    emergency: 10
  };

  // Elemen DOM: Input Penghasilan
  const incomeInput = document.getElementById("income-input");
  const btnClear = document.getElementById("btn-clear");
  const inputFeedback = document.getElementById("input-feedback");

  // Elemen DOM: Pengaturan Rasio
  const numNeeds = document.getElementById("num-needs");
  const numWants = document.getElementById("num-wants");
  const numSavings = document.getElementById("num-savings");
  const numEmergency = document.getElementById("num-emergency");

  const totalPctBadge = document.getElementById("total-pct-badge");
  const btnAutoBalance = document.getElementById("btn-auto-balance");
  const selectRulePreset = document.getElementById("select-rule-preset");
  const ratioFeedback = document.getElementById("ratio-feedback");

  // Elemen DOM: Tampilan Hasil & State
  const emptyState = document.getElementById("empty-state");
  const resultsView = document.getElementById("results-view");
  const totalSummary = document.getElementById("total-summary");

  // Elemen DOM: Chart Bulat (Donut SVG) & Center Info
  const segNeeds = document.getElementById("seg-needs");
  const segWants = document.getElementById("seg-wants");
  const segSavings = document.getElementById("seg-savings");
  const segEmergency = document.getElementById("seg-emergency");

  const donutCenterLabel = document.getElementById("donut-center-label");
  const donutCenterAmount = document.getElementById("donut-center-amount");
  const donutCenterPct = document.getElementById("donut-center-pct");

  // Elemen DOM: Rincian 4 Pos Alokasi
  const breakdownItems = document.querySelectorAll(".breakdown-item");

  const cardPctNeeds = document.getElementById("card-pct-needs");
  const cardPctWants = document.getElementById("card-pct-wants");
  const cardPctSavings = document.getElementById("card-pct-savings");
  const cardPctEmergency = document.getElementById("card-pct-emergency");

  const valNeeds = document.getElementById("val-needs");
  const valWants = document.getElementById("val-wants");
  const valSavings = document.getElementById("val-savings");
  const valEmergency = document.getElementById("val-emergency");

  const dailyNeeds = document.getElementById("daily-needs");
  const dailyWants = document.getElementById("daily-wants");
  const yearlySavings = document.getElementById("yearly-savings");
  const targetEmergency = document.getElementById("target-emergency");

  // Elemen DOM: Aksi & Tema
  const btnCopy = document.getElementById("btn-copy");
  const btnReset = document.getElementById("btn-reset");
  const copyStatus = document.getElementById("copy-status");
  const themeToggle = document.getElementById("theme-toggle");
  const themeText = document.getElementById("theme-text");

  // ==========================================
  // Helper Format Rupiah & Angka
  // ==========================================

  function formatRupiahNumber(num) {
    if (isNaN(num) || num === null) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function formatCurrency(num) {
    return "Rp " + formatRupiahNumber(Math.round(num));
  }

  function parseRupiahInput(str) {
    if (!str) return 0;
    const cleanStr = str.replace(/[^\d]/g, "");
    const parsed = parseInt(cleanStr, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  // ==========================================
  // Manajemen Rasio & Sliders
  // ==========================================

  function getTotalPercentage() {
    return ratios.needs + ratios.wants + ratios.savings + ratios.emergency;
  }

  function updateRatioStatus() {
    const total = getTotalPercentage();
    totalPctBadge.textContent = "Total: " + total + "%";

    if (total === 100) {
      totalPctBadge.className = "total-pct-badge pct-ok";
      btnAutoBalance.classList.add("hidden");
      ratioFeedback.textContent = "Total porsi alokasi sudah pas 100%.";
    } else {
      totalPctBadge.className = "total-pct-badge pct-warn";
      btnAutoBalance.classList.remove("hidden");
      const diff = total - 100;
      if (diff > 0) {
        ratioFeedback.textContent = "Total melebihi 100% (" + total + "%). Anda bisa menyamakan rasio dengan tombol Seimbangkan ke 100%.";
      } else {
        ratioFeedback.textContent = "Total masih kurang dari 100% (tersisa " + (100 - total) + "% belum dialokasikan).";
      }
    }
  }

  function setCategoryRatio(category, value) {
    let clamped = Math.max(0, Math.min(100, Math.round(value)));
    if (isNaN(clamped)) clamped = 0;
    ratios[category] = clamped;

    if (category === "needs") {
      numNeeds.value = clamped;
    } else if (category === "wants") {
      numWants.value = clamped;
    } else if (category === "savings") {
      numSavings.value = clamped;
    } else if (category === "emergency") {
      numEmergency.value = clamped;
    }

    updateRatioStatus();
    syncRuleDropdown();
    updateCalculations(currentRawAmount);
  }

  function applyRulePreset(n, w, s, e) {
    ratios.needs = n;
    ratios.wants = w;
    ratios.savings = s;
    ratios.emergency = e;

    numNeeds.value = n;
    numWants.value = w;
    numSavings.value = s;
    numEmergency.value = e;

    updateRatioStatus();
    syncRuleDropdown();
    updateCalculations(currentRawAmount);
  }

  function syncRuleDropdown() {
    if (!selectRulePreset) return;
    const currentStr = ratios.needs + "," + ratios.wants + "," + ratios.savings + "," + ratios.emergency;
    let found = false;
    for (let i = 0; i < selectRulePreset.options.length; i++) {
      if (selectRulePreset.options[i].value === currentStr) {
        selectRulePreset.selectedIndex = i;
        found = true;
        break;
      }
    }
    if (!found) {
      selectRulePreset.value = "custom";
    }
  }

  // Normalisasi rasio agar pas 100%
  function autoBalanceTo100() {
    const total = getTotalPercentage();
    if (total === 0) {
      applyRulePreset(50, 20, 20, 10);
      return;
    }

    const factor = 100 / total;
    let n = Math.round(ratios.needs * factor);
    let w = Math.round(ratios.wants * factor);
    let s = Math.round(ratios.savings * factor);
    let e = 100 - (n + w + s);

    if (e < 0) {
      n += e;
      e = 0;
    }

    applyRulePreset(n, w, s, e);
  }

  // Event Listener Input Angka Persentase Manual
  function bindNumberInput(numEl, category) {
    numEl.addEventListener("input", function () {
      const val = parseInt(this.value, 10);
      setCategoryRatio(category, isNaN(val) ? 0 : val);
    });

    numEl.addEventListener("blur", function () {
      if (this.value === "" || isNaN(parseInt(this.value, 10))) {
        setCategoryRatio(category, 0);
      }
    });
  }

  bindNumberInput(numNeeds, "needs");
  bindNumberInput(numWants, "wants");
  bindNumberInput(numSavings, "savings");
  bindNumberInput(numEmergency, "emergency");

  btnAutoBalance.addEventListener("click", autoBalanceTo100);

  if (selectRulePreset) {
    selectRulePreset.addEventListener("change", function () {
      const val = this.value;
      if (val === "custom") return;
      const parts = val.split(",").map(Number);
      if (parts.length === 4) {
        applyRulePreset(parts[0], parts[1], parts[2], parts[3]);
      }
    });
  }

  // ==========================================
  // Render Chart Bulat (SVG Donut)
  // ==========================================

  function renderDonutChart(amount) {
    const totalPct = getTotalPercentage();
    const safeTotal = totalPct > 0 ? totalPct : 100;

    // Hitung proporsi lingkaran
    const fracNeeds = ratios.needs / safeTotal;
    const fracWants = ratios.wants / safeTotal;
    const fracSavings = ratios.savings / safeTotal;
    const fracEmergency = ratios.emergency / safeTotal;

    const lenNeeds = fracNeeds * CIRCUMFERENCE;
    const lenWants = fracWants * CIRCUMFERENCE;
    const lenSavings = fracSavings * CIRCUMFERENCE;
    const lenEmergency = fracEmergency * CIRCUMFERENCE;

    // Segment 1: Kebutuhan
    segNeeds.style.strokeDasharray = lenNeeds + " " + (CIRCUMFERENCE - lenNeeds);
    segNeeds.style.strokeDashoffset = "0";

    // Segment 2: Keinginan
    segWants.style.strokeDasharray = lenWants + " " + (CIRCUMFERENCE - lenWants);
    segWants.style.strokeDashoffset = "-" + lenNeeds;

    // Segment 3: Tabungan
    segSavings.style.strokeDasharray = lenSavings + " " + (CIRCUMFERENCE - lenSavings);
    segSavings.style.strokeDashoffset = "-" + (lenNeeds + lenWants);

    // Segment 4: Dana Darurat
    segEmergency.style.strokeDasharray = lenEmergency + " " + (CIRCUMFERENCE - lenEmergency);
    segEmergency.style.strokeDashoffset = "-" + (lenNeeds + lenWants + lenSavings);

    // Update Pusat Donut Default
    resetDonutCenter(amount);
  }

  function resetDonutCenter(amount) {
    donutCenterLabel.textContent = "Total Alokasi";
    donutCenterAmount.textContent = formatCurrency(amount);
    donutCenterPct.textContent = getTotalPercentage() + "%";
  }

  function setDonutCenterCategory(category) {
    let name = "";
    let pct = 0;
    if (category === "needs") {
      name = "Kebutuhan";
      pct = ratios.needs;
    } else if (category === "wants") {
      name = "Keinginan";
      pct = ratios.wants;
    } else if (category === "savings") {
      name = "Tabungan";
      pct = ratios.savings;
    } else if (category === "emergency") {
      name = "Dana Darurat";
      pct = ratios.emergency;
    }

    const catAmount = currentRawAmount * (pct / 100);
    donutCenterLabel.textContent = name;
    donutCenterAmount.textContent = formatCurrency(catAmount);
    donutCenterPct.textContent = pct + "%";
  }

  // Interaksi Hover pada Segment Donut & Legend Cards
  const segments = {
    needs: segNeeds,
    wants: segWants,
    savings: segSavings,
    emergency: segEmergency
  };

  function highlightCategory(category) {
    setDonutCenterCategory(category);
    Object.keys(segments).forEach(function (key) {
      if (key === category) {
        segments[key].classList.add("highlighted");
      } else {
        segments[key].classList.remove("highlighted");
      }
    });
  }

  function unhighlightAll() {
    resetDonutCenter(currentRawAmount);
    Object.keys(segments).forEach(function (key) {
      segments[key].classList.remove("highlighted");
    });
  }

  // Event listeners pada masing-masing segment donut
  Object.keys(segments).forEach(function (key) {
    const el = segments[key];
    el.addEventListener("mouseenter", function () { highlightCategory(key); });
    el.addEventListener("mouseleave", unhighlightAll);
  });

  // Event listeners pada kartu rincian alokasi
  breakdownItems.forEach(function (card) {
    const cat = card.dataset.category;
    card.addEventListener("mouseenter", function () { highlightCategory(cat); });
    card.addEventListener("mouseleave", unhighlightAll);
    card.addEventListener("focus", function () { highlightCategory(cat); });
    card.addEventListener("blur", unhighlightAll);
  });

  // ==========================================
  // Kalkulasi & Update Tampilan
  // ==========================================

  function updateCalculations(amount) {
    currentRawAmount = amount;

    if (amount <= 0) {
      emptyState.classList.remove("hidden");
      resultsView.classList.add("hidden");
      btnClear.classList.add("hidden");
      inputFeedback.classList.add("hidden");
      inputFeedback.textContent = "";
      renderDonutChart(0);
      return;
    }

    // Hitung nominal masing-masing pos berdasarkan persentase aktif
    const needsAmount = amount * (ratios.needs / 100);
    const wantsAmount = amount * (ratios.wants / 100);
    const savingsAmount = amount * (ratios.savings / 100);
    const emergencyAmount = amount * (ratios.emergency / 100);

    // Perhitungan kontekstual
    const perDayNeeds = Math.round(needsAmount / 30);
    const perDayWants = Math.round(wantsAmount / 30);
    const perYearSavings = Math.round(savingsAmount * 12);
    const emergencyTargetMin = Math.round(needsAmount * 3);
    const emergencyTargetMax = Math.round(needsAmount * 6);

    // Update Header Hasil
    totalSummary.textContent = "Total: " + formatCurrency(amount);

    // Update Persentase pada Badge
    cardPctNeeds.textContent = ratios.needs + "%";
    cardPctWants.textContent = ratios.wants + "%";
    cardPctSavings.textContent = ratios.savings + "%";
    cardPctEmergency.textContent = ratios.emergency + "%";

    // Update Nilai pada Kartu Detail
    valNeeds.textContent = formatCurrency(needsAmount);
    valWants.textContent = formatCurrency(wantsAmount);
    valSavings.textContent = formatCurrency(savingsAmount);
    valEmergency.textContent = formatCurrency(emergencyAmount);

    dailyNeeds.textContent = ratios.needs > 0 ? "Sekitar " + formatCurrency(perDayNeeds) + " / hari (30 hari)" : "Pos ini dinonaktifkan (0%)";
    dailyWants.textContent = ratios.wants > 0 ? "Sekitar " + formatCurrency(perDayWants) + " / hari (30 hari)" : "Pos ini dinonaktifkan (0%)";
    yearlySavings.textContent = "Akumulasi: " + formatCurrency(perYearSavings) + " / tahun";
    targetEmergency.textContent = emergencyTargetMin > 0 ? "Target ideal: " + formatCurrency(emergencyTargetMin) + " s.d. " + formatCurrency(emergencyTargetMax) : "Target: Siapkan 3-6 bulan kebutuhan pokok";

    // Render SVG Donut Chart
    renderDonutChart(amount);

    emptyState.classList.add("hidden");
    resultsView.classList.remove("hidden");
    btnClear.classList.remove("hidden");
    inputFeedback.classList.add("hidden");
    inputFeedback.textContent = "";
  }

  // ==========================================
  // Event Listener Input Penghasilan
  // ==========================================

  incomeInput.addEventListener("input", function (e) {
    const rawVal = parseRupiahInput(e.target.value);

    if (rawVal === 0) {
      incomeInput.value = "";
      updateCalculations(0);
      return;
    }

    if (rawVal > 1000000000000) {
      inputFeedback.textContent = "Nominal melebihi batas kalkulator (maksimal Rp 1 Triliun).";
      inputFeedback.classList.remove("hidden");
      return;
    }

    incomeInput.value = formatRupiahNumber(rawVal);
    updateCalculations(rawVal);
  });

  btnClear.addEventListener("click", function () {
    incomeInput.value = "";
    incomeInput.focus();
    updateCalculations(0);
  });

  incomeInput.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      incomeInput.value = "";
      updateCalculations(0);
    }
  });

  // ==========================================
  // Tombol Salin Ringkasan & Reset
  // ==========================================

  btnCopy.addEventListener("click", function () {
    if (currentRawAmount <= 0) return;

    const needs = currentRawAmount * (ratios.needs / 100);
    const wants = currentRawAmount * (ratios.wants / 100);
    const savings = currentRawAmount * (ratios.savings / 100);
    const emergency = currentRawAmount * (ratios.emergency / 100);

    const ratioStr = ratios.needs + ":" + ratios.wants + ":" + ratios.savings + ":" + ratios.emergency;

    const summaryText = [
      "Kalkulator Keuangan Fleksibel (Pola " + ratioStr + ")",
      "Total Penghasilan: " + formatCurrency(currentRawAmount) + " / bulan",
      "",
      "• " + ratios.needs + "% Kebutuhan Pokok: " + formatCurrency(needs) + (ratios.needs > 0 ? " (~" + formatCurrency(needs / 30) + "/hari)" : ""),
      "• " + ratios.wants + "% Keinginan / Jajan: " + formatCurrency(wants) + (ratios.wants > 0 ? " (~" + formatCurrency(wants / 30) + "/hari)" : ""),
      "• " + ratios.savings + "% Tabungan & Investasi: " + formatCurrency(savings) + " (" + formatCurrency(savings * 12) + "/tahun)",
      "• " + ratios.emergency + "% Dana Darurat: " + formatCurrency(emergency) + (needs > 0 ? " (Target ideal 3-6x: " + formatCurrency(needs * 3) + " s.d. " + formatCurrency(needs * 6) + ")" : ""),
      "",
      "Total Alokasi Terdistribusi: " + getTotalPercentage() + "%",
      "Dihitung via Kalkulator Tabungan Fleksibel"
    ].join("\n");

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summaryText)
        .then(showCopySuccess)
        .catch(fallbackCopy);
    } else {
      fallbackCopy();
    }

    function fallbackCopy() {
      const tempArea = document.createElement("textarea");
      tempArea.value = summaryText;
      tempArea.style.position = "fixed";
      tempArea.style.opacity = "0";
      document.body.appendChild(tempArea);
      tempArea.select();
      try {
        document.execCommand("copy");
        showCopySuccess();
      } catch (err) {
        showCopyError();
      }
      document.body.removeChild(tempArea);
    }

    function showCopySuccess() {
      clearTimeout(copyFeedbackTimer);
      copyStatus.textContent = "Ringkasan berhasil disalin!";
      copyStatus.style.color = "var(--success)";
      copyFeedbackTimer = setTimeout(function () {
        copyStatus.textContent = "";
      }, 3000);
    }

    function showCopyError() {
      clearTimeout(copyFeedbackTimer);
      copyStatus.textContent = "Gagal menyalin ringkasan.";
      copyStatus.style.color = "var(--danger)";
      copyFeedbackTimer = setTimeout(function () {
        copyStatus.textContent = "";
      }, 3000);
    }
  });

  btnReset.addEventListener("click", function () {
    incomeInput.value = "";
    applyRulePreset(50, 20, 20, 10);
    updateCalculations(0);
    incomeInput.focus();
  });

  // ==========================================
  // Tema (Light & Dark)
  // ==========================================

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tabungan-theme", theme);
    const isDark = theme === "dark";
    themeToggle.setAttribute("aria-label", isDark ? "Beralih ke tema terang" : "Beralih ke tema gelap");
    if (themeText) {
      themeText.textContent = isDark ? "Gelap" : "Terang";
    }
  }

  function initTheme() {
    const savedTheme = localStorage.getItem("tabungan-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      applyTheme(savedTheme);
      return;
    }
    const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(systemPrefersDark ? "dark" : "light");
  }

  themeToggle.addEventListener("click", function () {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  });

  // Inisialisasi awal
  initTheme();
  updateRatioStatus();
  syncRuleDropdown();
  updateCalculations(0);
})();
