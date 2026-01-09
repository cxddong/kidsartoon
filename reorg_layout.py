# Script to reorganize AnimationPage.tsx layout
import re

# Read the original file
with open(r'd:\KAT\KAT\client\src\pages\AnimationPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the params section
# Start: line with {step === 'params' &&
# End: closing )} before STEP 3 & 4 comment

params_start = content.find("                {/* STEP 2: PARAMETERS */}")
params_end = content.find("                {/* STEP 3 & 4: GENERATING & FINISHED */}")

if params_start == -1 or params_end == -1:
    print("Could not find section markers!")
    exit(1)

# Extract before and after
before = content[:params_start]
after = content[params_end:]

# New params section
new_params = '''                {/* STEP 2: PARAMETERS */}
                {step === 'params' && (
                   <div className="space-y-8 pb-32 lg:pb-0">
                        {/* TOP ROW: Style (Left) + Upload (Center) + Effect (Right) */}
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-start">
                            
                            {/* LEFT: STYLE */}
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm h-full flex flex-col">
                                <h3 className="text-white/90 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">🎨 Style</h3>
                                <div className="grid grid-cols-2 gap-1 w-full">
                                    {MAGIC_STYLES.map(sty => (
                                        <button
                                            key={sty.id}
                                            onClick={() => setStyle(prev => prev === sty.id ? undefined : sty.id)}
                                            className={cn(
                                                "w-full aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 relative overflow-hidden transition-all",
                                                style === sty.id ? "border-emerald-500 bg-emerald-500/20 scale-105 shadow-lg z-10" : "border-white/10 bg-white/5 hover:bg-white/10"
                                            )}
                                        >
                                            <img src={sty.image} className="absolute inset-0 w-full h-full object-cover" />
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                                <span className="text-[9px] font-black text-white uppercase block text-center truncate px-1">{sty.label}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <button className="w-full mt-auto py-3 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl text-[10px] font-black text-white/30 uppercase tracking-widest hover:bg-white/10 transition-colors cursor-not-allowed flex items-center justify-center gap-2">
                                    <span>More Incoming...</span>
                                    <span className="grayscale opacity-50">🚀</span>
                                </button>
                            </motion.div>

                            {/* CENTER: UPLOAD BOX */}
                            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center">
                                <div className="relative w-full aspect-square rounded-3xl overflow-hidden border-4 border-white/10 bg-black/20 shadow-2xl max-w-[320px] lg:w-[320px]">
                                    <img src={imagePreview!} className="w-full h-full object-contain" />
                                    <button
                                        onClick={() => setStep('upload')}
                                        className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-black/80 backdrop-blur-md transition-colors"
                                    >
                                        Change Photo
                                    </button>
                                </div>
                            </motion.div>

                            {/* RIGHT: EFFECT */}
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm h-full flex flex-col">
                                <h3 className="text-white/90 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">✨ Effect</h3>
                                <div className="grid grid-cols-2 gap-1 w-full">
                                    {MAGIC_EFFECTS.map(eff => (
                                        <button
                                            key={eff.id}
                                            onClick={() => setEffect(prev => prev === eff.id ? undefined : eff.id)}
                                            className={cn(
                                                "w-full aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 relative overflow-hidden transition-all",
                                                effect === eff.id ? "border-amber-500 bg-amber-500/20 scale-105 shadow-lg z-10" : "border-white/10 bg-white/5 hover:bg-white/10"
                                            )}
                                        >
                                            <img src={eff.image} className="absolute inset-0 w-full h-full object-cover" />
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                                <span className="text-[9px] font-black text-white uppercase block text-center truncate px-1">{eff.label}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <button className="w-full mt-auto py-3 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl text-[10px] font-black text-white/30 uppercase tracking-widest hover:bg-white/10 transition-colors cursor-not-allowed flex items-center justify-center gap-2">
                                    <span>More Incoming...</span>
                                    <span className="grayscale opacity-50">🚀</span>
                                </button>
                            </motion.div>
                        </div>

                        {/* ACTION ROW - Below Upload */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
                            <div className="space-y-3 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm">
                                <h3 className="text-white/90 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">🎬 Action</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 w-full">
                                    {MAGIC_ACTIONS.map(act => (
                                        <button
                                            key={act.id}
                                            onClick={() => setAction(prev => prev === act.id ? undefined : act.id)}
                                            className={cn(
                                                "w-full aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 relative overflow-hidden transition-all",
                                                action === act.id ? "border-blue-500 bg-blue-500/20 scale-105 shadow-lg z-10" : "border-white/10 bg-white/5 hover:bg-white/10"
                                            )}
                                        >
                                            <img src={act.image} className="absolute inset-0 w-full h-full object-cover" />
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                                <span className="text-[9px] font-black text-white uppercase block text-center truncate px-1">{act.label}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Controls Section - Below Action */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-4">
                            {/* 1. CHOOSE SPELL */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <h3 className="text-white/90 text-sm font-black uppercase tracking-widest flex items-center gap-2">🪄 Choose Spell</h3>
                                    <span className="text-xs font-bold text-yellow-400">{SPELLS[selectedSpell].cost} Credits</span>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <button onClick={() => { setSelectedSpell('quick'); setTextInput(prev => prev.slice(0, 50)); }}
                                        className={cn("flex flex-col items-center justify-center p-3 rounded-xl border transition-all relative overflow-hidden",
                                            selectedSpell === 'quick' ? "ring-2 ring-blue-400 bg-slate-700/80 border-transparent" : "bg-white/5 border-white/10 hover:bg-white/10"
                                        )}>
                                        <div className="text-2xl mb-1">⚡️</div>
                                        <div className="text-sm font-bold text-white">Quick</div>
                                        <div className="text-[10px] text-slate-400">4s</div>
                                    </button>

                                    <div className="relative group">
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-[9px] px-2 py-0.5 rounded-full text-white font-bold whitespace-nowrap z-20 shadow-lg border border-purple-400">BEST</div>
                                        <button onClick={() => { setSelectedSpell('story'); setTextInput(prev => prev.slice(0, 120)); }}
                                            className={cn("w-full h-full flex flex-col items-center justify-center p-3 rounded-xl border transition-all relative overflow-hidden",
                                                selectedSpell === 'story' ? "ring-2 ring-purple-500 bg-slate-700/80 border-transparent shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "bg-white/5 border-white/10 hover:bg-white/10"
                                            )}>
                                            <div className="text-2xl mb-1">📖</div>
                                            <div className="text-sm font-bold text-white">Story</div>
                                            <div className="text-[10px] text-slate-400">8s</div>
                                        </button>
                                    </div>

                                    <button onClick={() => { setSelectedSpell('cinema'); }}
                                        className={cn("flex flex-col items-center justify-center p-3 rounded-xl border transition-all relative overflow-hidden",
                                            selectedSpell === 'cinema' ? "ring-2 ring-yellow-500 bg-slate-700/80 border-transparent" : "bg-white/5 border-white/10 hover:bg-white/10"
                                        )}>
                                        <div className="text-2xl mb-1">🎬</div>
                                        <div className="text-sm font-bold text-white">Cinema</div>
                                        <div className="text-[10px] text-yellow-200">HD 720P</div>
                                    </button>
                                </div>
                            </div>

                            {/* 2. More (Optional) */}
                            <div className="bg-slate-800/50 rounded-2xl p-3 border-2 border-slate-700/50">
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <h3 className="text-white/90 text-sm font-black uppercase tracking-widest flex items-center gap-2">✨ More (Optional)</h3>
                                    </div>

                                    <textarea
                                        value={textInput}
                                        onChange={e => {
                                            const maxChars = selectedSpell === 'cinema' ? 200 : selectedSpell === 'story' ? 120 : 50;
                                            setTextInput(e.target.value.slice(0, maxChars));
                                        }}
                                        placeholder="e.g., The character jumps and waves hello!"
                                        className="w-full h-24 bg-slate-900/50 border-2 border-slate-700/50 rounded-xl p-3 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500/50 transition-colors text-sm"
                                        maxLength={selectedSpell === 'cinema' ? 200 : selectedSpell === 'story' ? 120 : 50}
                                    />
                                    <div className="text-right">
                                        <span className="text-[10px] text-slate-500">
                                            {textInput.length}/{selectedSpell === 'cinema' ? 200 : selectedSpell === 'story' ? 120 : 50}
                                        </span>
                                    </div>

                                    {/* Voice Input Option */}
                                    <div className="flex justify-center mt-4">
                                        <button
                                            onClick={() => {
                                                if (!isListening) handleListen();
                                            }}
                                            className="relative group flex items-center justify-center"
                                            title="Click to Speak"
                                        >
                                            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/40 transition-colors"></div>
                                            <img src="/mic_icon_3d.png" alt="Mic" className="relative w-32 h-32 object-contain drop-shadow-2xl" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerate}
                                className="w-full py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white rounded-3xl font-black text-xl flex flex-col items-center justify-center"
                            >
                                <div className="flex items-center gap-2">
                                    <Wand2 className="w-6 h-6" />
                                    <span>Generate!</span>
                                </div>
                                <span className="text-xs font-bold text-white/70 bg-black/20 px-3 py-0.5 rounded-full mt-1">-{calculateCredits()} Credits</span>
                            </button>
                        </motion.div>
                    </div>
                )}

'''

# Rebuild the file
new_content = before + new_params + after

# Write back
with open(r'd:\KAT\KAT\client\src\pages\AnimationPage.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Layout reorganized successfully!")
