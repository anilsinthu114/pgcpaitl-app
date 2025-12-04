// clear-storage.js
Object.keys(localStorage).forEach(k => {
  if (k.startsWith("pgcForm_")) {
    localStorage.removeItem(k);
  }
});
