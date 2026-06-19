function selectPlant() {
  let plant = document.getElementById("plantSelect").value;

  if (plant === "") {
    alert("Please select a plant!");
    return;
  }

  localStorage.setItem("selectedPlant", plant);
  window.location.href = "login.html";
}
