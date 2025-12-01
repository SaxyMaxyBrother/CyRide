// Smooth scroll to poll
document.getElementById("scrollToPoll").addEventListener("click", () => {
  document.getElementById("poll").scrollIntoView({ behavior: "smooth" });
});

// Fact number animation
function animateFacts() {
  const facts = document.querySelectorAll(".fact-number");
  facts.forEach((el) => {
    const target = Number(el.dataset.target || "0");
    let current = 0;
    const duration = 1200;
    const steps = 40;
    const increment = target / steps;
    const stepTime = duration / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent =
        target >= 1000
          ? Math.round(current).toLocaleString()
          : Math.round(current);
    }, stepTime);
  });
}

// Toggle details in argument cards
document.querySelectorAll(".toggle-details").forEach((btn) => {
  btn.addEventListener("click", () => {
    const details = btn.nextElementSibling;
    if (!details) return;
    const isOpen = details.style.display === "block";
    details.style.display = isOpen ? "none" : "block";
    btn.textContent = isOpen ? "Show more" : "Show less";
  });
});

// Chart animation (based on number of routes)
function animateChart() {
  const rows = document.querySelectorAll(".chart-row");
  let maxValue = 0;

  rows.forEach((row) => {
    const bar = row.querySelector(".chart-bar");
    const valueText = row.querySelector(".chart-value");
    const valueMatch = valueText.textContent.match(/(\d+)/);
    if (!valueMatch) return;
    const value = Number(valueMatch[1]);
    bar.dataset.value = value;
    if (value > maxValue) maxValue = value;
  });

  rows.forEach((row) => {
    const bar = row.querySelector(".chart-bar");
    const value = Number(bar.dataset.value || "0");
    const percentage = (value / maxValue) * 100;

    // Add a fill element inside the bar
    const fill = document.createElement("div");
    fill.className = "chart-bar-fill";
    bar.appendChild(fill);

    // Trigger animation in the next frame
    requestAnimationFrame(() => {
      fill.style.width = `${percentage}%`;
    });
  });
}

// --- Poll logic using localStorage ---

const STORAGE_KEY = "betterCyRideWeekendVotes";

function loadVotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error loading votes", e);
    return [];
  }
}

function saveVotes(votes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
  } catch (e) {
    console.error("Error saving votes", e);
  }
}

function summarizeVotes(votes) {
  const counts = {
    more_daytime: 0,
    more_evening: 0,
    more_coverage: 0,
    better_frequency: 0,
  };
  votes.forEach((v) => {
    if (counts.hasOwnProperty(v.choice)) {
      counts[v.choice] += 1;
    }
  });
  const total =
    counts.more_daytime +
    counts.more_evening +
    counts.more_coverage +
    counts.better_frequency;
  return { counts, total };
}

function updateResultsUI() {
  const votes = loadVotes();
  const { counts, total } = summarizeVotes(votes);

  const fills = document.querySelectorAll(".results-fill");
  const percents = document.querySelectorAll(".results-percent");

  fills.forEach((fill) => {
    const option = fill.dataset.option;
    const count = counts[option] || 0;
    const percent = total ? Math.round((count / total) * 100) : 0;
    fill.style.width = `${percent}%`;
  });

  percents.forEach((span) => {
    const option = span.dataset.option;
    const count = counts[option] || 0;
    const percent = total ? Math.round((count / total) * 100) : 0;
    span.textContent = `${percent}%`;
    span.title = `${count} vote(s)`;
  });

  // Fill voter table
  const tbody = document.getElementById("voterTableBody");
  tbody.innerHTML = "";
  votes.forEach((v) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${v.name}</td>
      <td>${v.email}</td>
      <td>${describeChoice(v.choice)}</td>
      <td>${new Date(v.timestamp).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

function describeChoice(choice) {
  switch (choice) {
    case "more_daytime":
      return "More daytime buses";
    case "more_evening":
      return "Later evening service";
    case "more_coverage":
      return "More coverage on weekends";
    case "better_frequency":
      return "Shorter waits (frequency)";
    default:
      return choice;
  }
}

const pollForm = document.getElementById("pollForm");
const pollMessage = document.getElementById("pollMessage");

pollForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const nameInput = document.getElementById("voterName");
  const emailInput = document.getElementById("voterEmail");
  const optionInput = pollForm.querySelector(
    "input[name='voteOption']:checked"
  );

  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const choice = optionInput ? optionInput.value : "";

  if (!name || !email || !choice) {
    showPollMessage(
      "Please fill out your name, email, and select an option.",
      true
    );
    return;
  }

  let votes = loadVotes();
  // Simple per-device "who voted" check: prevent duplicate email
  const already = votes.find((v) => v.email === email);
  if (already) {
    showPollMessage(
      "This ISU email has already voted on this device. Thank you for participating!",
      true
    );
    return;
  }

  const newVote = {
    name,
    email,
    choice,
    timestamp: Date.now(),
  };
  votes.push(newVote);
  saveVotes(votes);
  updateResultsUI();
  showPollMessage("Thanks! Your vote has been recorded on this device.", false);
  pollForm.reset();
});

function showPollMessage(msg, isError) {
  pollMessage.textContent = msg;
  pollMessage.classList.toggle("error", isError);
  pollMessage.classList.toggle("success", !isError);
}

// Reset button (for demo during class)
document.getElementById("resetVotes").addEventListener("click", () => {
  if (confirm("Reset all saved votes on this browser?")) {
    localStorage.removeItem(STORAGE_KEY);
    updateResultsUI();
    showPollMessage("Votes cleared for this device (demo only).", false);
  }
});

// On load
window.addEventListener("DOMContentLoaded", () => {
  animateFacts();
  animateChart();
  updateResultsUI();
});
