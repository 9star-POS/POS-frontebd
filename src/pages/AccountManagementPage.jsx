import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { RefreshCw, Search, Users, Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import getAccounts from "../api/admin/getAccounts";
import createAccount from "../api/admin/createAccount";
import updateAccount from "../api/admin/updateAccount";
import softDeleteAccount from "../api/admin/softDeleteAccount";
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
  const [detailFormData, setDetailFormData] = useState({
    name: "",
    role: "waiter",
  });
  const [formData, setFormData] = useState({
    name: "",
    role: "waiter",
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

  const ROLE_OPTIONS = ["admin", "superAdmin", "kitchen", "waiter"];

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
      admin: "bg-purple-100 text-purple-700",
      superAdmin: "bg-amber-100 text-amber-700",
      kitchen: "bg-cyan-100 text-cyan-700",
      waiter: "bg-green-100 text-green-700",
      manager: "bg-blue-100 text-blue-700",
      default: "bg-gray-100 text-gray-600",
    };
    const style = palette[role] || palette.default;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${style}`}
      >
        {role}
      </span>
    );
  };

  const openDetailModal = (account) => {
    setSelectedAccount(account);
    setDetailFormData({
      name: account.name || "",
      role: account.role || "waiter",
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
          role: "waiter",
          password: "",
          confirmPassword: "",
        });
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
      <div className="flex justify-center items-center h-[70vh]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="sub-header font-bold">Account Management</h1>
          <p className="text-gray-500">
            Monitor and manage user access across the POS system.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all"
          >
            <Plus size={18} />
            <span className="font-semibold">Create Account</span>
          </button>
          <button
            onClick={fetchAccounts}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              refreshing
                ? "opacity-60 cursor-not-allowed"
                : "border-gray-300 hover:bg-gray-100"
            }`}
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin text-primary" : ""}
            />
            <span className="font-semibold">
              {refreshing ? "Refreshing..." : "Refresh"}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
      </div>

      <div className="bg-white rounded-lg shadow-md p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Search by name..."
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600 mr-2">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 capitalize"
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
          <div className="py-16">
            <NoItems
              header="No accounts found"
              subHeader="Try adjusting filters or refreshing the list."
            />
          </div>
        ) : (
          <div className="h-[calc(100vh-450px)] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 ">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccounts.map((account) => (
                  <tr key={account._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {account.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID: {account._id.slice(-6)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {renderRoleBadge(account.role)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(account.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(account.lastActiveAt)}
                    </td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3 text-right">
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
        )}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setIsCreateOpen(false)}
              disabled={creating}
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-1">Create New Account</h2>
            <p className="text-sm text-gray-500 mb-4">
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
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Enter password"
                    disabled={creating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Confirm password"
                    disabled={creating}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setIsDetailOpen(false)}
              disabled={isUpdating}
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-1">Account Details</h2>
            <p className="text-sm text-gray-500 mb-4">
              Review account activity or update the display name and role.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
                  onClick={() => setIsDetailOpen(false)}
                  disabled={isUpdating}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
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

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
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
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                onClick={confirmSoftDelete}
                disabled={Boolean(deletingAccountId)}
              >
                {deletingAccountId ? "Deactivating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagementPage;
