import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_CONFIG } from "../config";

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
  version?: number;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditingDept, setIsEditingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [etag, setEtag] = useState("");
  const navigate = useNavigate();

  const userUni = localStorage.getItem("user_uni");

  useEffect(() => {
    if (!userUni) {
      navigate("/login");
      return;
    }
    fetchUserProfile();
  }, [userUni]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.IDENTITY_SERVICE_URL}/users/${userUni}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Account not found");
        }
        throw new Error("Failed to load profile");
      }
      
      const data = await response.json();
      const etagHeader = response.headers.get("ETag");
      console.log("Profile loaded, ETag:", etagHeader);
      setUser(data);
      setEtag(etagHeader || "");
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userUni) return;

    try {
      setDeleting(true);
      const response = await fetch(`${API_CONFIG.IDENTITY_SERVICE_URL}/users/${userUni}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      localStorage.removeItem("user_uni");
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to delete account");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveDepartment = async () => {
    if (!user || !newDeptName.trim()) return;

    setUpdating(true);
    setError("");

    try {
      // Use the ETag that was fetched when the page loaded (stored in state)
      // This enables proper optimistic locking - if someone else modified the user
      // in another tab/session, the ETag will be outdated and backend returns 412
      let currentEtag = etag;
      console.log("Using ETag from page load:", currentEtag);
      
      // If no ETag available, use a dummy value to trigger 412 from backend
      if (!currentEtag) {
        currentEtag = 'W/"0"';
        console.log("No ETag available, using dummy value");
      }

      console.log("Sending PUT request with ETag:", currentEtag);
      const response = await fetch(`${API_CONFIG.IDENTITY_SERVICE_URL}/users/${user.uni}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "If-Match": currentEtag,
        },
        body: JSON.stringify({
          dept_name: newDeptName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Update failed:", response.status, errorData, "ETag used:", currentEtag);
        
        if (response.status === 412) {
          // ETag mismatch - refetch user data to get current state
          await fetchUserProfile();
          throw new Error("Profile was modified. Please try again with the updated information.");
        }
        
        throw new Error(errorData.detail || "Failed to update department");
      }

      const updatedUser = await response.json();
      const newEtag = response.headers.get("ETag");
      console.log("Update successful, new ETag:", newEtag);
      // Update local user state with new ETag
      setUser(updatedUser);
      setEtag(newEtag || "");
      setIsEditingDept(false);
      setNewDeptName("");
    } catch (err: any) {
      setError(err.message || "Failed to update department");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setNewDeptName(user?.dept_name || "");
    setIsEditingDept(false);
    setError("");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading profile...</div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-black mb-2">Error</h2>
          <p className="text-gray-500 mb-8">{error}</p>
          <Link to="/login" className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm inline-block">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-gray-400 hover:text-black text-sm transition-colors">
              ← Back to Home
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-black transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-4xl font-medium text-gray-600 mx-auto mb-6">
            {user?.student_name.charAt(0)}
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">
            {user?.student_name}
          </h1>
          <p className="text-gray-500">{user?.uni}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Profile Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6">
          <h2 className="text-xl font-semibold text-black mb-6">Account Information</h2>
          <div className="space-y-4">
            <ProfileField label="UNI" value={user?.uni || ""} />
            <ProfileField label="Email" value={user?.email || ""} />
            
            {/* Department Field with Edit */}
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500 font-light">Department</span>
              {isEditingDept ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    disabled={updating}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-black disabled:opacity-50"
                    placeholder="Department"
                  />
                  <button
                    onClick={handleSaveDepartment}
                    disabled={updating || !newDeptName.trim()}
                    className="px-3 py-1 bg-black text-white text-xs rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {updating ? "..." : "Save"}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={updating}
                    className="px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-black font-medium">{user?.dept_name || ""}</span>
                  <button
                    onClick={() => {
                      setIsEditingDept(true);
                      setNewDeptName(user?.dept_name || "");
                    }}
                    className="text-xs text-gray-500 hover:text-black transition-colors"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {user?.phone && <ProfileField label="Phone" value={user.phone} />}
            <ProfileField label="Credibility Score" value={user?.credibility_score.toString() || "0"} />
            {user?.created_at && (
              <ProfileField
                label="Member Since"
                value={new Date(user.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white border border-red-200 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Danger Zone</h2>
          <p className="text-gray-500 text-sm mb-6">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center p-6 z-50"
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-black mb-2">Delete Account?</h2>
              <p className="text-gray-500">
                This action cannot be undone. Your account and all associated data will be permanently deleted.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-600 font-medium">
                You are about to delete: {user?.student_name} ({user?.uni})
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3 border-b border-gray-100">
      <span className="text-gray-500 font-light">{label}</span>
      <span className="text-black font-medium">{value}</span>
    </div>
  );
}
