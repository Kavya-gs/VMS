import React from 'react'
import { useEffect } from 'react';
import { useState } from 'react'
import API from '../../../../services/api';

const ProfilePage = () => {
    const [user, setUser] = useState(null);

    const fetchProfile = async() => {
        try {
            const res = await API.get("/auth/profile");
            setUser(res.data);
        } catch (error) {
            console.error("Profile fetch error", error);
        }
    };
    
    useEffect(() => {
        fetchProfile();
    },[]);

    if(!user){
        return <p className='text-center mt-10'>Loading profile...</p>
    }

  return (
    <div className="p-6 flex justify-center">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center">My Profile</h2>

        <div className="space-y-3">
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage