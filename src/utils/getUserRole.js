/**
 * Get the current user's role from localStorage
 * @returns {string|null} The user's role or null if not found
 */
export const getUserRole = () => {
  try {
    const userData = localStorage.getItem("bz-user");
    if (userData) {
      const user = JSON.parse(userData);
      return user?.role || null;
    }
  } catch (error) {
    console.error("Error parsing user data:", error);
  }
  return null;
};

/**
 * Check if the current user is a cashier
 * @returns {boolean} True if user is cashier, false otherwise
 */
export const isCashier = () => {
  return getUserRole() === "cashier";
};

/**
 * Check if the current user can edit (not cashier)
 * @returns {boolean} True if user can edit, false if cashier
 */
export const canEdit = () => {
  return !isCashier();
};

