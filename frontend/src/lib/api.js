const API_BASE = "https://expensetracker-1-st8d.onrender.com/api";
// const API_BASE = "http://localhost:1111/api";


const getHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("lumen_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg = data?.message || `HTTP error! status: ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    throw error;
  }
  return data;
};

export const api = {
  setToken: (token) => {
    localStorage.setItem("lumen_token", token);
  },
  getToken: () => {
    return localStorage.getItem("lumen_token");
  },
  clearToken: () => {
    localStorage.removeItem("lumen_token");
  },

  auth: {
    signup: async (name, email, password) => {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ name, email, password }),
      });
      const data = await handleResponse(response);
      if (data.token) {
        api.setToken(data.token);
      }
      return data;
    },

    signin: async (email, password) => {
      const response = await fetch(`${API_BASE}/auth/signin`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ email, password }),
      });
      const data = await handleResponse(response);
      if (data.token) {
        api.setToken(data.token);
      }
      return data;
    },

    getMe: async () => {
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: "GET",
        headers: getHeaders(),
      });
      return await handleResponse(response);
    },

    updateProfile: async (profileData) => {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(profileData),
      });
      const data = await handleResponse(response);
      if (data.token) {
        api.setToken(data.token);
      }
      return data;
    },
  },

  transactions: {
    getAll: async () => {
      const response = await fetch(`${API_BASE}/transactions`, {
        method: "GET",
        headers: getHeaders(),
      });
      return await handleResponse(response);
    },

    create: async (transactionData) => {
      const response = await fetch(`${API_BASE}/transactions`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(transactionData),
      });
      return await handleResponse(response);
    },

    delete: async (id) => {
      const response = await fetch(`${API_BASE}/transactions/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return await handleResponse(response);
    },
  },

  loans: {
    getAll: async () => {
      const response = await fetch(`${API_BASE}/loans`, {
        method: "GET",
        headers: getHeaders(),
      });
      return await handleResponse(response);
    },

    create: async (loanData) => {
      const response = await fetch(`${API_BASE}/loans`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(loanData),
      });
      return await handleResponse(response);
    },

    pay: async (id, amount, date) => {
      const response = await fetch(`${API_BASE}/loans/${id}/pay`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ amount, date }),
      });
      return await handleResponse(response);
    },

    delete: async (id) => {
      const response = await fetch(`${API_BASE}/loans/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return await handleResponse(response);
    },
  },

  settings: {
    get: async () => {
      const response = await fetch(`${API_BASE}/settings`, {
        method: "GET",
        headers: getHeaders(),
      });
      return await handleResponse(response);
    },

    update: async (settingsData) => {
      const response = await fetch(`${API_BASE}/settings`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(settingsData),
      });
      return await handleResponse(response);
    },
  },
};
