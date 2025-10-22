import { createContext, useState, useContext } from "react";

// Create the AuthContext
const AuthContext = createContext();

// Custom hook to use AuthContext in components
export const useAuth = () => useContext(AuthContext);

// AuthProvider to wrap the app and provide auth state to components
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // User data stored here
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true); // Set user as authenticated
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("biz-bozz");
    localStorage.removeItem("biz-bozz-user");
    setIsAuthenticated(false); // Set user as logged out
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
