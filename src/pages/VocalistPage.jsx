import { useEffect, useState, useMemo } from "react";
import { RefreshCw, Search, Mic, User, Phone, Mail, Plus, X } from "lucide-react";
import { toast } from "sonner";
import getAllVocalists from "../api/KTV/getAllVocalists";
import createVocalist from "../api/KTV/createVocalist";
import Loading from "../components/Loading";
import NoItems from "../components/NoItems";

const VocalistPage = () => {
  const [vocalists, setVocalists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    vocalistName: "",
    hourlyRate: "",
  });

  const fetchVocalists = async () => {
    try {
      setError("");
      setRefreshing(true);
      if (!vocalists.length) {
        setLoading(true);
      }

      const res = await getAllVocalists();
      if (res?.success) {
        // Handle both array and object with data property
        const vocalistData = Array.isArray(res.data) 
          ? res.data 
          : res.data?.vocalists || res.data || [];
        setVocalists(vocalistData);
      } else {
        setError(res?.message || "Failed to fetch vocalists");
        setVocalists([]);
        toast.error(res?.message || "Failed to fetch vocalists");
      }
    } catch (err) {
      setError(err?.message || "Failed to fetch vocalists");
      setVocalists([]);
      toast.error(err?.message || "Failed to fetch vocalists");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVocalists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredVocalists = useMemo(() => {
    if (!searchTerm.trim()) return vocalists;
    
    const searchLower = searchTerm.toLowerCase();
    return vocalists.filter((vocalist) => {
      const name = vocalist?.name || vocalist?.vocalistName || "";
      const phone = vocalist?.phone || vocalist?.phoneNumber || "";
      const email = vocalist?.email || "";
      
      return (
        name.toLowerCase().includes(searchLower) ||
        phone.includes(searchTerm) ||
        email.toLowerCase().includes(searchLower)
      );
    });
  }, [vocalists, searchTerm]);

  const summaryStats = useMemo(() => {
    return {
      total: vocalists.length,
      active: vocalists.filter((v) => !v.softDeleted && v.status !== "inactive").length,
    };
  }, [vocalists]);

  const handleCreateVocalist = async (event) => {
    event.preventDefault();
    
    if (!formData.vocalistName.trim()) {
      toast.error("Please enter vocalist name");
      return;
    }
    if (!formData.hourlyRate || Number(formData.hourlyRate) <= 0) {
      toast.error("Please enter a valid hourly rate");
      return;
    }

    try {
      setCreating(true);
      const payload = {
        vocalistName: formData.vocalistName.trim(),
        hourlyRate: Number(formData.hourlyRate),
      };

      const res = await createVocalist(payload);
      if (res?.success) {
        toast.success(res?.message || "Vocalist created successfully");
        setIsCreateOpen(false);
        setFormData({
          vocalistName: "",
          hourlyRate: "",
        });
        await fetchVocalists();
      } else {
        toast.error(res?.message || "Failed to create vocalist");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to create vocalist");
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
    <div className="p-5 h-[calc(100vh-90px)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-secondary rounded-lg">
            <Mic className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="sub-header font-bold">Vocalists</h1>
            <p className="text-sm text-gray-500">
              Manage and view all vocalists
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all"
          >
            <Plus size={18} />
            <span className="font-semibold">Create Vocalist</span>
          </button>
          <button
            onClick={fetchVocalists}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-primary">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Vocalists</p>
            <Mic size={22} className="text-primary" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {summaryStats.total}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-primary/60">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Active</p>
            <User size={22} className="text-primary" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {summaryStats.active}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Search by name, phone, or email..."
          />
        </div>
      </div>

      {/* Vocalists List */}
      {filteredVocalists.length === 0 ? (
        <div className="py-16">
          <NoItems
            header="No vocalists found"
            subHeader={
              searchTerm
                ? "Try adjusting your search terms."
                : "No vocalists available. Refresh to load data."
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-[calc(100vh-470px)] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Additional Info
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVocalists.map((vocalist, index) => {
                  const name = vocalist?.name || vocalist?.vocalistName || "Unknown";
                  const phone = vocalist?.phone || vocalist?.phoneNumber || "";
                  const email = vocalist?.email || "";
                  const status = vocalist?.status || (vocalist?.softDeleted ? "inactive" : "active");
                  const id = vocalist?._id || vocalist?.id || index;

                  return (
                    <tr key={id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Mic className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{name}</p>
                            {vocalist?._id && (
                              <p className="text-xs text-gray-500">
                                ID: {vocalist._id.slice(-6)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone size={14} className="text-gray-400" />
                              <span>{phone}</span>
                            </div>
                          )}
                          {email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail size={14} className="text-gray-400" />
                              <span>{email}</span>
                            </div>
                          )}
                          {!phone && !email && (
                            <span className="text-sm text-gray-400">No contact info</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            status === "active" && !vocalist?.softDeleted
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {status === "active" && !vocalist?.softDeleted
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {vocalist?.specialty && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {vocalist.specialty}
                          </span>
                        )}
                        {(vocalist?.hourlyRate || vocalist?.rate) && (
                          <div className="mt-1 text-xs font-semibold">
                            Rate: {(vocalist?.hourlyRate || vocalist?.rate).toLocaleString()} MMK/hr
                          </div>
                        )}
                        {!vocalist?.specialty && !vocalist?.hourlyRate && !vocalist?.rate && (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Vocalist Modal */}
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
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mic className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Create New Vocalist</h2>
                <p className="text-sm text-gray-500">
                  Add a new vocalist to the system
                </p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleCreateVocalist}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vocalist Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.vocalistName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, vocalistName: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Enter vocalist name"
                  disabled={creating}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate (MMK) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, hourlyRate: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Enter hourly rate"
                  disabled={creating}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setFormData({
                      vocalistName: "",
                      hourlyRate: "",
                    });
                  }}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Vocalist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocalistPage;

