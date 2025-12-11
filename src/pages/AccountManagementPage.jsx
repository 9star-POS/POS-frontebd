import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  RefreshCw,
  Search,
  Users,
  Plus,
  X,
  Trash2,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import getAccounts from "../api/admin/getAccounts";
import createAccount from "../api/admin/createAccount";
import updateAccount from "../api/admin/updateAccount";
import softDeleteAccount from "../api/admin/softDeleteAccount";
import updatePassword from "../api/admin/updatePassword";
import Loading from "../components/Loading";
import NoItems from "../components/NoItems";

const AccountManagementPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState(null);
  const [pendingDeleteAccount, setPendingDeleteAccount] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordAccount, setPasswordAccount] = useState(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [detailFormData, setDetailFormData] = useState({
    name: "",
    role: "restaurant-waiter",
  });
  const [formData, setFormData] = useState({
    name: "",
    role: "restaurant-waiter",
    password: "",
    confirmPassword: "",
  });

  const fetchAccounts = async () => {
    try {
      setError("");
      setRefreshing(true);
      if (!accounts.length) {
        setLoading(true);
      }

      const res = await getAccounts();
      if (res?.success) {
        setAccounts(res?.data?.accounts ?? []);
      } else {
        setError(res?.message || "Failed to fetch accounts");
        setAccounts([]);
        toast.error(res?.message || "Failed to fetch accounts");
      }
    } catch (err) {
      setError(err?.message || "Failed to fetch accounts");
      setAccounts([]);
      toast.error(err?.message || "Failed to fetch accounts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ROLE_OPTIONS = [
    "owner",
    "cashier",
    "kitchen",
    "bar-counter",
    "ktv-waiter",
    "restaurant-waiter",
  ];

  const roleOptions = useMemo(() => {
    const uniqueRoles = new Set(accounts.map((acc) => acc.role));
    return ["all", ...Array.from(uniqueRoles)];
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesRole =
        roleFilter === "all" ? true : account.role === roleFilter;
      const matchesSearch = account.name
        ?.toLowerCase()
        .includes(searchTerm.trim().toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [accounts, roleFilter, searchTerm]);

  const summaryStats = useMemo(() => {
    const total = accounts.length;
    const byRole = accounts.reduce((acc, account) => {
      acc[account.role] = (acc[account.role] || 0) + 1;
      return acc;
    }, {});
    return { total, byRole };
  }, [accounts]);

  const formatDate = (value) => {
    if (!value) return "—";
    try {
      return format(new Date(value), "yyyy MMM dd, HH:mm");
    } catch {
      return value;
    }
  };

  const renderRoleBadge = (role) => {
    const palette = {
      owner: "bg-purple-100 text-purple-700",
      cashier: "bg-blue-100 text-blue-700",
      kitchen: "bg-cyan-100 text-cyan-700",
      "bar-counter": "bg-orange-100 text-orange-700",
      "ktv-waiter": "bg-pink-100 text-pink-700",
      "restaurant-waiter": "bg-green-100 text-green-700",
      default: "bg-gray-100 text-gray-600",
    };
    const style = palette[role] || palette.default;
    const displayRole = role?.replace(/-/g, " ") || role;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${style}`}
      >
        {displayRole}
      </span>
    );
  };

  const openDetailModal = (account) => {
    setSelectedAccount(account);
    setDetailFormData({
      name: account.name || "",
      role: account.role || "restaurant-waiter",
    });
    setIsDetailOpen(true);
  };

  const handleUpdateAccount = async (event) => {
    event.preventDefault();
    if (!selectedAccount?._id) return;
    if (!detailFormData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setIsUpdating(true);
      const res = await updateAccount({
        accountId: selectedAccount._id,
        name: detailFormData.name.trim(),
        role: detailFormData.role,
      });

      if (res?.success) {
        toast.success(res?.message || "Account updated successfully");
        setIsDetailOpen(false);
        await fetchAccounts();
      } else {
        toast.error(res?.message || "Failed to update account");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to update account");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (account) => {
    setPendingDeleteAccount(account);
    setIsDeleteModalOpen(true);
  };

  const handlePasswordClick = (account) => {
    setPasswordAccount(account);
    setPasswordFormData({
      newPassword: "",
      confirmPassword: "",
    });
    setIsPasswordModalOpen(true);
  };

  const handleUpdatePassword = async (event) => {
    event.preventDefault();
    if (!passwordAccount?._id) return;

    if (
      !passwordFormData.newPassword ||
      passwordFormData.newPassword.length < 6
    ) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setUpdatingPassword(true);
      const res = await updatePassword(passwordAccount._id, {
        newPassword: passwordFormData.newPassword,
        confirmPassword: passwordFormData.confirmPassword,
      });

      if (res?.success) {
        toast.success(res?.message || "Password updated successfully");
        setIsPasswordModalOpen(false);
        setPasswordFormData({
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordAccount(null);
        setShowNewPassword(false);
        setShowConfirmNewPassword(false);
      } else {
        toast.error(res?.message || "Failed to update password");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const confirmSoftDelete = async () => {
    if (!pendingDeleteAccount?._id) return;
    try {
      setDeletingAccountId(pendingDeleteAccount._id);
      const res = await softDeleteAccount(pendingDeleteAccount._id);
      if (res?.success) {
        toast.success(res?.message || "Account deactivated successfully");
        await fetchAccounts();
        setIsDeleteModalOpen(false);
        setPendingDeleteAccount(null);
      } else {
        toast.error(res?.message || "Failed to deactivate account");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to deactivate account");
    } finally {
      setDeletingAccountId(null);
    }
  };

  const handleCreateAccount = async (event) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      role: formData.role,
    };

    try {
      setCreating(true);
      const res = await createAccount(payload);
      if (res?.success) {
        toast.success(res?.message || "Account created successfully");
        setIsCreateOpen(false);
        setFormData({
          name: "",
          role: "restaurant-waiter",
          password: "",
          confirmPassword: "",
        });
        setShowPassword(false);
        setShowConfirmPassword(false);
        await fetchAccounts();
      } else {
        toast.error(res?.message || "Failed to create account");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to create account");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-90px)]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-3 md:p-5 h-[calc(100vh-90px)] overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-4 md:mb-6">
        <div>
          <h1 className="sub-header font-bold text-xl md:text-2xl">
            Account Management
          </h1>
          <p className="text-sm md:text-base text-gray-500">
            Monitor and manage user access across the POS system.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all text-sm md:text-base font-semibold"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Create Account</span>
            <span className="sm:hidden">Create</span>
          </button>
          <button
            onClick={fetchAccounts}
            disabled={refreshing}
            className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg border transition-all text-sm md:text-base font-semibold ${
              refreshing
                ? "opacity-60 cursor-not-allowed"
                : "border-gray-300 hover:bg-gray-100"
            }`}
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin text-primary" : ""}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-primary">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Accounts</p>
            <Users size={22} className="text-primary" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {summaryStats.total}
          </p>
        </div>
        {Object.entries(summaryStats.byRole).map(([role, count]) => (
          <div
            key={role}
            className="bg-white rounded-lg shadow-md p-4 border-l-4 border-primary/60"
          >
            <p className="text-sm text-gray-500 capitalize">{role} Accounts</p>
            <p className="text-3xl font-bold text-gray-900">{count}</p>
          </div>
        ))}
      </div> */}

      <div className="">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Search by name..."
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary/40 capitalize"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredAccounts.length === 0 ? (
          <div className="py-10 md:py-16">
            <NoItems
              header="No accounts found"
              subHeader="Try adjusting filters or refreshing the list."
            />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block h-[calc(100vh-300px)] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAccounts.map((account) => (
                    <tr key={account._id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-3">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {account.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {account._id.slice(-6)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3">
                        {renderRoleBadge(account.role)}
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-sm text-gray-600">
                        {formatDate(account.createdAt)}
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-sm text-gray-600">
                        {formatDate(account.lastActiveAt)}
                      </td>
                      <td className="px-4 lg:px-6 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            account.softDeleted
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {account.softDeleted ? "Deactivated" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="inline-flex items-center justify-center w-9 h-9 hover:scale-105 transition-colors"
                            onClick={() => openDetailModal(account)}
                            aria-label="View account details"
                            title="View / Edit"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-primary"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.8}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M1.5 12s3.75-6.75 10.5-6.75S22.5 12 22.5 12s-3.75 6.75-10.5 6.75S1.5 12 1.5 12z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </button>
                          <button
                            className="inline-flex items-center justify-center w-9 h-9 hover:scale-105 transition-colors"
                            onClick={() => handlePasswordClick(account)}
                            aria-label="Update password"
                            title="Update Password"
                          >
                            <Key className="w-5 h-5 text-blue-500" />
                          </button>
                          <button
                            className="inline-flex items-center justify-center w-9 h-9 hover:scale-105 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            onClick={() => handleDeleteClick(account)}
                            aria-label="Soft delete account"
                            title="Deactivate"
                            disabled={deletingAccountId === account._id}
                          >
                            {deletingAccountId === account._id ? (
                              <svg
                                className="w-5 h-5 text-red-500 animate-spin"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M4 12a8 8 0 018-8"
                                />
                              </svg>
                            ) : (
                              <Trash2 className="w-5 h-5 text-red-500" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
              {filteredAccounts.map((account) => (
                <div
                  key={account._id}
                  className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {account.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        ID: {account._id.slice(-6)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {renderRoleBadge(account.role)}
                    </div>
                  </div>
                  <div className="space-y-2 mb-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          account.softDeleted
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {account.softDeleted ? "Deactivated" : "Active"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span className="text-gray-900 text-xs">
                        {formatDate(account.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Active:</span>
                      <span className="text-gray-900 text-xs">
                        {formatDate(account.lastActiveAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                    <button
                      className="flex-1 px-3 py-2 text-primary border border-primary rounded-md hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-1 text-sm font-medium"
                      onClick={() => openDetailModal(account)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M1.5 12s3.75-6.75 10.5-6.75S22.5 12 22.5 12s-3.75 6.75-10.5 6.75S1.5 12 1.5 12z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      View
                    </button>
                    <button
                      className="flex-1 px-3 py-2 text-blue-500 border border-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-center gap-1 text-sm font-medium"
                      onClick={() => handlePasswordClick(account)}
                    >
                      <Key size={16} />
                      Password
                    </button>
                    <button
                      className="flex-1 px-3 py-2 text-red-500 border border-red-500 rounded-md hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-1 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleDeleteClick(account)}
                      disabled={deletingAccountId === account._id}
                    >
                      {deletingAccountId === account._id ? (
                        <svg
                          className="w-4 h-4 animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 12a8 8 0 018-8"
                          />
                        </svg>
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 md:p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 md:p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setIsCreateOpen(false);
                setShowPassword(false);
                setShowConfirmPassword(false);
              }}
              disabled={creating}
            >
              <X size={20} />
            </button>
            <h2 className="text-lg md:text-xl font-semibold mb-1 sticky top-0 bg-white pb-2">
              Create New Account
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mb-4">
              Provide details to add a new staff account.
            </p>

            <form className="space-y-4" onSubmit={handleCreateAccount}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Enter name"
                  disabled={creating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 capitalize"
                  disabled={creating}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role.replace(/-/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className={`w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 ${
                        formData.password && formData.password.length < 6
                          ? "border-red-500 focus:ring-red-500/40"
                          : "border-gray-300 focus:ring-primary/40"
                      }`}
                      placeholder="Enter password"
                      disabled={creating}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={creating}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formData.password && formData.password.length < 6 && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <span className="font-semibold">⚠</span> Password must be
                      at least 6 characters long
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className={`w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 ${
                        formData.confirmPassword &&
                        formData.password !== formData.confirmPassword
                          ? "border-red-500 focus:ring-red-500/40"
                          : formData.confirmPassword &&
                            formData.confirmPassword.length < 6
                          ? "border-red-500 focus:ring-red-500/40"
                          : "border-gray-300 focus:ring-primary/40"
                      }`}
                      placeholder="Confirm password"
                      disabled={creating}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={creating}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword &&
                    formData.confirmPassword.length < 6 && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <span className="font-semibold">⚠</span> Password must
                        be at least 6 characters long
                      </p>
                    )}
                  {formData.confirmPassword &&
                    formData.password &&
                    formData.password.length >= 6 &&
                    formData.password !== formData.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <span className="font-semibold">⚠</span> Passwords do
                        not match
                      </p>
                    )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 sticky bottom-0 bg-white pb-2">
                <button
                  type="button"
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-all text-sm md:text-base"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setShowPassword(false);
                    setShowConfirmPassword(false);
                  }}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all text-sm md:text-base"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 md:p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 md:p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setIsDetailOpen(false)}
              disabled={isUpdating}
            >
              <X size={20} />
            </button>
            <h2 className="text-lg md:text-xl font-semibold mb-1 sticky top-0 bg-white pb-2">
              Account Details
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mb-4">
              Review account activity or update the display name and role.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-500 mb-1">Account ID</p>
                <p className="font-mono text-sm">{selectedAccount._id}</p>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-500 mb-1">Created</p>
                <p className="text-sm">
                  {formatDate(selectedAccount.createdAt)}
                </p>
              </div>
              {/* <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-500 mb-1">Last Active</p>
                <p className="text-sm">
                  {formatDate(selectedAccount.lastActiveAt)}
                </p>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <p>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      selectedAccount.softDeleted
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {selectedAccount.softDeleted ? "Deactivated" : "Active"}
                  </span>
                </p>
              </div> */}
            </div>

            <form className="space-y-4" onSubmit={handleUpdateAccount}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={detailFormData.name}
                  onChange={(e) =>
                    setDetailFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Enter name"
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={detailFormData.role}
                  onChange={(e) =>
                    setDetailFormData((prev) => ({
                      ...prev,
                      role: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 capitalize"
                  disabled={isUpdating}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role.replace(/-/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 sticky bottom-0 bg-white pb-2">
                <button
                  type="button"
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-all text-sm md:text-base"
                  onClick={() => setIsDetailOpen(false)}
                  disabled={isUpdating}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all text-sm md:text-base"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && pendingDeleteAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 md:p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 md:p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => {
                if (deletingAccountId) return;
                setIsDeleteModalOpen(false);
                setPendingDeleteAccount(null);
              }}
              disabled={Boolean(deletingAccountId)}
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-full">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Deactivate Account?</h2>
                <p className="text-sm text-gray-500">
                  This will mark the account as inactive. You can reactivate it
                  later if needed.
                </p>
              </div>
            </div>

            <div className="border rounded-lg bg-gray-50 p-3 mb-4">
              <p className="text-sm text-gray-500 mb-1">Account</p>
              <p className="font-semibold text-gray-900">
                {pendingDeleteAccount.name || "Unnamed User"}
              </p>
              <p className="text-xs text-gray-500">
                ID: {pendingDeleteAccount._id}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-all text-sm md:text-base"
                onClick={() => {
                  if (deletingAccountId) return;
                  setIsDeleteModalOpen(false);
                  setPendingDeleteAccount(null);
                }}
                disabled={Boolean(deletingAccountId)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm md:text-base"
                onClick={confirmSoftDelete}
                disabled={Boolean(deletingAccountId)}
              >
                {deletingAccountId ? "Deactivating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Password Modal */}
      {isPasswordModalOpen && passwordAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 md:p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 md:p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setPasswordFormData({
                  newPassword: "",
                  confirmPassword: "",
                });
                setPasswordAccount(null);
                setShowNewPassword(false);
                setShowConfirmNewPassword(false);
              }}
              disabled={updatingPassword}
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Update Password</h2>
                <p className="text-sm text-gray-500">
                  Change password for {passwordAccount.name}
                </p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleUpdatePassword}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordFormData.newPassword}
                    onChange={(e) =>
                      setPasswordFormData((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Enter new password"
                    disabled={updatingPassword}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={updatingPassword}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={passwordFormData.confirmPassword}
                    onChange={(e) =>
                      setPasswordFormData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Confirm new password"
                    disabled={updatingPassword}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmNewPassword(!showConfirmNewPassword)
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={updatingPassword}
                  >
                    {showConfirmNewPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 sticky bottom-0 bg-white pb-2">
                <button
                  type="button"
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-all text-sm md:text-base"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setPasswordFormData({
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setPasswordAccount(null);
                    setShowNewPassword(false);
                    setShowConfirmNewPassword(false);
                  }}
                  disabled={updatingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm md:text-base"
                  disabled={updatingPassword}
                >
                  {updatingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagementPage;
