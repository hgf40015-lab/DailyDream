
import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { DreamImage } from '../types';
import { GalleryIcon, TrashIcon } from './icons/Icons';
import { getImagesFromDB, deleteImageFromDB, getImageCount } from '../services/imageStorage';

const PAGE_SIZE = 20;

const DreamGallery: React.FC = () => {
    const { translations, language } = useContext(LanguageContext);
    const [images, setImages] = useState<DreamImage[]>([]);
    const [selectedImage, setSelectedImage] = useState<DreamImage | null>(null);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    
    // Custom delete confirmation state
    const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

    // Initial load
    useEffect(() => {
        loadImages(0, true);
        refreshCount();
    }, []);

    const refreshCount = async () => {
        try {
            const count = await getImageCount();
            setTotalCount(count);
        } catch (e) {
            console.error("Failed to get count", e);
        }
    };

    const loadImages = async (pageIndex: number, reset = false) => {
        setLoading(true);
        try {
            const newImages = await getImagesFromDB(pageIndex * PAGE_SIZE, PAGE_SIZE);
            if (newImages.length < PAGE_SIZE) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            if (reset) {
                setImages(newImages);
                setPage(1); // Next page will be 1
            } else {
                setImages(prev => [...prev, ...newImages]);
                setPage(prev => prev + 1);
            }
        } catch (e) {
            console.error("Failed to load images", e);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        loadImages(page);
    };

    const promptDelete = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setDeleteCandidateId(id);
    };

    const confirmDelete = async () => {
        if (!deleteCandidateId) return;
        const id = deleteCandidateId;

        try {
            await deleteImageFromDB(id);
            setImages(prev => prev.filter(img => img.id !== id));
            setTotalCount(prev => prev - 1);
            
            // If the deleted image was currently open in lightbox, close it
            if (selectedImage && selectedImage.id === id) {
                setSelectedImage(null);
            }
        } catch (error) {
            console.error("Failed to delete", error);
        } finally {
            setDeleteCandidateId(null);
        }
    };

    const cancelDelete = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setDeleteCandidateId(null);
    }

    const handleDownload = (img: DreamImage) => {
        const link = document.createElement('a');
        link.href = img.imageUrl;
        link.download = `dream-gallery-${img.date}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-6xl mx-auto h-full pb-10">
            <div className="text-center mb-8 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -z-10"></div>
                <div className="w-16 h-16 mx-auto text-cyan-300 mb-2 drop-shadow-lg">
                    <GalleryIcon />
                </div>
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-blue-300">{translations.dreamGalleryTitle}</h2>
                <p className="text-gray-400">{translations.dreamGallerySubtitle}</p>
                <div className="mt-2 inline-block px-3 py-1 bg-gray-800/50 rounded-full border border-white/10 text-xs text-cyan-400 font-mono">
                    {translations.galleryTotal || "Stored"}: {totalCount}
                </div>
            </div>

            {images.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-800/30 rounded-2xl border border-white/5">
                    <p className="text-gray-500 text-lg">{translations.galleryEmpty}</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr mb-8">
                        {images.map((img) => (
                            <div 
                                key={img.id} 
                                onClick={() => setSelectedImage(img)}
                                className="group relative aspect-square bg-gray-800 rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-cyan-400/50 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
                            >
                                <img src={img.imageUrl} alt={img.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                                    <p className="text-white text-xs font-bold truncate mb-1">{img.prompt}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400">{new Date(img.date).toLocaleDateString()}</span>
                                        <button 
                                            onClick={(e) => promptDelete(img.id, e)}
                                            className="p-1.5 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                                            title={translations.deleteImage}
                                        >
                                            <div className="w-4 h-4"><TrashIcon /></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasMore && (
                        <div className="flex justify-center">
                            <button 
                                onClick={handleLoadMore} 
                                disabled={loading}
                                className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full font-bold border border-white/10 transition-all disabled:opacity-50"
                            >
                                {loading ? translations.loading : (translations.loadMore || "Load More")}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Lightbox Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
                    <button className="absolute top-4 right-4 text-white/50 hover:text-white p-2 z-50">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    
                    <div className="max-w-4xl w-full max-h-screen flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        <img src={selectedImage.imageUrl} alt={selectedImage.prompt} className="max-w-full max-h-[70vh] rounded-lg shadow-2xl border border-white/10" />
                        
                        <div className="mt-6 w-full text-center">
                            <p className="text-lg text-white font-medium mb-2">{selectedImage.prompt}</p>
                            <div className="flex justify-center gap-4 text-sm text-gray-400">
                                <span className="bg-white/10 px-3 py-1 rounded-full">{selectedImage.style}</span>
                                <span className="bg-white/10 px-3 py-1 rounded-full">{new Date(selectedImage.date).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="flex justify-center gap-4 mt-6">
                                <button 
                                    onClick={() => handleDownload(selectedImage)}
                                    className="px-8 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-full font-bold hover:shadow-lg hover:shadow-cyan-500/30 transition-all transform hover:scale-105"
                                >
                                    {translations.download || "Download"}
                                </button>
                                <button 
                                    onClick={(e) => promptDelete(selectedImage.id, e)}
                                    className="px-8 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full font-bold hover:bg-red-500 hover:text-white transition-all transform hover:scale-105 flex items-center gap-2"
                                >
                                    <div className="w-5 h-5"><TrashIcon /></div>
                                    <span>{translations.deleteImage || "Delete"}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {deleteCandidateId && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setDeleteCandidateId(null)}>
                    <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl transform scale-100" onClick={(e) => e.stopPropagation()}>
                        <div className="w-12 h-12 mx-auto bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-4">
                            <div className="w-6 h-6"><TrashIcon /></div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 text-center">
                            {translations.confirmDeleteTitle}
                        </h3>
                        <p className="text-gray-400 text-center mb-6 text-sm leading-relaxed">
                            {translations.confirmDeleteMsg}
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button 
                                onClick={(e) => cancelDelete(e)}
                                className="px-6 py-2.5 rounded-xl bg-gray-800 text-gray-300 font-medium hover:bg-gray-700 transition-colors border border-white/5"
                            >
                                {translations.close || "Cancel"}
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 shadow-lg hover:shadow-red-500/30 transition-all"
                            >
                                {translations.deleteImage || "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DreamGallery;
