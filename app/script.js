function selectPlant() {
  const pid = localStorage.getItem("selectedPlantPid");
  if (!pid) {
    alert("Please select a plant first!");
    return;
  }
  window.location.href = "login.html";
}

const API_BASE_URL = "http://localhost:3001/api";

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getApiErrorMessage(data, fallbackMessage) {
  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error;
  }

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  return fallbackMessage;
}

function getAuthToken() {
  return localStorage.getItem("token");
}

function getStoredUser() {
  const rawUser = localStorage.getItem("user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (_error) {
    return null;
  }
}

function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

function dismissSelectedPlantPrompt() {
  const selectedPlantPromptElement = document.getElementById(
    "selectedPlantPrompt",
  );
  const selectedPlantActionMessageElement = document.getElementById(
    "selectedPlantActionMessage",
  );

  if (!selectedPlantPromptElement || !selectedPlantActionMessageElement) {
    return;
  }

  selectedPlantActionMessageElement.textContent = "";
  selectedPlantPromptElement.hidden = true;
}

function renderSelectedPlantPrompt() {
  const selectedPlantPromptElement = document.getElementById(
    "selectedPlantPrompt",
  );
  const selectedPlantNameElement = document.getElementById("selectedPlantName");
  const selectedPlantActionMessageElement = document.getElementById(
    "selectedPlantActionMessage",
  );

  if (
    !selectedPlantPromptElement ||
    !selectedPlantNameElement ||
    !selectedPlantActionMessageElement
  ) {
    return;
  }

  const selectedPlantPid = localStorage.getItem("selectedPlantPid");
  const selectedPlantLabel = localStorage.getItem("selectedPlant");

  if (!selectedPlantPid) {
    selectedPlantPromptElement.hidden = true;
    return;
  }

  selectedPlantNameElement.textContent = `Selected plant: ${selectedPlantLabel || selectedPlantPid}`;
  selectedPlantActionMessageElement.textContent = "";
  selectedPlantPromptElement.hidden = false;
}

async function handleSaveSelectedPlant() {
  const selectedPlantActionMessageElement = document.getElementById(
    "selectedPlantActionMessage",
  );
  const saveSelectedPlantButtonElement = document.getElementById(
    "saveSelectedPlantButton",
  );

  if (!selectedPlantActionMessageElement || !saveSelectedPlantButtonElement) {
    return;
  }

  const token = getAuthToken();
  const selectedPlantPid = localStorage.getItem("selectedPlantPid");
  const selectedPlantLabel = localStorage.getItem("selectedPlant");

  if (!token) {
    selectedPlantActionMessageElement.textContent = "Please login first.";
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);
    return;
  }

  if (!selectedPlantPid) {
    selectedPlantActionMessageElement.textContent = "No selected plant found.";
    return;
  }

  saveSelectedPlantButtonElement.disabled = true;
  selectedPlantActionMessageElement.textContent = "Saving selected plant...";

  try {
    const response = await fetch(`${API_BASE_URL}/plants/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        pid: selectedPlantPid,
        alias: selectedPlantLabel || selectedPlantPid,
      }),
    });

    const data = await parseJsonResponse(response);

    if (response.status === 401) {
      selectedPlantActionMessageElement.textContent = getApiErrorMessage(
        data,
        "Session expired. Please login again.",
      );
      setTimeout(() => {
        handleLogout();
      }, 1200);
      return;
    }

    if (
      response.status === 400 &&
      data?.error === "plant already in favorites"
    ) {
      selectedPlantActionMessageElement.textContent =
        "This plant is already in your favorites.";
      await loadFavoritePlants();
      return;
    }

    if (!response.ok) {
      throw new Error(
        getApiErrorMessage(data, "Could not save selected plant"),
      );
    }

    selectedPlantActionMessageElement.textContent =
      "Selected plant saved to your favorites.";
    localStorage.removeItem("selectedPlantPid");
    localStorage.removeItem("selectedPlant");
    await loadFavoritePlants();
    setTimeout(() => {
      dismissSelectedPlantPrompt();
    }, 1000);
  } catch (_error) {
    selectedPlantActionMessageElement.textContent = _error.message;
  } finally {
    saveSelectedPlantButtonElement.disabled = false;
  }
}

async function loadPlantCarePreview(pid) {
  const carePreviewElement = document.getElementById("plantCarePreview");
  if (!carePreviewElement) return;

  const token = getAuthToken();
  if (!token) {
    carePreviewElement.hidden = true;
    return;
  }

  carePreviewElement.hidden = false;
  const loadingMsg = document.createElement("p");
  loadingMsg.textContent = "Loading care details...";
  carePreviewElement.replaceChildren(loadingMsg);

  try {
    const response = await fetch(
      `${API_BASE_URL}/plants/care/${encodeURIComponent(pid)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) {
      carePreviewElement.hidden = true;
      return;
    }

    const care = await parseJsonResponse(response);
    if (!care) {
      carePreviewElement.hidden = true;
      return;
    }

    const careFields = [
      { label: "☀️ Sunlight", value: care.sunlight },
      { label: "💧 Watering", value: care.watering },
      { label: "🌱 Soil", value: care.soil },
      { label: "🌿 Fertilization", value: care.fertilization },
      { label: "✂️ Pruning", value: care.pruning },
    ];

    const hasCareData = careFields.some(({ value }) => value);

    if (!hasCareData) {
      carePreviewElement.hidden = true;
      return;
    }

    const heading = document.createElement("h3");
    heading.textContent = "Care Guide";

    const list = document.createElement("ul");
    list.className = "care-details";

    careFields.forEach(({ label, value }) => {
      if (!value) return;
      const li = document.createElement("li");
      const strong = document.createElement("strong");
      strong.textContent = `${label}: `;
      const span = document.createElement("span");
      span.textContent = value;
      li.appendChild(strong);
      li.appendChild(span);
      list.appendChild(li);
    });

    carePreviewElement.replaceChildren(heading, list);
  } catch {
    carePreviewElement.hidden = true;
  }
}

function initPlantSearch() {
  const inputEl = document.getElementById("plantSearchInput");
  if (!inputEl) return;

  // Restore previously selected plant on page load
  const storedPid = localStorage.getItem("selectedPlantPid");
  const storedLabel = localStorage.getItem("selectedPlant");
  if (storedPid && storedLabel) {
    inputEl.value = storedLabel;
    const displayEl = document.getElementById("plantSelectedDisplay");
    const nameEl = document.getElementById("plantSelectedName");
    if (nameEl) nameEl.textContent = storedLabel;
    if (displayEl) displayEl.hidden = false;
  }

  let debounceTimer = null;

  inputEl.addEventListener("input", () => {
    const q = inputEl.value.trim();
    const resultsEl = document.getElementById("plantSearchResults");
    const statusEl = document.getElementById("plantSearchStatus");
    const displayEl = document.getElementById("plantSelectedDisplay");
    const carePreviewEl = document.getElementById("plantCarePreview");

    // Clear selection when user starts typing new query
    if (displayEl) displayEl.hidden = true;
    if (carePreviewEl) carePreviewEl.hidden = true;
    localStorage.removeItem("selectedPlantPid");
    localStorage.removeItem("selectedPlant");

    if (q.length < 3) {
      if (resultsEl) {
        resultsEl.hidden = true;
        resultsEl.replaceChildren();
      }
      if (statusEl) statusEl.textContent = "";
      clearTimeout(debounceTimer);
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => searchPlantBookPlants(q), 350);
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    const resultsEl = document.getElementById("plantSearchResults");
    if (
      resultsEl &&
      !inputEl.contains(e.target) &&
      !resultsEl.contains(e.target)
    ) {
      resultsEl.hidden = true;
    }
  });
}

async function searchPlantBookPlants(q) {
  const resultsEl = document.getElementById("plantSearchResults");
  const statusEl = document.getElementById("plantSearchStatus");

  if (!resultsEl) return;

  if (statusEl) statusEl.textContent = "Searching...";
  resultsEl.hidden = true;
  resultsEl.replaceChildren();

  try {
    const response = await fetch(
      `${API_BASE_URL}/plants/search?q=${encodeURIComponent(q)}&limit=20`,
    );
    const data = await parseJsonResponse(response);

    if (!response.ok) {
      if (statusEl)
        statusEl.textContent = getApiErrorMessage(data, "Search failed.");
      return;
    }

    const results = Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data)
        ? data
        : [];

    if (results.length === 0) {
      if (statusEl) statusEl.textContent = "No plants found.";
      return;
    }

    if (statusEl)
      statusEl.textContent = `${results.length} plant${
        results.length === 1 ? "" : "s"
      } found`;

    results.forEach((plant) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "plant-result-btn";

      const label = plant.alias || plant.display_pid || plant.pid;
      const nameSpan = document.createElement("span");
      nameSpan.textContent = label;

      const pidSmall = document.createElement("small");
      pidSmall.textContent = plant.pid !== label ? ` (${plant.pid})` : "";

      btn.appendChild(nameSpan);
      btn.appendChild(pidSmall);

      btn.addEventListener("click", () => {
        localStorage.setItem("selectedPlant", label);
        localStorage.setItem("selectedPlantPid", plant.pid);

        const inputEl = document.getElementById("plantSearchInput");
        if (inputEl) inputEl.value = label;

        const displayEl = document.getElementById("plantSelectedDisplay");
        const nameEl = document.getElementById("plantSelectedName");
        if (nameEl) nameEl.textContent = label;
        if (displayEl) displayEl.hidden = false;

        resultsEl.hidden = true;
        resultsEl.replaceChildren();
        if (statusEl) statusEl.textContent = "";

        loadPlantCarePreview(plant.pid);
      });

      li.appendChild(btn);
      resultsEl.appendChild(li);
    });

    resultsEl.hidden = false;
  } catch (error) {
    if (statusEl) statusEl.textContent = error.message;
  }
}

function renderSelectedPlant() {
  const selectedPlantElement = document.getElementById("selectedPlant");

  if (!selectedPlantElement) {
    return;
  }

  const selectedPlant = localStorage.getItem("selectedPlant");
  selectedPlantElement.textContent = selectedPlant
    ? `Selected plant: ${selectedPlant}`
    : "";
}

async function handleLogin(event) {
  event.preventDefault();

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const messageElement = document.getElementById("message");

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  messageElement.textContent = "Logging in...";

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      messageElement.textContent = getApiErrorMessage(data, "Login failed");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    messageElement.textContent = `Welcome, ${data.user.username}!`;
    setTimeout(() => {
      window.location.href = "favorites.html";
    }, 800);
  } catch (error) {
    messageElement.textContent = getApiErrorMessage(
      null,
      error.message || "Could not connect to the server. Please try again.",
    );
  }
}

async function loadFavoritePlants() {
  const favoritesListElement = document.getElementById("favoritesList");
  const favoritesMessageElement = document.getElementById("favoritesMessage");
  const favoritesHeadingElement = document.getElementById("favoritesHeading");

  if (
    !favoritesListElement ||
    !favoritesMessageElement ||
    !favoritesHeadingElement
  ) {
    return;
  }

  const token = getAuthToken();
  const user = getStoredUser();

  if (user?.username) {
    favoritesHeadingElement.textContent = `${user.username}'s Favorite Plants`;
  }

  if (!token) {
    favoritesMessageElement.textContent = "Please login to see your favorites.";
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);
    return;
  }

  favoritesMessageElement.textContent = "Loading favorite plants...";

  try {
    const response = await fetch(`${API_BASE_URL}/plants/favorites`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const favorites = await parseJsonResponse(response);

    if (response.status === 401) {
      favoritesMessageElement.textContent = getApiErrorMessage(
        favorites,
        "Session expired. Please login again.",
      );
      setTimeout(() => {
        handleLogout();
      }, 1200);
      return;
    }

    if (!response.ok) {
      throw new Error(
        getApiErrorMessage(favorites, "Could not load favorite plants"),
      );
    }

    if (!Array.isArray(favorites) || favorites.length === 0) {
      favoritesMessageElement.textContent = "You have no favorite plants yet.";
      favoritesListElement.replaceChildren();
      return;
    }

    favoritesMessageElement.textContent = "";
    favoritesListElement.replaceChildren();

    favorites.forEach((favorite) => {
      const item = document.createElement("li");
      item.className = "favorite-item";

      const title = document.createElement("h3");
      title.textContent = favorite.alias || favorite.pid;

      const subtitle = document.createElement("p");
      subtitle.textContent = `Plant ID: ${favorite.pid}`;

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-favorite-btn";
      deleteButton.textContent = "Delete Favorite";
      deleteButton.addEventListener("click", async () => {
        const plantName = favorite.alias || favorite.pid;
        const confirmed = window.confirm(
          `Remove ${plantName} from your favorites?`,
        );

        if (!confirmed) {
          return;
        }

        deleteButton.disabled = true;
        deleteButton.textContent = "Deleting...";

        try {
          const deleteResponse = await fetch(
            `${API_BASE_URL}/plants/favorites/${favorite.favorite_id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const deleteData = await parseJsonResponse(deleteResponse);

          if (deleteResponse.status === 401) {
            favoritesMessageElement.textContent = getApiErrorMessage(
              deleteData,
              "Session expired. Please login again.",
            );
            setTimeout(() => {
              handleLogout();
            }, 1200);
            return;
          }

          if (!deleteResponse.ok) {
            throw new Error(
              getApiErrorMessage(deleteData, "Could not delete favorite"),
            );
          }

          item.remove();

          if (!favoritesListElement.children.length) {
            favoritesMessageElement.textContent =
              "You have no favorite plants yet.";
          } else {
            favoritesMessageElement.textContent = `${plantName} removed from favorites.`;
          }
        } catch (error) {
          favoritesMessageElement.textContent = error.message;
        } finally {
          if (deleteButton.isConnected) {
            deleteButton.disabled = false;
            deleteButton.textContent = "Delete Favorite";
          }
        }
      });

      if (favorite.img_url) {
        const image = document.createElement("img");
        image.src = favorite.img_url;
        image.alt = favorite.alias || favorite.pid;
        image.className = "favorite-image";
        item.appendChild(image);
      }

      const body = document.createElement("div");
      body.className = "favorite-item-body";

      body.appendChild(title);
      body.appendChild(subtitle);

      const careFields = [
        { label: "☀️ Sunlight", value: favorite.sunlight },
        { label: "💧 Watering", value: favorite.watering },
        { label: "🌱 Soil", value: favorite.soil },
        { label: "🌿 Fertilization", value: favorite.fertilization },
        { label: "✂️ Pruning", value: favorite.pruning },
      ];

      const hasCareData = careFields.some(({ value }) => value);

      if (!hasCareData) {
        const noCare = document.createElement("p");
        noCare.className = "favorite-detail favorite-detail--unavailable";
        noCare.textContent = "Care details not yet available.";
        body.appendChild(noCare);
      } else {
        careFields.forEach(({ label, value }) => {
          if (!value) return;
          const p = document.createElement("p");
          p.className = "favorite-detail";
          p.textContent = `${label}: ${value}`;
          body.appendChild(p);
        });
      }

      body.appendChild(deleteButton);
      item.appendChild(body);

      favoritesListElement.appendChild(item);
    });
  } catch (error) {
    favoritesMessageElement.textContent = error.message;
  }
}

function initFavoritesSearch() {
  const inputEl = document.getElementById("favoritesPlantSearch");
  if (!inputEl) return;

  let debounceTimer = null;

  inputEl.addEventListener("input", () => {
    const q = inputEl.value.trim();
    const resultsEl = document.getElementById("favoritesSearchResults");
    const statusEl = document.getElementById("favoritesSearchMessage");

    if (q.length < 3) {
      if (resultsEl) {
        resultsEl.hidden = true;
        resultsEl.replaceChildren();
      }
      if (statusEl) statusEl.textContent = "";
      clearTimeout(debounceTimer);
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => searchFavoritesPlants(q), 350);
  });

  document.addEventListener("click", (e) => {
    const resultsEl = document.getElementById("favoritesSearchResults");
    if (
      resultsEl &&
      !inputEl.contains(e.target) &&
      !resultsEl.contains(e.target)
    ) {
      resultsEl.hidden = true;
    }
  });
}

async function searchFavoritesPlants(q) {
  const resultsEl = document.getElementById("favoritesSearchResults");
  const statusEl = document.getElementById("favoritesSearchMessage");

  if (!resultsEl) return;

  if (statusEl) statusEl.textContent = "Searching...";
  resultsEl.hidden = true;
  resultsEl.replaceChildren();

  try {
    const response = await fetch(
      `${API_BASE_URL}/plants/search?q=${encodeURIComponent(q)}&limit=20`,
    );
    const data = await parseJsonResponse(response);

    if (!response.ok) {
      if (statusEl)
        statusEl.textContent = getApiErrorMessage(data, "Search failed.");
      return;
    }

    const results = Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data)
        ? data
        : [];

    if (results.length === 0) {
      if (statusEl) statusEl.textContent = "No plants found.";
      return;
    }

    if (statusEl)
      statusEl.textContent = `${results.length} plant${
        results.length === 1 ? "" : "s"
      } found`;

    results.forEach((plant) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "search-result-btn";

      const label = plant.alias || plant.display_pid || plant.pid;
      const nameSpan = document.createElement("span");
      nameSpan.textContent = label;
      const pidSmall = document.createElement("small");
      pidSmall.textContent = plant.pid !== label ? ` (${plant.pid})` : "";
      btn.appendChild(nameSpan);
      btn.appendChild(pidSmall);

      btn.addEventListener("click", () => {
        localStorage.setItem("selectedPlant", label);
        localStorage.setItem("selectedPlantPid", plant.pid);

        const input = document.getElementById("favoritesPlantSearch");
        if (input) input.value = label;

        resultsEl.hidden = true;
        resultsEl.replaceChildren();
        if (statusEl) statusEl.textContent = "";

        renderSelectedPlantPrompt();
        const promptEl = document.getElementById("selectedPlantPrompt");
        if (promptEl)
          promptEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });

      li.appendChild(btn);
      resultsEl.appendChild(li);
    });

    resultsEl.hidden = false;
  } catch (error) {
    if (statusEl) statusEl.textContent = error.message;
  }
}

renderSelectedPlant();
initPlantSearch();
loadFavoritePlants();
renderSelectedPlantPrompt();
initFavoritesSearch();
initProfilePage();

window.handleLogout = handleLogout;
window.handleSaveSelectedPlant = handleSaveSelectedPlant;
window.dismissSelectedPlantPrompt = dismissSelectedPlantPrompt;
window.handleUpdateProfile = handleUpdateProfile;
window.handleChangePassword = handleChangePassword;

function initProfilePage() {
  const usernameInput = document.getElementById("profileUsername");
  if (!usernameInput) return;

  const token = getAuthToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const user = getStoredUser();
  if (user) {
    const emailInput = document.getElementById("profileEmail");
    const profileGreeting = document.getElementById("profileGreeting");
    if (usernameInput) usernameInput.placeholder = user.username || "Username";
    if (emailInput) emailInput.placeholder = user.email || "Email";
    if (profileGreeting)
      profileGreeting.textContent = `Hello, ${user.username} 🌿`;
  }
}

async function handleUpdateProfile(event) {
  event.preventDefault();

  const usernameInput = document.getElementById("profileUsername");
  const emailInput = document.getElementById("profileEmail");
  const messageEl = document.getElementById("profileMessage");

  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();

  if (!username && !email) {
    messageEl.textContent = "Please provide a username or email to update.";
    messageEl.className = "profile-message profile-message--error";
    return;
  }

  const token = getAuthToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  messageEl.textContent = "Saving changes...";
  messageEl.className = "profile-message";

  try {
    const body = {};
    if (username) body.username = username;
    if (email) body.email = email;

    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await parseJsonResponse(response);

    if (response.status === 401) {
      messageEl.textContent = getApiErrorMessage(
        data,
        "Session expired. Please login again.",
      );
      messageEl.className = "profile-message profile-message--error";
      setTimeout(() => handleLogout(), 1200);
      return;
    }

    if (!response.ok) {
      messageEl.textContent = getApiErrorMessage(
        data,
        "Could not update profile.",
      );
      messageEl.className = "profile-message profile-message--error";
      return;
    }

    const stored = getStoredUser();
    localStorage.setItem("user", JSON.stringify({ ...stored, ...data }));

    messageEl.textContent = "Profile updated successfully!";
    messageEl.className = "profile-message profile-message--success";
  } catch (error) {
    messageEl.textContent = error.message || "Could not connect to server.";
    messageEl.className = "profile-message profile-message--error";
  }
}

async function handleChangePassword(event) {
  event.preventDefault();

  const currentPasswordInput = document.getElementById("currentPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const messageEl = document.getElementById("passwordMessage");

  const currentPassword = currentPasswordInput.value;
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (newPassword !== confirmPassword) {
    messageEl.textContent = "New passwords do not match.";
    messageEl.className = "profile-message profile-message--error";
    return;
  }

  if (newPassword.length < 8) {
    messageEl.textContent = "New password must be at least 8 characters.";
    messageEl.className = "profile-message profile-message--error";
    return;
  }

  const token = getAuthToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  messageEl.textContent = "Changing password...";
  messageEl.className = "profile-message";

  try {
    const response = await fetch(`${API_BASE_URL}/users/me/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await parseJsonResponse(response);

    if (response.status === 401) {
      messageEl.textContent = getApiErrorMessage(
        data,
        "Current password is incorrect.",
      );
      messageEl.className = "profile-message profile-message--error";
      return;
    }

    if (!response.ok) {
      messageEl.textContent = getApiErrorMessage(
        data,
        "Could not change password.",
      );
      messageEl.className = "profile-message profile-message--error";
      return;
    }

    messageEl.textContent = "Password changed successfully!";
    messageEl.className = "profile-message profile-message--success";
    currentPasswordInput.value = "";
    newPasswordInput.value = "";
    confirmPasswordInput.value = "";
  } catch (error) {
    messageEl.textContent = error.message || "Could not connect to server.";
    messageEl.className = "profile-message profile-message--error";
  }
}
