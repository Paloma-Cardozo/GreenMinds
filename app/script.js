function selectPlant() {
  const plantSelect = document.getElementById("plantSelect");
  const plant = plantSelect.value;

  if (plant === "") {
    alert("Please select a plant!");
    return;
  }

  const selectedPlantLabel =
    plantSelect.options[plantSelect.selectedIndex]?.text || plant;

  localStorage.setItem("selectedPlant", selectedPlantLabel);
  localStorage.setItem("selectedPlantPid", plant);
  window.location.href = "login.html";
}

const API_BASE_URL = "http://localhost:3001/api";
let favoriteSearchOptions = [];

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

async function loadPlantOptions() {
  const plantSelect = document.getElementById("plantSelect");

  if (!plantSelect) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/plants/options`);
    const plants = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(getApiErrorMessage(plants, "Could not load plants"));
    }

    if (!Array.isArray(plants) || plants.length === 0) {
      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "-- No plants available yet --";
      plantSelect.replaceChildren(emptyOption);
      return;
    }

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "-- Search Your Plant --";
    plantSelect.replaceChildren(placeholderOption);

    plants.forEach((plant) => {
      const option = document.createElement("option");
      option.value = plant.pid;
      option.textContent = plant.alias || plant.pid;
      plantSelect.appendChild(option);
    });
  } catch (error) {
    const errorOption = document.createElement("option");
    errorOption.value = "";
    errorOption.textContent = `-- ${error.message} --`;
    plantSelect.replaceChildren(errorOption);
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

      const sunlight = document.createElement("p");
      sunlight.className = "favorite-detail";
      sunlight.textContent = `Sunlight: ${favorite.sunlight || "Not specified"}`;

      const watering = document.createElement("p");
      watering.className = "favorite-detail";
      watering.textContent = `Watering: ${favorite.watering || "Not specified"}`;

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

      item.appendChild(title);
      item.appendChild(subtitle);
      item.appendChild(sunlight);
      item.appendChild(watering);
      item.appendChild(deleteButton);

      if (favorite.img_url) {
        const image = document.createElement("img");
        image.src = favorite.img_url;
        image.alt = favorite.alias || favorite.pid;
        image.className = "favorite-image";
        item.appendChild(image);
      }

      favoritesListElement.appendChild(item);
    });
  } catch (error) {
    favoritesMessageElement.textContent = error.message;
  }
}

function renderFavoritesSearchResults(searchTerm) {
  const searchResultsElement = document.getElementById(
    "favoritesSearchResults",
  );
  const searchMessageElement = document.getElementById(
    "favoritesSearchMessage",
  );

  if (!searchResultsElement || !searchMessageElement) {
    return;
  }

  if (!searchTerm) {
    searchResultsElement.replaceChildren();
    searchResultsElement.hidden = true;
    searchMessageElement.textContent = "";
    return;
  }

  const normalizedTerm = searchTerm.toLowerCase();
  const matches = favoriteSearchOptions
    .filter((plant) => {
      const alias = String(plant.alias || "").toLowerCase();
      const pid = String(plant.pid || "").toLowerCase();
      return alias.includes(normalizedTerm) || pid.includes(normalizedTerm);
    })
    .slice(0, 8);

  if (matches.length === 0) {
    searchResultsElement.replaceChildren();
    searchResultsElement.hidden = true;
    searchMessageElement.textContent = "No plants found.";
    return;
  }

  searchMessageElement.textContent = `${matches.length} plant${matches.length === 1 ? "" : "s"} found`;
  searchResultsElement.replaceChildren();
  searchResultsElement.hidden = false;

  matches.forEach((plant) => {
    const listItem = document.createElement("li");
    const resultButton = document.createElement("button");

    resultButton.type = "button";
    resultButton.className = "search-result-btn";
    resultButton.textContent = `${plant.alias || plant.pid} (${plant.pid})`;
    resultButton.onclick = () => {
      localStorage.setItem("selectedPlant", plant.alias || plant.pid);
      localStorage.setItem("selectedPlantPid", plant.pid);
      renderSelectedPlantPrompt();

      const selectedPlantPromptElement = document.getElementById(
        "selectedPlantPrompt",
      );

      if (selectedPlantPromptElement) {
        selectedPlantPromptElement.hidden = false;
        selectedPlantPromptElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    };

    listItem.appendChild(resultButton);
    searchResultsElement.appendChild(listItem);
  });
}

async function loadFavoritesSearch() {
  const searchInputElement = document.getElementById("favoritesPlantSearch");
  const searchMessageElement = document.getElementById(
    "favoritesSearchMessage",
  );

  if (!searchInputElement || !searchMessageElement) {
    return;
  }

  searchMessageElement.textContent = "Loading plants from API...";

  try {
    const response = await fetch(`${API_BASE_URL}/plants/options`);
    const plants = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(getApiErrorMessage(plants, "Could not load plants"));
    }

    favoriteSearchOptions = Array.isArray(plants) ? plants : [];

    if (favoriteSearchOptions.length === 0) {
      searchMessageElement.textContent = "No plants available in API yet.";
      return;
    }

    searchMessageElement.textContent = "Start typing to search plants.";

    searchInputElement.addEventListener("input", (event) => {
      renderFavoritesSearchResults(event.target.value.trim());
    });
  } catch (error) {
    searchMessageElement.textContent = getApiErrorMessage(
      null,
      `${error.message}. Please try again.`,
    );
  }
}

renderSelectedPlant();
loadPlantOptions();
loadFavoritePlants();
renderSelectedPlantPrompt();
loadFavoritesSearch();

window.handleLogout = handleLogout;
window.handleSaveSelectedPlant = handleSaveSelectedPlant;
window.dismissSelectedPlantPrompt = dismissSelectedPlantPrompt;
