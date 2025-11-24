import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_CONFIG } from "../config";

interface Reservation {
  reservation_id: string;
  item_id: number;
  buyer_id: number;
  status: "ACTIVE" | "INACTIVE";
  hold_expires_at: string;
  updated_at: string;
}

interface Item {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  status: string;
}

interface ReservationWithItem extends Reservation {
  item?: Item;
}

export default function Reservations() {
  const [reservations, setReservations] = useState<ReservationWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId] = useState(2); // TODO: Get from logged-in user

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_CONFIG.RESERVATION_SERVICE_URL}/reservations?buyer_id=${currentUserId}`);
      if (!response.ok) throw new Error("Failed to fetch reservations");
      const data = await response.json();
      setReservations(data);
    } catch (err: any) {
      setError(err.message || "Failed to load reservations. Service may not be deployed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm("Cancel this reservation? The item will be relisted.")) return;
    
    setError("");
    try {
      const response = await fetch(`${API_CONFIG.RESERVATION_SERVICE_URL}/reservations/${reservationId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to cancel reservation");
      await fetchReservations();
    } catch (err: any) {
      setError(err.message || "Failed to cancel reservation");
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="px-6 py-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold tracking-tight text-black">
            LionSwap
          </Link>
          <div className="flex gap-4">
            <Link to="/items" className="text-sm font-medium text-gray-500 hover:text-black">
              Items
            </Link>
            <Link to="/profile" className="text-sm font-medium text-gray-500 hover:text-black">
              Profile
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-black mb-2">My Reservations</h2>
          <p className="text-gray-500">Items you have reserved (72-hour holds)</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-pulse text-gray-400">Loading reservations...</div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔖</div>
            <p className="text-gray-500 mb-4">No active reservations</p>
            <Link to="/items" className="text-blue-500 hover:underline">
              Browse items to reserve
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reservations.map((reservation) => (
              <div key={reservation.reservation_id} className="border border-gray-200 rounded-xl p-6 hover:border-black transition-colors">
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-black">Item #{reservation.item_id}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      reservation.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {reservation.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>⏱️ {getTimeRemaining(reservation.hold_expires_at)}</p>
                    <p className="text-xs text-gray-400">
                      Expires: {new Date(reservation.hold_expires_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleCancelReservation(reservation.reservation_id)}
                    className="flex-1 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
