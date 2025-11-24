import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_CONFIG } from "../config";

interface Item {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  status: "available" | "reserved" | "sold";
  created_at: string;
  updated_at: string;
}

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reserving, setReserving] = useState<number | null>(null);
  const [currentUserId] = useState(2); // TODO: Get from logged-in user

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    status: "available" as "available" | "reserved" | "sold",
  });

  useEffect(() => {
    fetchItems();
  }, [category]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");
      let url = `${API_CONFIG.CATALOG_SERVICE_URL}/items`;
      
      if (category !== "All Categories") {
        url = `${API_CONFIG.CATALOG_SERVICE_URL}/items/category/${encodeURIComponent(category)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch items");
      
      const data = await response.json();
      setItems(data);
    } catch (err: any) {
      setError(err.message || "Failed to load items");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      const response = await fetch(`${API_CONFIG.CATALOG_SERVICE_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          category: formData.category,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create item");
      }

      await fetchItems();
      setShowCreateModal(false);
      setFormData({ name: "", description: "", price: "", category: "", status: "available" });
    } catch (err: any) {
      setError(err.message || "Failed to create item");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setUpdating(true);
    setError("");

    try {
      const response = await fetch(`${API_CONFIG.CATALOG_SERVICE_URL}/items/${selectedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name || undefined,
          description: formData.description || undefined,
          price: formData.price ? parseFloat(formData.price) : undefined,
          category: formData.category || undefined,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update item");
      }

      await fetchItems();
      setShowEditModal(false);
      setSelectedItem(null);
      setFormData({ name: "", description: "", price: "", category: "", status: "available" });
    } catch (err: any) {
      setError(err.message || "Failed to update item");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(`${API_CONFIG.CATALOG_SERVICE_URL}/items/${selectedItem.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to delete item");
      }

      await fetchItems();
      setShowDeleteModal(false);
      setSelectedItem(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete item");
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (item: Item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category: item.category,
      status: item.status,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (item: Item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleReserve = async (itemId: number) => {
    setReserving(itemId);
    setError("");

    try {
      const response = await fetch(`${API_CONFIG.RESERVATION_SERVICE_URL}/items/${itemId}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyer_id: currentUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to reserve item");
      }

      alert("Item reserved successfully! Check your Reservations page.");
      await fetchItems(); // Refresh to show updated status
    } catch (err: any) {
      setError(err.message || "Failed to reserve item");
    } finally {
      setReserving(null);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === "All Status" || 
      item.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="px-6 py-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold tracking-tight text-black">LionSwap</Link>
          <div className="flex gap-4">
            <Link to="/users" className="text-sm font-medium text-gray-500 hover:text-black">Users</Link>
            <Link to="/reservations" className="text-sm font-medium text-gray-500 hover:text-black">Reservations</Link>
            <Link to="/profile" className="text-sm font-medium text-gray-500 hover:text-black">Profile</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Title and Actions */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">Marketplace</h2>
            <p className="text-gray-500">Browse and manage catalog items</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
          >
            + Create Item
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-8">
          <input 
            type="text" 
            placeholder="Search items..." 
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm cursor-pointer"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>All Categories</option>
            <option>Electronics</option>
            <option>Textbooks</option>
            <option>Furniture</option>
            <option>Clothing</option>
            <option>Other</option>
          </select>
          <select 
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            <option>Available</option>
            <option>Reserved</option>
            <option>Sold</option>
          </select>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-pulse text-gray-400">Loading items...</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-xl p-6 hover:border-black transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-black mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{item.description || "No description"}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">{item.category}</span>
                      <span className={`px-2 py-1 rounded ${
                        item.status === "available" ? "bg-green-100 text-green-700" :
                        item.status === "reserved" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-black">${item.price}</div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  {item.status === "available" ? (
                    <button
                      onClick={() => handleReserve(item.id)}
                      disabled={reserving === item.id}
                      className="flex-1 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {reserving === item.id ? "Reserving..." : "Reserve"}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 py-2 text-sm bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                    >
                      {item.status === "reserved" ? "Reserved" : "Sold"}
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(item)}
                    className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(item)}
                    className="flex-1 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-6 z-50" onClick={() => !creating && setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-black mb-6">Create Item</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                  placeholder="Item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                  placeholder="Item description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                  placeholder="e.g., Electronics, Textbooks"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-6 z-50" onClick={() => !updating && setShowEditModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-black mb-6">Edit Item</h2>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={updating}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {updating ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-6 z-50" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-black mb-2">Delete Item?</h2>
              <p className="text-gray-500">
                This action cannot be undone. This item will be permanently deleted.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-600 font-medium">
                You are about to delete: {selectedItem.name}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
