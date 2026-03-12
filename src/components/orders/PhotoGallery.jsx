/*
import React, { useState } from 'react';
import { Camera, X, Upload, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

function PhotoGallery({ orderId, existingPhotos = [], onPhotosChange }) {
  const [photos, setPhotos] = useState(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const { uploadPhoto, deletePhoto, updateOrder } = useApp();

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => uploadPhoto(file, orderId));
      const newPhotoUrls = await Promise.all(uploadPromises);
      
      const updatedPhotos = [...photos, ...newPhotoUrls];
      setPhotos(updatedPhotos);
      
      // Actualizar la orden con las nuevas fotos
      await updateOrder(orderId, { photos: updatedPhotos });
      
      if (onPhotosChange) onPhotosChange(updatedPhotos);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Error al subir fotos: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoUrl) => {
    if (!window.confirm('¿Eliminar esta foto?')) return;

    try {
      await deletePhoto(photoUrl);
      const updatedPhotos = photos.filter(p => p !== photoUrl);
      setPhotos(updatedPhotos);
      await updateOrder(orderId, { photos: updatedPhotos });
      if (onPhotosChange) onPhotosChange(updatedPhotos);
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Error al eliminar foto: ' + error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          <Camera className="w-4 h-4 mr-2 text-primary-500" />
          Fotos de la joya
        </h3>
        <span className="text-xs text-gray-500">{photos.length} fotos</span>
      </div>

      {/* Grid de fotos existentes * /}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`Foto ${index + 1}`}
                className="w-full h-20 object-cover rounded-lg border border-gray-200"
              />
              <button
                onClick={() => handleDeletePhoto(photo)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Eliminar"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botón de subida * /}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          id="photo-upload"
          disabled={uploading}
        />
        <label
          htmlFor="photo-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
              <span className="text-sm text-gray-500">Subiendo...</span>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Haz clic para subir fotos</span>
              <span className="text-xs text-gray-400 mt-1">JPG, PNG hasta 5MB</span>
            </>
          )}
        </label>
      </div>

      {/* Mensaje informativo * /}
      <p className="text-xs text-gray-400 text-center">
        Las fotos se almacenan en Supabase Storage (1GB gratis)
      </p>
    </div>
  );
}

export default PhotoGallery;
*/