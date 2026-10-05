document.addEventListener("DOMContentLoaded", function () {
  var scholarships = Array.isArray(window.SCHOLARSHIPS) ? window.SCHOLARSHIPS : [];
  function $(selector) { return document.querySelector(selector); }

  var grid = $("#grid");
  var input = $("#searchInput");
  var level = $("#levelFilter");
  var nationality = $("#nationalityFilter");
  var field = $("#fieldFilter");
  var sort = $("#sortFilter");
  var count = $("#count");
  var summary = $("#resultSummary");
  var total = $("#totalCount");

  if (!grid || !input || !level || !nationality || !field || !sort || !count || !summary || !total) {
    return;
  }

  total.textContent = scholarships.length;

  function searchableText(s) {
    return [
      s.name, s.provider, s.field, s.award,
      ...(s.nationality || []),
      ...(s.levels || [])
    ].join(" ").toLowerCase();
  }

  function fieldMatches(s, value) {
    if (!value) return true;
    var f = String(s.field || "").toLowerCase();

    if (value === "STEM") {
      return /engineering|computing|ai|science|technology/.test(f);
    }
    if (value === "Computing / AI") {
      return /computing|artificial intelligence|\bai\b/.test(f);
    }
    return s.field === value || f.indexOf(value.toLowerCase()) !== -1;
  }

  function deadlineKey(value) {
    var match = String(value || "").match(/(\d{1,2})[–-](\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (!match) return Number.MAX_SAFE_INTEGER;

    var months = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };

    return new Date(
      Number(match[4]),
      months[match[3].slice(0, 3).toLowerCase()] || 0,
      Number(match[2])
    ).getTime();
  }

  function score(s, query) {
    return query.split(/\s+/).filter(Boolean).reduce(function (n, word) {
      return n + (searchableText(s).indexOf(word) !== -1 ? 1 : 0);
    }, 0);
  }

  function render() {
    var query = input.value.toLowerCase().trim();

    var list = scholarships.filter(function (s) {
      var levelOK = !level.value || (s.levels || []).indexOf(level.value) !== -1;
      var nationalityOK =
        !nationality.value ||
        (s.nationality || []).indexOf(nationality.value) !== -1 ||
        (s.nationality || []).indexOf("Various") !== -1;
      var fieldOK = fieldMatches(s, field.value);
      var searchOK = !query || searchableText(s).indexOf(query) !== -1;

      return levelOK && nationalityOK && fieldOK && searchOK;
    });

    if (sort.value === "name") {
      list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    } else if (sort.value === "deadline") {
      list.sort(function (a, b) { return deadlineKey(a.deadline) - deadlineKey(b.deadline); });
    } else if (sort.value === "relevance" && query) {
      list.sort(function (a, b) { return score(b, query) - score(a, query); });
    }

    count.textContent = list.length;
    summary.textContent =
      list.length + " result" + (list.length === 1 ? "" : "s") +
      " · filters update instantly";

    grid.innerHTML = list.map(function (s) {
      var tags = (s.levels || []).slice(0, 2).concat([s.field]).filter(Boolean).slice(0, 3);

      return '<article class="card">' +
        '<div class="tags">' +
          tags.map(function (tag) { return '<span class="tag">' + tag + '</span>'; }).join("") +
        '</div>' +
        '<h3>' + s.name + '</h3>' +
        '<div class="provider">' + s.provider + '</div>' +
        '<div class="meta">' +
          '<div><small>Eligibility</small><b>' + ((s.nationality || []).join(", ") || "See official source") + '</b></div>' +
          '<div><small>Award</small><b>' + s.award + '</b></div>' +
          '<div><small>Field</small><b>' + s.field + '</b></div>' +
          '<div><small>Deadline</small><b>' + s.deadline + '</b></div>' +
        '</div>' +
        '<div class="card-actions">' +
          '<a href="scholarship.html?id=' + encodeURIComponent(s.name) + '">View details →</a>' +
          '<a href="' + s.source + '" target="_blank" rel="noopener">Official source ↗</a>' +
        '</div>' +
        '<div class="verified">Verified ' + s.verified + '</div>' +
      '</article>';
    }).join("") || '<div class="empty"><h3>No matching scholarships</h3><p>Try removing a filter or searching a broader term.</p></div>';
  }

  [input, level, nationality, field, sort].forEach(function (element) {
    element.addEventListener("change", render);
    element.addEventListener("input", render);
  });

  var searchButton = $("#searchBtn");
  if (searchButton) {
    searchButton.addEventListener("click", function () {
      render();
      location.hash = "categories";
    });
  }

  var clearButton = $("#clearFilters");
  if (clearButton) {
    clearButton.addEventListener("click", function () {
      input.value = "";
      level.value = "";
      nationality.value = "";
      field.value = "";
      sort.value = "relevance";
      render();
    });
  }

  document.querySelectorAll("[data-filter]").forEach(function (button) {
    button.addEventListener("click", function () {
      var value = button.getAttribute("data-filter");

      input.value = "";
      level.value = ["Secondary", "JC", "Polytechnic", "University"].indexOf(value) !== -1 ? value : "";
      nationality.value = ["Singapore Citizen", "PR", "International", "ASEAN international"].indexOf(value) !== -1 ? value : "";
      field.value = value === "STEM" ? "STEM" : "";

      render();
      location.hash = "categories";
    });
  });

  var matchForm = $("#matchForm");
  if (matchForm) {
    matchForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var matchLevel = $("#matchLevel").value;
      var matchNationality = $("#matchNationality").value;
      var matchField = $("#matchField").value;
      var results = $("#matchResults");

      var ranked = scholarships.map(function (s) {
        var points = 0;
        var why = [];

        if (matchLevel && (s.levels || []).indexOf(matchLevel) !== -1) {
          points += 40;
          why.push("education");
        }

        if (
          matchNationality &&
          (
            (s.nationality || []).indexOf(matchNationality) !== -1 ||
            (s.nationality || []).indexOf("Various") !== -1
          )
        ) {
          points += 35;
          why.push("eligibility");
        }

        if (matchField && fieldMatches(s, matchField)) {
          points += 25;
          why.push("field");
        }

        return { scholarship: s, points: points, why: why };
      }).filter(function (item) {
        return item.points > 0;
      }).sort(function (a, b) {
        return b.points - a.points;
      }).slice(0, 5);

      results.innerHTML = ranked.length
        ? "<h3>Top matches</h3>" + ranked.map(function (item) {
            var s = item.scholarship;
            return '<div class="match-item">' +
              '<div><b>' + s.name + '</b><small>' + s.provider + ' · ' + item.why.join(" + ") + '</small></div>' +
              '<strong>' + item.points + '%</strong>' +
              '<a href="scholarship.html?id=' + encodeURIComponent(s.name) + '">View →</a>' +
            '</div>';
          }).join("")
        : '<p class="empty-note">Choose at least one preference to get matches.</p>';
    });
  }

  render();
});