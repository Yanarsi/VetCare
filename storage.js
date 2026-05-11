const AppStorage = (() => {
  const backendKeys = new Set([
    "users",
    "pets",
    "appointments",
    "medicalRecords",
    "clinicReminders",
  ]);

  function request(method, key, value) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `api/store.php?key=${encodeURIComponent(key)}`, false);
    xhr.setRequestHeader("Content-Type", "application/json");
    try {
      xhr.send(value === undefined ? null : JSON.stringify({ value }));
    } catch (error) {
      return { ok: false, error };
    }
    if (xhr.status < 200 || xhr.status >= 300) return { ok: false };
    return { ok: true, data: JSON.parse(xhr.responseText || "{}") };
  }

  function getItem(key) {
    if (!backendKeys.has(key)) return window.localStorage.getItem(key);
    const response = request("GET", key);
    if (!response.ok) return window.localStorage.getItem(key);
    return response.data.value;
  }

  function setItem(key, value) {
    if (!backendKeys.has(key)) {
      window.localStorage.setItem(key, value);
      return;
    }
    const response = request("PUT", key, value);
    if (!response.ok) window.localStorage.setItem(key, value);
  }

  function removeItem(key) {
    if (!backendKeys.has(key)) window.localStorage.removeItem(key);
  }

  return { getItem, setItem, removeItem };
})();
