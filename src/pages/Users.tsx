import { useState, useEffect } from "react";

const API_BASE = "https://ms1-identity-157498364441.us-east1.run.app";

interface User {
  user_id: number;
  uni: string;
  student_name: string;
  dept_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  credibility_score: number;
  last_seen_at?: string;
  created_at?: string;
  updated_at?: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    uni: "",
    student_name: "",
    dept_name: "",
    email: "",
    phone: "",
    credibility_score: 100,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/users`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        await fetchUsers();
        setShowCreateModal(false);
        setFormData({
          uni: "",
          student_name: "",
          dept_name: "",
          email: "",
          phone: "",
          credibility_score: 100,
        });
      }
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  };

  const deleteUser = async (uni: string) => {
    if (!confirm(`Delete user ${uni}?`)) return;
    try {
      await fetch(`${API_BASE}/users/${uni}`, { method: "DELETE" });
      await fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-black">
                Identity Management
              </h1>
              <p className="text-gray-500 mt-2 font-light">
                Manage user accounts and profiles
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
            >
              Create User
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">👤</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No users yet
            </h3>
            <p className="text-gray-500 mb-8 font-light">
              Create your first user to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm inline-block"
            >
              Create User
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {users.map((user) => (
              <div
                key={user.uni}
                onClick={() => setSelectedUser(user)}
                className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-all cursor-pointer bg-white"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-medium text-gray-600">
                      {user.student_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-black">
                        {user.student_name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {user.uni} • {user.dept_name}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      Score: {user.credibility_score}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      ID: {user.user_id}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center p-6 z-50"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-black">
                  {selectedUser.student_name}
                </h2>
                <p className="text-gray-500 mt-1">{selectedUser.uni}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <DetailRow label="Department" value={selectedUser.dept_name} />
              <DetailRow label="Email" value={selectedUser.email} />
              {selectedUser.phone && (
                <DetailRow label="Phone" value={selectedUser.phone} />
              )}
              <DetailRow
                label="Credibility Score"
                value={selectedUser.credibility_score.toString()}
              />
              <DetailRow label="User ID" value={selectedUser.user_id.toString()} />
              {selectedUser.created_at && (
                <DetailRow
                  label="Created"
                  value={new Date(selectedUser.created_at).toLocaleDateString()}
                />
              )}
            </div>

            <button
              onClick={() => deleteUser(selectedUser.uni)}
              className="w-full py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
            >
              Delete User
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center p-6 z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-2xl font-bold text-black">Create User</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={createUser} className="space-y-6">
              <InputField
                label="UNI"
                value={formData.uni}
                onChange={(uni) => setFormData({ ...formData, uni })}
                placeholder="abc1234"
                required
              />
              <InputField
                label="Student Name"
                value={formData.student_name}
                onChange={(student_name) =>
                  setFormData({ ...formData, student_name })
                }
                placeholder="John Doe"
                required
              />
              <InputField
                label="Department"
                value={formData.dept_name}
                onChange={(dept_name) => setFormData({ ...formData, dept_name })}
                placeholder="Computer Science"
                required
              />
              <InputField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(email) => setFormData({ ...formData, email })}
                placeholder="abc1234@columbia.edu"
                required
              />
              <InputField
                label="Phone"
                value={formData.phone}
                onChange={(phone) => setFormData({ ...formData, phone })}
                placeholder="+1 (555) 123-4567"
              />
              <InputField
                label="Credibility Score"
                type="number"
                value={formData.credibility_score.toString()}
                onChange={(credibility_score) =>
                  setFormData({
                    ...formData,
                    credibility_score: parseInt(credibility_score) || 0,
                  })
                }
                placeholder="100"
              />

              <button
                type="submit"
                className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
              >
                Create User
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3 border-b border-gray-100">
      <span className="text-gray-500 font-light">{label}</span>
      <span className="text-black font-medium">{value}</span>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-300 transition-all"
      />
    </div>
  );
}
