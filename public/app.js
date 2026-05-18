const app = document.getElementById("app");

const views = {
  global: document.getElementById("tpl-global"),
  projects: document.getElementById("tpl-projects"),
  sessions: document.getElementById("tpl-sessions"),
  inspector: document.getElementById("tpl-inspector"),
};

function showView(viewName, _data = {}) {
  app.innerHTML = "";
  const template = views[viewName];
  const content = template.content.cloneNode(true);
  app.appendChild(content);

  if (viewName === "global") renderGlobal();
  if (viewName === "projects") renderProjects();
}

async function renderGlobal() {
  const res = await fetch("/api/stats/global");
  const stats = await res.json();

  document.getElementById("stat-sessions").textContent = stats.totalSessions;
  document.getElementById("stat-tools").textContent = stats.totalToolCalls;
  document.getElementById("stat-tokens").textContent = formatTokens(
    stats.totalTokens,
  );

  const toolList = document.getElementById("list-top-tools");
  toolList.innerHTML = stats.topTools.map((t) => `
        <li><strong>${t.name}</strong>: ${t.count}</li>
    `).join("");
}

async function renderProjects() {
  const res = await fetch("/api/projects");
  const projects = await res.json();

  const list = document.getElementById("project-list");
  list.innerHTML = projects.map((p) => `
        <div class="card" onclick="_showSessions('${p.id}', '${p.path}')">
            <h3>${p.path === "unknown" ? p.id : p.path}</h3>
            <p>${p.sessionCount} Sessions</p>
        </div>
    `).join("");
}

async function _showSessions(projectId, path) {
  showView("sessions");
  document.getElementById("project-name").textContent = `Project: ${
    path === "unknown" ? projectId : path
  }`;

  document.querySelector(".back-btn").onclick = () => showView("projects");

  const res = await fetch(`/api/projects/${projectId}/sessions`);
  const sessions = await res.json();

  const list = document.getElementById("session-list");
  list.innerHTML = sessions.map((s) => `
        <div class="list-item" onclick="_showInspector('${s.id}')">
            <div>
                <strong>${new Date(s.startTime).toLocaleString()}</strong>
                <span class="badge">${s.kind}</span>
            </div>
            <div>
                ${s.messageCount} messages, ${s.toolCallCount} tools
            </div>
        </div>
    `).join("");
}

async function _showInspector(sessionId) {
  showView("inspector");
  document.getElementById("session-title").textContent = `Session ${
    sessionId.substring(0, 8)
  }`;

  // Find project ID for back button - we'll just go back to projects for now to keep it simple
  document.querySelector(".back-btn").onclick = () => showView("projects");

  const res = await fetch(`/api/sessions/${sessionId}`);
  const data = await res.json();

  const list = document.getElementById("message-list");
  list.innerHTML = data.messages.map((m) => `
        <div class="message ${m.type}">
            <div class="meta">${
    new Date(m.timestamp).toLocaleTimeString()
  } - ${m.type}</div>
            <div class="content">${formatContent(m.content)}</div>
            ${
    m.toolCalls.map((tc) => `
                <div class="tool-call">
                    <strong>${tc.name}</strong>(${
      JSON.stringify(tc.args).substring(0, 100)
    }...)
                    <span class="status">${tc.status}</span>
                </div>
            `).join("")
  }
        </div>
    `).join("");
}

function formatTokens(n) {
  if (n > 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n > 1000) return (n / 1000).toFixed(1) + "k";
  return n;
}

function formatContent(content) {
  if (content === null || content === undefined) return "";
  if (typeof content !== "string") return JSON.stringify(content);
  return content.replace(/\n/g, "<br>");
}

// Nav events
document.getElementById("nav-global").onclick = () => showView("global");
document.getElementById("nav-projects").onclick = () => showView("projects");

// Init
showView("global");
