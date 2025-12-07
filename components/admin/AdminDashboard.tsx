import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { User, Trip } from '../../types';
import { LogOut, Users, Map, ShieldCheck, Search } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
    const { logout } = useApp();
    const [activeTab, setActiveTab] = useState<'users' | 'trips'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [allTrips, setAllTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Users
                const usersSnap = await getDocs(collection(db, 'users'));
                const usersData = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as User));
                setUsers(usersData);

                // Fetch Trips (Assuming 'trips' collection exists, or we use the 'trips' from context if global)
                // Since AppContext manages trips, we might not have a global 'trips' collection easily accessible 
                // if it's stored differently. But let's assume a root 'trips' collection or similar.
                // Actually, AppContext reads from 'trips'.
                const tripsSnap = await getDocs(collection(db, 'trips'));
                const tripsData = tripsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Trip));
                setAllTrips(tripsData);
            } catch (error) {
                console.error("Error fetching admin data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const passengers = users.filter(u => u.role === 'passenger');
    const drivers = users.filter(u => u.role === 'owner');

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900 text-white p-6 flex flex-col">
                <div className="mb-10">
                    <h1 className="text-2xl font-bold tracking-tight">Ladakh<span className="text-mmt-red">Connect</span></h1>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Admin Panel</p>
                </div>

                <nav className="flex-1 space-y-2">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'users' ? 'bg-mmt-red text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <Users size={20} /> Users
                    </button>
                    <button
                        onClick={() => setActiveTab('trips')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'trips' ? 'bg-mmt-red text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <Map size={20} /> Trips
                    </button>
                </nav>

                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 bg-[#E02E49] text-black font-bold rounded-xl hover:bg-red-600 transition shadow-lg"
                >
                    <LogOut size={20} /> Logout
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 capitalize">{activeTab} Overview</h2>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                        <Search size={16} className="text-gray-400" />
                        <input type="text" placeholder="Search..." className="bg-transparent outline-none text-sm" />
                    </div>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mmt-red"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'users' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Passengers Card */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Passengers ({passengers.length})
                                    </h3>
                                    <div className="space-y-4">
                                        {passengers.map(u => (
                                            <div key={u.uid} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition">
                                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{u.name}</p>
                                                    <p className="text-xs text-gray-500">{u.mobile}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Drivers Card */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Drivers ({drivers.length})
                                    </h3>
                                    <div className="space-y-4">
                                        {drivers.map(u => (
                                            <div key={u.uid} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition">
                                                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 font-bold">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{u.name}</p>
                                                    <p className="text-xs text-gray-500">{u.vehicleType} • {u.vehicleNo}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'trips' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Route</th>
                                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Date</th>
                                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Driver</th>
                                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {allTrips.map(trip => (
                                            <tr key={trip.id} className="hover:bg-gray-50 transition">
                                                <td className="p-4 font-bold text-gray-800">{trip.from} → {trip.to}</td>
                                                <td className="p-4 text-sm text-gray-500">{new Date(trip.date).toLocaleDateString()}</td>
                                                <td className="p-4 text-sm text-gray-600">{trip.driverName}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                            ${trip.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                            trip.status === 'BOOKED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
                          `}>
                                                        {trip.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-bold text-gray-800">₹ {trip.cost}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {allTrips.length === 0 && (
                                    <div className="p-8 text-center text-gray-400">No trips found.</div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
