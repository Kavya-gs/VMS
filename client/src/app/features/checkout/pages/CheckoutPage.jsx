import React, { useEffect, useState } from 'react'
import API from '../../../../services/api';

const CheckoutPage = () => {
    const [visitors, setVisitors] = useState([]);

    const fetchVisitors = async() => {
        try{
            const res = await API.get("/visitors");
            const insideVisitors = res.data.filter((visitor) => !visitor.checkOutTime);
            setVisitors(insideVisitors);
        }
        catch(error){
            console.error("Error fetching Visitors", error);
        }
    };

    useEffect(() => {
        fetchVisitors();
    },[]);

    const handleCheckout  = async(id) => {
        try { 
            await API.put(`/visitors/checkout/${id}`);
            alert("Visitor Checked Out");
            fetchVisitors(); // for refresh
        } catch (error) {
            console.error(error);
            alert("Error Checking Out");
        }
    };

  return (
    <div className='p-6'>
        <h1 className='text-2xl font-bold mb-6'>Visitor's Inside</h1>
        <table className='w-full border border-gray-300'>
            <thead className='bg-gray-300'>
                <tr>
                    <th className='border p-3'>Name</th>
                    <th className='border p-3'>Email</th>
                    <th className='border p-3'>Purpose</th>
                    <th className='border p-3'>Person To Meet</th>
                    <th className='border p-3'>Check-In</th>
                    <th className='border p-3'>Action</th>
                </tr>
            </thead>
            <tbody>
                {visitors.map((visitor) =>(
                    <tr key={visitor._id} className="text-center">
                        <td className='border p-2'>{visitor.name}</td>
                        <td className='border p-2'>{visitor.email}</td>
                        <td className='border p-2'>{visitor.purpose}</td>
                        <td className='border p-2'>{visitor.personToMeet}</td>
                        
                        <td className="border p-2">
                        {new Date(visitor.createdAt).toLocaleString()}
                        </td>

                        <td className="border p-2">
                        <button onClick={() => handleCheckout(visitor._id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
                            Checkout
                        </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  )
}

export default CheckoutPage