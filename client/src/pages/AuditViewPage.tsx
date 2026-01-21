import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Sparkles,
    Video,
    Book,
    Mic,
    Palette,
    MessageSquare,
    Camera,
    Wand2,
    Image as ImageIcon,
    Layout,
    Clock,
    Heart,
    Star,
    ScanLine
} from 'lucide-react';

// Modular Panels
import { ComicBuilderPanel } from '../components/builder/ComicBuilderPanel';
import { AnimationBuilderPanel } from '../components/builder/AnimationBuilderPanel';
import { PictureBookBuilderPanel } from '../components/builder/PictureBookBuilderPanel';
import { StoryBuilderPanel } from '../components/builder/StoryBuilderPanel';

// UI Helpers
import { BouncyButton } from '../components/ui/BouncyButton';
import { cn } from '../lib/utils';

/**
 * AuditViewPage
 * A comprehensive page for auditing all core creation components/UIs.
 */
export const AuditViewPage: React.FC = () => {
    const navigate = useNavigate();

    const handleMockGenerate = (data: any) => {
        console.log('Audit View: Mock generation requested with data:', data);
        alert('Audit View: Mock generation request captured. No API calls made.');
    };

    const SectionHeader = ({ icon: Icon, title, id, colorClass }: any) => (
        <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-4">
                <span className={cn("p-3 rounded-2xl shadow-sm", colorClass)}>
                    <Icon className="w-6 h-6" />
                </span>
                {title}
            </h2>
            <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-400 rounded-full uppercase tracking-widest border border-slate-200">
                AUDIT-ID: {id}
            </span>
        </div>
    );

    const MockCard = ({ children, className }: any) => (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn("bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 relative overflow-hidden", className)}
        >
            {children}
        </motion.section>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-12 overflow-y-auto selection:bg-purple-100">
            {/* SEO Ready Header */}
            <header className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-bold mb-4">
                        <Sparkles className="w-4 h-4" />
                        Audit Control Center v2.0
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none mb-4">
                        Creation Discovery Panel
                    </h1>
                    <p className="text-slate-500 text-xl font-medium max-w-2xl leading-relaxed">
                        Static UI Audit of all 12 core creation engines.
                        Testing layout, components, and SEO button accessibility.
                    </p>
                </div>
                <BouncyButton
                    onClick={() => navigate('/')}
                    className="flex items-center gap-3 bg-white border-2 border-slate-200 text-slate-700 font-bold px-6 py-3 rounded-2xl shadow-sm hover:border-purple-300 hover:text-purple-600 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Exit to App
                </BouncyButton>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 max-w-7xl mx-auto pb-32">

                {/* 1. COMIC BUILDER */}
                <MockCard>
                    <SectionHeader icon={Book} title="Comic Generation" id="COMIC_01" colorClass="bg-orange-100 text-orange-600" />
                    <div className="bg-slate-50/50 rounded-3xl p-1 border border-slate-100">
                        <ComicBuilderPanel onGenerate={handleMockGenerate} imageUploaded={true}>
                            <div className="h-full flex flex-col items-center justify-center bg-slate-100 rounded-2xl text-slate-400 font-bold uppercase tracking-widest text-xs">
                                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                Image Placeholder
                            </div>
                        </ComicBuilderPanel>
                    </div>
                </MockCard>

                {/* 2. MOVIE MAKER */}
                <MockCard>
                    <SectionHeader icon={Video} title="Animation Studio" id="MOVIE_02" colorClass="bg-blue-100 text-blue-600" />
                    <div className="bg-blue-50/30 rounded-3xl p-6 border border-blue-50/50">
                        <AnimationBuilderPanel
                            onGenerate={handleMockGenerate}
                            imageUploaded={true}
                            isGenerating={false}
                        />
                    </div>
                </MockCard>

                {/* 3. STORYBOOK BUILDER */}
                <MockCard className="xl:col-span-2">
                    <SectionHeader icon={Palette} title="Picture Book Creator" id="BOOK_03" colorClass="bg-emerald-100 text-emerald-600" />
                    <div className="bg-emerald-50/30 rounded-[2rem] p-8 border border-emerald-50/50">
                        <PictureBookBuilderPanel onGenerate={handleMockGenerate} imageUploaded={true} />
                    </div>
                </MockCard>

                {/* 4. AUDIO STORY */}
                <MockCard>
                    <SectionHeader icon={Mic} title="Audio Story Engine" id="AUDIO_04" colorClass="bg-purple-100 text-purple-600" />
                    <StoryBuilderPanel onGenerate={handleMockGenerate} imageUploaded={true} userId="audit-user" />
                </MockCard>

                {/* 5. GREETING CARD (MOCK UI) */}
                <MockCard>
                    <SectionHeader icon={Heart} title="Greeting Card Studio" id="CARD_05" colorClass="bg-rose-100 text-rose-600" />
                    <div className="space-y-6 opacity-80 cursor-not-allowed">
                        <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="aspect-square bg-rose-50 rounded-2xl border-2 border-rose-100 flex items-center justify-center text-rose-300">
                                    <Star className="w-6 h-6" />
                                </div>
                            ))}
                        </div>
                        <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-400 font-bold">Interactive Card Editor UI</p>
                            <p className="text-slate-300 text-sm mt-1">Multi-stage decoration & message flow</p>
                        </div>
                        <BouncyButton className="w-full bg-rose-500 text-white font-black py-4 rounded-2xl shadow-lg ring-4 ring-rose-100">
                            GENERATE GREETING CARD
                        </BouncyButton>
                    </div>
                </MockCard>

                {/* 6. MAGIC MIRROR (MOCK UI) */}
                <MockCard>
                    <SectionHeader icon={Camera} title="Magic Mirror (Discovery)" id="MIRROR_06" colorClass="bg-indigo-100 text-indigo-600" />
                    <div className="bg-slate-900 rounded-[2rem] p-8 aspect-video flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent" />
                        <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 ring-8 ring-white/5 group-hover:scale-110 transition-transform">
                            <ScanLine className="w-10 h-10 text-indigo-300 animate-pulse" />
                        </div>
                        <h3 className="text-white font-black text-xl mb-2">Analyzing Artwork...</h3>
                        <p className="text-indigo-200/60 text-sm">AI vision processing active</p>
                        <div className="mt-8 flex gap-3">
                            <div className="px-4 py-2 bg-indigo-500 text-white rounded-full text-xs font-bold">DISCOVER STYLE</div>
                            <div className="px-4 py-2 bg-white/10 text-white rounded-full text-xs font-bold backdrop-blur-sm">COLORIZE</div>
                        </div>
                    </div>
                </MockCard>

                {/* 7. MAGIC ART STUDIO */}
                <MockCard>
                    <SectionHeader icon={Palette} title="Magic Art Studio" id="ART_07" colorClass="bg-amber-100 text-amber-600" />
                    <div className="space-y-6">
                        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                            {['Colorize', 'Style Remix', 'Magic Texture'].map(label => (
                                <div key={label} className="px-6 py-2 bg-amber-50 rounded-full text-amber-600 text-sm font-black whitespace-nowrap border-2 border-amber-100">
                                    {label}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="aspect-[4/3] bg-slate-100 rounded-3xl border-2 border-slate-200 flex items-center justify-center text-slate-400 font-bold">Original</div>
                            <div className="aspect-[4/3] bg-amber-50 rounded-3xl border-2 border-amber-200 flex items-center justify-center text-amber-400 font-bold">✨ Magic</div>
                        </div>
                    </div>
                </MockCard>

                {/* 8. JUMP INTO ART (FUSION) */}
                <MockCard>
                    <SectionHeader icon={Wand2} title="Jump Into Art (Fusion)" id="FUSION_08" colorClass="bg-cyan-100 text-cyan-600" />
                    <div className="flex items-center justify-center gap-4 py-4">
                        <div className="w-32 h-44 bg-slate-100 rounded-2xl border-3 border-slate-200 flex flex-col items-center justify-center text-slate-300">
                            <ImageIcon className="w-8 h-8" />
                            <span className="text-[10px] font-bold mt-2">PHOTO</span>
                        </div>
                        <div className="text-cyan-400 font-black text-2xl">+</div>
                        <div className="w-32 h-44 bg-slate-100 rounded-2xl border-3 border-slate-200 flex flex-col items-center justify-center text-slate-300">
                            <Palette className="w-8 h-8" />
                            <span className="text-[10px] font-bold mt-2">ART</span>
                        </div>
                    </div>
                </MockCard>

                {/* 9. MAGIC LAB (AI COACH) */}
                <MockCard>
                    <SectionHeader icon={MessageSquare} title="AI Magic Lab" id="LAB_09" colorClass="bg-teal-100 text-teal-600" />
                    <div className="bg-slate-50 rounded-3xl p-6 h-[280px] flex flex-col">
                        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                            <div className="flex justify-end"><div className="bg-teal-500 text-white p-3 rounded-2xl rounded-tr-none text-sm font-medium max-w-[80%] shadow-sm">Help me draw a dragon!</div></div>
                            <div className="flex justify-start"><div className="bg-white text-slate-600 p-3 rounded-2xl rounded-tl-none text-sm font-medium max-w-[80%] shadow-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                                I'd love to! What color dragon?
                            </div></div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <div className="flex-1 bg-white border-2 border-slate-200 rounded-2xl px-4 py-2 text-slate-300 text-sm font-medium flex items-center">Ask Anything...</div>
                            <div className="p-2 bg-teal-100 text-teal-600 rounded-xl"><Mic className="w-5 h-5" /></div>
                        </div>
                    </div>
                </MockCard>

                {/* 10. ART COACH (JOURNEY) */}
                <MockCard>
                    <SectionHeader icon={Star} title="Art Coach Journey" id="JOURNEY_10" colorClass="bg-fuchsia-100 text-fuchsia-600" />
                    <div className="py-2">
                        <div className="relative border-l-4 border-fuchsia-100 ml-4 space-y-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="relative pl-8">
                                    <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-fuchsia-500 ring-4 ring-white flex items-center justify-center text-[10px] text-white font-bold">{i}</div>
                                    <h4 className="font-black text-slate-800 text-sm uppercase">Step {i}: {['Sketching', 'Detailing', 'Colors'][i - 1]}</h4>
                                    <p className="text-slate-400 text-xs mt-1">AI Guided feedback and next level tips</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </MockCard>

                {/* 11. CARTOON BOOK BUILDER */}
                <MockCard>
                    <SectionHeader icon={Layout} title="Cartoon Book Builder" id="CARTOON_11" colorClass="bg-lime-100 text-lime-600" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="aspect-[4/3] bg-slate-50 border-2 border-slate-200 rounded-3xl p-4 flex flex-col justify-end">
                            <div className="w-full h-2 bg-lime-100 rounded-full mb-2" />
                            <div className="w-2/3 h-2 bg-lime-100 rounded-full" />
                        </div>
                        <div className="grid grid-cols-2 grid-rows-2 gap-2">
                            {[1, 2, 3, 4].map(i => <div key={i} className="bg-slate-100 rounded-xl" />)}
                        </div>
                        <div className="col-span-2 flex items-center justify-between px-2">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Advanced Multi-Panel Engine</span>
                            <Clock className="w-4 h-4 text-slate-300" />
                        </div>
                    </div>
                </MockCard>

                {/* 12. MASTERPIECE PORTAL (ONE-CLICK) */}
                <MockCard className="xl:col-span-2 bg-gradient-to-br from-purple-900 to-indigo-950 border-none">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-purple-400 to-pink-500 p-0.5 shadow-2xl mb-8 animate-float">
                            <div className="w-full h-full bg-slate-950 rounded-[1.9rem] flex items-center justify-center">
                                <Wand2 className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <h2 className="text-4xl font-black text-white mb-4 tracking-tight">The Magic Portal</h2>
                        <p className="text-purple-200/60 text-lg max-w-xl mb-12">
                            Convert any sketch into high-quality production assets across all formats instantly.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl">
                            {['HD VIDEO', '4K COMIC', 'PODCAST', 'EPIC BOOK'].map(type => (
                                <div key={type} className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors">
                                    {type}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="absolute top-4 right-8 text-white/20 font-black text-8xl pointer-events-none">PORTAL_12</div>
                </MockCard>

            </div>

            <footer className="mt-24 text-center pb-24 border-t border-slate-200 pt-16">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                    &copy; {new Date().getFullYear()} KidsArtOon Global Creation Hub • Production Audit Mode
                </p>
                <div className="flex items-center justify-center gap-6 mt-8">
                    {['SYSTEM', 'STABLE', 'AUDIT_0.1', 'NODE_99'].map(t => (
                        <div key={t} className="flex items-center gap-1.5 opacity-30">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-[10px] font-bold text-slate-800 tracking-tighter">{t}</span>
                        </div>
                    ))}
                </div>
            </footer>
        </div>
    );
};

export default AuditViewPage;
