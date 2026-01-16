import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Book, Play, ArrowLeft, Printer, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MAGIC_PRODUCTS } from '../../../src/types/commerce';
import { cn } from '../lib/utils';
import Confetti from 'react-confetti';

const MagicPressPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedProduct, setSelectedProduct] = useState<'hardcover' | 'videobook' | null>(null);
    const [step, setStep] = useState<'select' | 'configure' | 'checkout'>('select');

    // Configuration State
    const [bookTitle, setBookTitle] = useState("My Magic Adventures");

    const handleSelectProduct = (id: 'hardcover' | 'videobook') => {
        setSelectedProduct(id);
        setStep('configure');
    };

    if (step === 'configure' && selectedProduct) {
        return (
            <div className="min-h-screen bg-slate-50 overflow-hidden flex flex-col">
                {/* Minimal Header */}
                <div className="px-8 py-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-20">
                    <button
                        onClick={() => setStep('select')}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                    <h2 className="text-xl font-bold text-slate-800">
                        Customize your {MAGIC_PRODUCTS.find(p => p.id === selectedProduct)?.name}
                    </h2>
                    <div className="w-20" />
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Preview */}
                    <div className="w-1/2 bg-slate-100 flex items-center justify-center relative p-10">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />

                        {/* 3D Preview Placeholder until imported */}
                        <div className="scale-150">
                            <div className="perspective-1000">
                                <div className="w-64 h-80 bg-purple-600 rounded-r-lg shadow-2xl transform -rotate-y-12 rotate-x-6 relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-4 bg-purple-800 opacity-50" />
                                    <div className="p-8 text-white flex flex-col items-center justify-center h-full text-center">
                                        <div className="w-24 h-24 bg-white/20 rounded-full mb-4 backdrop-blur-sm" />
                                        <h1 className="font-serif font-bold text-2xl leading-none">{bookTitle}</h1>
                                        <p className="mt-4 text-xs opacity-75 uppercase tracking-widest">Magic Press</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {selectedProduct === 'videobook' && (
                            <div className="absolute bottom-10 bg-white/80 backdrop-blur px-4 py-2 rounded-full text-xs font-bold text-slate-600 flex items-center gap-2">
                                <Play size={14} className="fill-slate-600" />
                                Video Screen Simulation Active
                            </div>
                        )}
                    </div>

                    {/* Right: Controls */}
                    <div className="w-1/2 bg-white flex flex-col p-10 overflow-y-auto">
                        <div className="max-w-md mx-auto w-full space-y-8">

                            {/* Title Input */}
                            <div>
                                <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Book Title</label>
                                <input
                                    type="text"
                                    value={bookTitle}
                                    onChange={(e) => setBookTitle(e.target.value)}
                                    className="w-full text-3xl font-black text-slate-800 border-b-2 border-slate-200 focus:border-purple-500 focus:outline-none py-2 bg-transparent transition-colors placeholder:text-slate-300"
                                    placeholder="Enter Title..."
                                />
                            </div>

                            {/* Asset Selection Placeholder */}
                            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <div className="flex items-center justify-center mb-4 text-4xl">🖼️</div>
                                <h3 className="text-center font-bold text-slate-600 mb-1">Select Artworks</h3>
                                <p className="text-center text-sm text-slate-400 mb-4">Choose 20-40 images for your storybook.</p>
                                <button className="w-full py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:border-purple-400 hover:text-purple-600 transition-all">
                                    Open Gallery (Coming Soon)
                                </button>
                            </div>

                            {/* Summary Mock */}
                            <div className="border-t border-slate-100 pt-8">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-slate-600">Subtotal</span>
                                    <span className="font-bold text-slate-800">${MAGIC_PRODUCTS.find(p => p.id === selectedProduct)?.price}</span>
                                </div>
                                <div className="flex justify-between items-center mb-8">
                                    <span className="font-bold text-slate-600">Shipping</span>
                                    <span className="font-bold text-green-600">Free</span>
                                </div>

                                <button
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    onClick={() => alert("Checkout Mockup")}
                                >
                                    <ShoppingCart size={24} />
                                    Order Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-100 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 px-8 py-6 flex items-center justify-between max-w-7xl mx-auto">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold"
                >
                    <ArrowLeft size={20} />
                    Back
                </button>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-2 rounded-xl text-white shadow-lg rotate-3">
                        <Printer size={24} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                        Magic Press <span className="text-purple-500">Store</span>
                    </h1>
                </div>
                <div className="w-20" /> {/* Spacer */}
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-6xl font-black text-slate-800 mb-6 leading-tight">
                        Turn your Digital Magic<br />
                        into <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Real Treasure</span>
                    </h2>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Choose a format to publish your masterpieces.
                        Premium quality, printed with love in Canada. 🇨🇦
                    </p>
                </div>

                {/* Products Grid */}
                <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto">
                    {MAGIC_PRODUCTS.map((product) => (
                        <motion.div
                            key={product.id}
                            whileHover={{ y: -8 }}
                            className={cn(
                                "group relative bg-white rounded-3xl p-8 border-2 cursor-pointer transition-all",
                                selectedProduct === product.id
                                    ? "border-purple-500 shadow-xl ring-4 ring-purple-100"
                                    : "border-slate-100 shadow-lg hover:shadow-xl hover:border-purple-200"
                            )}
                            onClick={() => handleSelectProduct(product.id as any)}
                        >
                            {/* Badger for Cinema Book */}
                            {product.id === 'videobook' && (
                                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white px-4 py-1.5 rounded-full font-bold shadow-lg transform rotate-6 border-2 border-white">
                                    Most Popular! 🔥
                                </div>
                            )}

                            <div className="h-48 bg-slate-50 rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden group-hover:bg-purple-50 transition-colors">
                                {product.id === 'hardcover' ? (
                                    <Book size={80} className="text-slate-300 group-hover:text-purple-400 transition-colors" />
                                ) : (
                                    <div className="relative">
                                        <Book size={80} className="text-slate-300 group-hover:text-rose-400 transition-colors" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-white rounded-full p-2 shadow-sm">
                                                <Play size={24} className="fill-rose-500 text-rose-500" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <h3 className="text-2xl font-black text-slate-800 mb-2">{product.name}</h3>
                            <p className="text-slate-500 mb-6 min-h-[48px]">{product.description}</p>

                            <ul className="space-y-3 mb-8">
                                {product.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                            <Star size={12} fill="currentColor" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                                <span className="text-3xl font-black text-slate-800">${product.price}</span>
                                <button className={cn(
                                    "px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
                                    selectedProduct === product.id
                                        ? "bg-purple-600 text-white shadow-lg"
                                        : "bg-slate-100 text-slate-600 group-hover:bg-purple-100 group-hover:text-purple-700"
                                )}>
                                    Select
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MagicPressPage;
