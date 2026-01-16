import React, { useState } from 'react';
import { ImageCropperModal } from '../components/ImageCropperModal';
import { AssetUploadModal } from '../components/cartoon-book/AssetUploadModal';
import { useAuth } from '../context/AuthContext';

/**
 * Debug Page for Image Adjustment Modals
 * 
 * This page allows you to test and modify the image upload/adjustment modals
 * without going through the full app flow.
 * 
 * Access at: http://localhost:5173/debug/image-adjust
 */
export const ImageAdjustDebugPage: React.FC = () => {
    const { user } = useAuth();
    const [activeModal, setActiveModal] = useState<'cropper' | 'upload' | null>(null);
    const [testImage, setTestImage] = useState<string>('');

    // Sample test image (1x1 pixel placeholder)
    const sampleImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setTestImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-black text-slate-800 mb-2">
                        🛠️ Image Adjust Modal Debug Page
                    </h1>
                    <p className="text-slate-600">
                        Test and modify image upload/adjustment modals here
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                        <p className="text-sm text-blue-800">
                            <strong>路径 | Path:</strong> <code>/debug/image-adjust</code>
                        </p>
                    </div>
                </div>

                {/* Upload Test Image */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">📤 Upload Test Image</h2>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-slate-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-indigo-50 file:text-indigo-700
                            hover:file:bg-indigo-100 cursor-pointer"
                    />
                    {testImage && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-600 mb-2">Current Test Image:</p>
                            <img src={testImage} alt="Test" className="max-w-xs max-h-48 rounded border-2 border-slate-200" />
                        </div>
                    )}
                </div>

                {/* Modal Launchers */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* ImageCropperModal */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-3">
                            🖼️ ImageCropperModal
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Used for cropping and adjusting uploaded images
                        </p>
                        <button
                            onClick={() => {
                                if (!testImage) {
                                    alert('Please upload a test image first!');
                                    return;
                                }
                                setActiveModal('cropper');
                            }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                            Open ImageCropper
                        </button>
                        <div className="mt-3 p-3 bg-slate-50 rounded text-xs">
                            <p className="font-mono text-slate-700">
                                <strong>Component:</strong><br />
                                client/src/components/ImageCropperModal.tsx
                            </p>
                        </div>
                    </div>

                    {/* AssetUploadModal */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-3">
                            📁 AssetUploadModal
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Used for uploading assets in Cartoon Book Builder
                        </p>
                        <button
                            onClick={() => setActiveModal('upload')}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                            Open AssetUpload
                        </button>
                        <div className="mt-3 p-3 bg-slate-50 rounded text-xs">
                            <p className="font-mono text-slate-700">
                                <strong>Component:</strong><br />
                                client/src/components/cartoon-book/AssetUploadModal.tsx
                            </p>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-lg p-6 border-2 border-orange-200">
                    <h3 className="text-lg font-bold text-orange-900 mb-3">
                        💡 使用说明 | Instructions
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-orange-800">
                        <li>上传一张测试图片 | Upload a test image</li>
                        <li>点击相应按钮打开模态框 | Click button to open modal</li>
                        <li>在开发者工具中修改组件代码 | Modify component code in dev tools</li>
                        <li>Hot reload会自动更新 | Hot reload will auto-update</li>
                    </ol>
                    <div className="mt-4 p-3 bg-white rounded border border-orange-200">
                        <p className="text-xs text-slate-600">
                            <strong>提示 | Tip:</strong> 使用浏览器的React DevTools可以实时查看和修改组件props和state
                        </p>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {activeModal === 'cropper' && testImage && (
                <ImageCropperModal
                    imageUrl={testImage}
                    onCancel={() => setActiveModal(null)}
                    onCrop={(croppedBlob) => {
                        // Convert Blob to base64 for display
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const base64 = e.target?.result as string;
                            console.log('Cropped image:', base64.substring(0, 100) + '...');
                            setTestImage(base64);
                            setActiveModal(null);
                            alert('✅ Image cropped! Check console for details.');
                        };
                        reader.readAsDataURL(croppedBlob);
                    }}
                />
            )}

            {activeModal === 'upload' && (
                <AssetUploadModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    onComplete={(asset) => {
                        console.log('Asset completed from AssetUploadModal', asset);
                        setTestImage(asset.imageUrl);
                        setActiveModal(null);
                    }}
                    userId={user?.uid || 'test-user'}
                    slot="slot1"
                    slotLabel="Test Character"
                    vibe="modern"
                    userPoints={100}
                />
            )}
        </div>
    );
};
