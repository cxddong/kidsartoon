import React, { useState, useEffect } from 'react';
import { ImageCropperModal } from '../components/ImageCropperModal';
import { ArrowLeft, Camera, User, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const EditProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, updateProfile, activeProfile, deleteChildProfile } = useAuth();

    // Target: Active Child or Parent
    const targetProfile = activeProfile || user;

    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [language, setLanguage] = useState('English');
    const [avatarUrl, setAvatarUrl] = useState('');

    // New Fields
    const [gender, setGender] = useState<string>('');
    const [interests, setInterests] = useState<string[]>([]);

    const [isSaving, setIsSaving] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [cropImage, setCropImage] = useState<string | null>(null);

    // Shared Data
    const INTERESTS_LIST = [
        { id: 'robots', label: '🤖 Robots' },
        { id: 'animals', label: '🦊 Animals' },
        { id: 'space', label: '🚀 Space' },
        { id: 'princess', label: '👑 Princess' },
        { id: 'dinosaurs', label: '🦖 Dinosaurs' },
        { id: 'superheroes', label: '🦸 Heroes' },
        { id: 'cars', label: '🏎️ Cars' },
        { id: 'magic', label: '✨ Magic' },
    ];

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        // Load init state from Target Profile
        if (targetProfile) {
            setName(targetProfile.name || '');
            setAge(targetProfile.age?.toString() || '');
            setLanguage(targetProfile.language || 'English');

            // Handle different avatar fields (photoURL vs avatar)
            if (activeProfile) {
                setAvatarUrl(activeProfile.avatar || '');
                setGender(activeProfile.gender || '');
                setInterests(activeProfile.interests || []);
            } else {
                setAvatarUrl(user.photoURL || '');
                setGender(user.gender || '');
                setInterests(user.interests || []);
            }
        }
    }, [user, activeProfile, navigate]);

    // Helper: Compress Image
    const compressImage = (src: string): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_SIZE = 800; // Resize to max 800px

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error("Compression failed"));
                    }, 'image/jpeg', 0.7); // 70% Quality
                } else {
                    reject(new Error("Canvas context missing"));
                }
            };
            img.onerror = (err) => reject(err);
        });
    };

    const handleSave = async () => {
        if (!user) return;
        if (!name.trim()) return alert("Name cannot be empty");
        setIsSaving(true);
        setUploadError(null);

        try {
            let downloadUrl = user.photoURL;

            // 1. Image Upload (Isolated Step)
            if (avatarUrl && avatarUrl.startsWith('blob:')) {
                try {
                    // Compress first
                    const compressedBlob = await compressImage(avatarUrl);

                    // 7s Timeout for upload
                    const uploadPromise = (async () => {
                        const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}.jpg`);
                        const snapshot = await uploadBytes(storageRef, compressedBlob);
                        return await getDownloadURL(snapshot.ref);
                    })();

                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Upload Timed Out")), 7000)
                    );

                    // @ts-ignore
                    downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);

                } catch (e: any) {
                    console.warn("Edit Profile Upload Failed:", e);
                    setUploadError("Image upload failed (network). Saved text only.");
                    // SILENT FAIL for image: Proceed to save text data so user isn't stuck
                }
            }

            // 2. Profile Save (Firestore)
            // updateProfile now smartly handles activeProfile internally in AuthContext
            const savePromise = updateProfile({
                name,
                age: Number(age),
                language,
                photoURL: downloadUrl,
                gender,
                interests
            });

            // 15s Timeout specifically for Firestore save
            const saveTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Save Timed Out")), 15000)
            );

            await Promise.race([savePromise, saveTimeout]);

            navigate('/profile');

        } catch (error: any) {
            console.error("Failed to save profile", error);
            // Only alert if the CRITICAL save fails
            alert(`Failed to save profile: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCropImage(reader.result as string);
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const handleCropComplete = (blob: Blob) => {
        if (!cropImage) return;
        const url = URL.createObjectURL(blob);
        // We just update the URL. handleSave handles the blob via fetch or we can store the blob?
        // handleSave uses 'compressImage(avatarUrl)' which takes a src string. blob:url works.
        setAvatarUrl(url);
        setCropImage(null);
    };

    return (
        <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden max-h-[85vh] overflow-y-auto"
            >
                <div className="bg-blue-500 p-6 flex items-center text-white">
                    <button onClick={() => navigate('/profile')} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold ml-4">
                        Edit {activeProfile ? `${activeProfile.name}'s` : 'Parent'} Profile
                    </h1>
                </div>

                <div className="p-8 space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-slate-300 m-6" />
                                )}
                            </div>
                            <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera className="w-8 h-8 text-white" />
                                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                            </label>
                        </div>
                        <span className="text-xs font-bold text-slate-400 mt-2">Tap image to change</span>
                        {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
                    </div>

                    {/* Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1">Name</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Your Name"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Age</label>
                                <input
                                    type="number"
                                    value={age}
                                    onChange={e => setAge(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder=" Age"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Language</label>
                                <select
                                    value={language}
                                    onChange={e => setLanguage(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                                >
                                    <option value="English">English</option>
                                    <option value="French">French</option>
                                    <option value="Spanish">Spanish</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Gender Selector */}
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Gender / Character</label>
                        <div className="flex gap-4">
                            {['Boy', 'Girl'].map(g => (
                                <button
                                    key={g}
                                    onClick={() => setGender(g)}
                                    className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${gender === g ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Interests Selector */}
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Interests</label>
                        <div className="grid grid-cols-4 gap-2">
                            {INTERESTS_LIST.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setInterests(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])}
                                    className={`p-2 rounded-lg text-[10px] font-bold border transition-all flex flex-col items-center gap-1 ${interests.includes(item.id) ? 'bg-pink-50 border-pink-400 text-pink-600' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    <span className="text-lg">{item.label.split(' ')[0]}</span>
                                    <span className="truncate w-full text-center">{item.label.split(' ').slice(1).join(' ')}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                <div className="pt-6 flex gap-4 bg-slate-50 p-6 border-t border-slate-100 flex-wrap">
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>

                    {/* Delete Button - Only for Child Profiles */}
                    {activeProfile && (
                        <button
                            onClick={async () => {
                                if (window.confirm(`Are you sure you want to delete ${activeProfile.name}'s profile? This cannot be undone.`)) {
                                    setIsSaving(true);
                                    await deleteChildProfile(activeProfile.id);
                                    navigate('/profile');
                                    setIsSaving(false);
                                }
                            }}
                            className="flex-none px-4 py-3 rounded-xl font-bold text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="Delete Profile"
                        >
                            <Trash2 size={24} />
                        </button>
                    )}

                    {/* Import History Button - Only for Child Profiles */}
                    {activeProfile && (
                        <button
                            onClick={async () => {
                                if (window.confirm(`Import all Parent history into ${activeProfile.name}'s profile?`)) {
                                    setIsSaving(true);
                                    try {
                                        const res = await fetch(`/api/users/${user?.uid}/profiles/${activeProfile.id}/import`, { method: 'POST' });
                                        const data = await res.json();

                                        if (!res.ok) {
                                            throw new Error(data.error || 'Import failed');
                                        }

                                        const count = data.count ?? 0;
                                        alert(`Success! Transferred ${count} items to ${activeProfile.name}.`);
                                    } catch (e: any) {
                                        console.error(e);
                                        alert(`Import failed: ${e.message}`);
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }
                            }}
                            className="flex-none px-4 py-3 rounded-xl font-bold text-blue-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                            title="Import Parent History"
                        >
                            <span className="text-xl">📥</span>
                        </button>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-[2] py-3 bg-blue-500 text-white rounded-xl font-bold shadow-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                    >
                        {isSaving ? <span className="animate-spin">⏳</span> : <Check className="w-5 h-5" />}
                        Save Changes
                    </button>
                </div>
            </motion.div>

            {/* Cropper Modal */}
            {cropImage && (
                <ImageCropperModal
                    imageUrl={cropImage}
                    onCrop={handleCropComplete}
                    onCancel={() => setCropImage(null)}
                    aspectRatio={1}
                    circular={true}
                />
            )}
        </div>
    );
};

export default EditProfilePage;
