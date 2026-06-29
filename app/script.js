function selectPlant() {
  let plant = document.getElementById("plantSelect").value;

  if (plant === "") {
    alert("Please select a plant!");
    return;
  }

  localStorage.setItem("selectedPlant", plant);
  window.location.href = "login.html";
}
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      document.getElementById("message").innerText = data.error;
      return;
    }

    // SAVE TOKEN
    localStorage.setItem("token", data.token);

    //  OPTIONAL: save user
    localStorage.setItem("user", JSON.stringify(data.user));

    document.getElementById("message").innerText = "Login successful ✅";

    //  redirect after login
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  } catch (error) {
    console.error(error);
    document.getElementById("message").innerText = "Server error";
  }
}
async function loadFavorites() {
  const token = localStorage.getItem("token");

  if (!token) {
    console.log("No token found");
    return;
  }

  try {
    const res = await fetch("http://localhost:3001/api/favorites", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log("Favorites:", data);
  } catch (err) {
    console.error("Error fetching favorites:", err);
  }
}
window.onload = () => {
  const plant = localStorage.getItem("selectedPlant");

  if (plant) {
    const el = document.getElementById("selectedPlant");
    if (el) {
      el.innerText = "🌱 Selected Plant: " + plant;
    }
  }

  // ✅ CALL API AFTER PAGE LOAD
  loadFavorites();
};