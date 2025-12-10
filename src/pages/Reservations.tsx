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

interface ItemImage {
  id: number;
  item_id: number;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

interface ItemWithImages extends Item {
  images?: ItemImage[];
}

interface ReservationWithItem extends Reservation {
  item?: ItemWithImages;
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
      
      // Verify each item still exists, fetch item details, and remove reservations for missing items
      const validReservations: ReservationWithItem[] = [];
      const missingItemReservations: string[] = [];
      
      for (const reservation of data) {
        try {
          const itemResponse = await fetch(`${API_CONFIG.CATALOG_SERVICE_URL}/items/${reservation.item_id}`);
          if (itemResponse.ok) {
            const item = await itemResponse.json();
            
            // Fetch images for the item
            try {
              const imagesResponse = await fetch(
                `${API_CONFIG.CATALOG_SERVICE_URL}/items/${reservation.item_id}/images`
              );
              if (imagesResponse.ok) {
                const images: ItemImage[] = await imagesResponse.json();
                validReservations.push({ ...reservation, item: { ...item, images } });
              } else {
                validReservations.push({ ...reservation, item: { ...item, images: [] } });
              }
            } catch {
              validReservations.push({ ...reservation, item: { ...item, images: [] } });
            }
          } else {
            // Item doesn't exist, mark for deletion
            missingItemReservations.push(reservation.reservation_id);
          }
        } catch {
          // If fetch fails, keep the reservation without item details (might be network issue)
          validReservations.push(reservation);
        }
      }
      
      // Delete reservations for missing items
      for (const reservationId of missingItemReservations) {
        try {
          await fetch(`${API_CONFIG.RESERVATION_SERVICE_URL}/reservations/${reservationId}`, {
            method: "DELETE",
          });
        } catch {
          // Ignore deletion errors
        }
      }
      
      setReservations(validReservations);
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

  const handleReReserve = async (itemId: number, reservationId: string) => {
    setError("");
    try {
      // First, delete all inactive reservations for this item
      const inactiveReservations = reservations.filter(
        r => r.item_id === itemId && r.status === "INACTIVE"
      );
      
      for (const inactiveRes of inactiveReservations) {
        try {
          await fetch(`${API_CONFIG.RESERVATION_SERVICE_URL}/reservations/${inactiveRes.reservation_id}`, {
            method: "DELETE",
          });
        } catch {
          // Continue even if deletion fails
        }
      }

      // Now create the new reservation
      const response = await fetch(`${API_CONFIG.RESERVATION_SERVICE_URL}/items/${itemId}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyer_id: currentUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to re-reserve item");
      }

      alert("Item re-reserved successfully!");
      await fetchReservations();
    } catch (err: any) {
      setError(err.message || "Failed to re-reserve item. Item may no longer be available.");
    }
  };

  const handleCleanupInactive = async () => {
    if (!confirm("Delete all inactive reservations?")) return;
    
    setError("");
    const inactiveReservations = reservations.filter(r => r.status === "INACTIVE");
    
    for (const reservation of inactiveReservations) {
      try {
        await fetch(`${API_CONFIG.RESERVATION_SERVICE_URL}/reservations/${reservation.reservation_id}`, {
          method: "DELETE",
        });
      } catch {
        // Continue even if deletion fails
      }
    }
    
    await fetchReservations();
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
            <p className="text-gray-500 mb-4">No reservations found</p>
            <Link to="/items" className="text-blue-500 hover:underline">
              Browse items to reserve
            </Link>
          </div>
        ) : (
          <>
            {/* Active Reservations */}
            {reservations.filter(r => r.status === "ACTIVE").length > 0 && (
              <div className="mb-12">
                <h3 className="text-xl font-bold text-black mb-4">Active Reservations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reservations.filter(r => r.status === "ACTIVE").map((reservation) => {
                    const primaryImage = reservation.item?.images?.find(img => img.is_primary) || reservation.item?.images?.[0];
                    
                    return (
              <div key={reservation.reservation_id} className="border border-gray-200 rounded-xl overflow-hidden hover:border-black transition-colors">
                {/* Image Section */}
                {primaryImage ? (
                  <div className="aspect-video w-full bg-gray-100 overflow-hidden">
                    <img 
                      src={primaryImage.image_url} 
                      alt={primaryImage.alt_text || reservation.item?.name || `Item #${reservation.item_id}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-4xl">📦</div>';
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-gray-100 flex items-center justify-center text-gray-400 text-4xl">
                    📦
                  </div>
                )}
                
                {/* Content Section */}
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-black">
                        {reservation.item?.name || `Item #${reservation.item_id}`}
                      </h3>
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
              </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inactive Reservations */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold text-black">Inactive Reservations</h3>
                  <p className="text-sm text-gray-500">These reservations have expired or been cancelled</p>
                </div>
                {reservations.filter(r => r.status === "INACTIVE").length > 0 && (
                  <button
                    onClick={handleCleanupInactive}
                    className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Clear All Inactive
                  </button>
                )}
              </div>
              {reservations.filter(r => r.status === "INACTIVE").length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reservations.filter(r => r.status === "INACTIVE").map((reservation) => {
                    const primaryImage = reservation.item?.images?.find(img => img.is_primary) || reservation.item?.images?.[0];
                    
                    return (
              <div key={reservation.reservation_id} className="border border-gray-200 rounded-xl overflow-hidden opacity-60">
                {/* Image Section */}
                {primaryImage ? (
                  <div className="aspect-video w-full bg-gray-100 overflow-hidden">
                    <img 
                      src={primaryImage.image_url} 
                      alt={primaryImage.alt_text || reservation.item?.name || `Item #${reservation.item_id}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-4xl">📦</div>';
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-gray-100 flex items-center justify-center text-gray-400 text-4xl">
                    📦
                  </div>
                )}
                
                {/* Content Section */}
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-black">
                        {reservation.item?.name || `Item #${reservation.item_id}`}
                      </h3>
                      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                        {reservation.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>❌ Expired</p>
                      <p className="text-xs text-gray-400">
                        Expired: {new Date(reservation.hold_expires_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleReReserve(reservation.item_id, reservation.reservation_id)}
                      className="flex-1 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors opacity-100"
                    >
                      Re-reserve
                    </button>
                  </div>
                </div>
              </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border border-gray-200 rounded-xl">
                  <p className="text-gray-400">No inactive reservations</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
