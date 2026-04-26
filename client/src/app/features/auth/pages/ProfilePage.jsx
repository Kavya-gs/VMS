import React from 'react'
import { useEffect } from 'react';
import { useState } from 'react'
import toast from 'react-hot-toast';
import API from '../../../../services/api';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '' });

    const fetchProfile = async() => {
        try {
            const res = await API.get("/auth/profile");
            setUser(res.data);
            setFormData({
                name: res.data.name || '',
                phone: res.data.phone || '',
            });
        } catch (error) {
            console.error("Profile fetch error", error);
            toast.error("Failed to load profile");
        }
    };
    
    useEffect(() => {
        fetchProfile();
    },[]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        if (!formData.name.trim() || formData.name.trim().length < 2) {
            toast.error("Name must be at least 2 characters");
            return;
        }

        if (formData.phone && formData.phone.trim().length > 0) {
            const phoneRegex = /^[\d\s()+-]+$/;
            if (!phoneRegex.test(formData.phone.trim()) || formData.phone.trim().length < 7) {
                toast.error("Invalid phone number format");
                return;
            }
        }

        setLoading(true);
        try {
            const res = await API.put("/auth/profile", {
                name: formData.name,
                phone: formData.phone || null,
            });
            setUser(res.data.user);
            setIsEditing(false);
            toast.success("Profile updated successfully!");
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to update profile";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: user?.name || '',
            phone: user?.phone || '',
        });
        setIsEditing(false);
    };

    if(!user){
        return <p className='text-center mt-10'>Loading profile...</p>
    }

    return (
        <div className="p-6 flex justify-center">
            <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">My Profile</h2>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm font-medium"
                        >
                            Edit
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                disabled
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="+1 (555) 123-4567"
                                disabled={loading}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Format: digits, spaces, +, -, or ()</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={user.email}
                                disabled
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <input
                                type="text"
                                value={user.role}
                                disabled
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
                            >
                                {loading ? "Saving..." : "Save"}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p><strong>Name:</strong> {user.name}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Phone:</strong> {user.phone || <span className="text-gray-500">Not provided</span>}</p>
                        <p><strong>Role:</strong> <span className="capitalize px-2 py-1 bg-blue-100 text-blue-600 rounded text-sm">{user.role}</span></p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ProfilePage