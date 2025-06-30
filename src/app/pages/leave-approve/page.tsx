import React from 'react';
import image from './image.jpg'; // Assuming the image is in the same directory

export default function page() {
  return (
    <div className="flex flex-col items-center p-4 m-4 mt-60">
      <img src='/image.png' alt="description" className="w-48 h-48 rounded-lg" />
      <p className="font-bold text-2xl text-center mt-4">No leaves, chup chap kaam karo.. 😡</p>
    </div>
  );
}