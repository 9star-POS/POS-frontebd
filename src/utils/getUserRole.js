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

/**
 * Check if the current user can soft delete (including cashiers)
 * @returns {boolean} True if user can soft delete, false otherwise
 */
export const canSoftDelete = () => {
  const role = getUserRole();
  return role !== null; // All logged-in users can soft delete
};

/**
 * Check if the current user is a waiter (ktv-waiter or restaurant-waiter)
 * @returns {boolean} True if user is a waiter, false otherwise
 */
export const isWaiter = () => {
  const role = getUserRole();
  return role === "ktv-waiter" || role === "restaurant-waiter";
};

/**
 * Check if the current user is a kitchen staff
 * @returns {boolean} True if user is kitchen, false otherwise
 */
export const isKitchen = () => {
  return getUserRole() === "kitchen";
};

/**
 * Check if the current user is a bar counter staff
 * @returns {boolean} True if user is bar-counter, false otherwise
 */
export const isBarCounter = () => {
  return getUserRole() === "bar-counter";
};

/**
 * Check if the current user is an owner
 * @returns {boolean} True if user is owner, false otherwise
 */
export const isOwner = () => {
  return getUserRole() === "owner";
};
