import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Check } from 'lucide-react';

interface ParentCodeModalProps {
    onClose: () => void;
    userId: string;
}

export const ParentCodeModal: React.FC<ParentCodeModalProps> = ({ onClose, userId }) => {
    const [mode, setMode] = useState<'check' | 'set' | 'change' | 'remove'>('check');
    const [step, setStep] = useState(1); // For change mode: 1=oldCode, 2=newCode, 3=confirmCode
    const [code, setCode] = useState('');
    const [confirmCode, setConfirmCode] = useState('');
    const [oldCode, setOldCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasExistingCode, setHasExistingCode] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [isConfirming, setIsConfirming] = useState(false); // Track if we're in confirm step for set mode

    // Check if user has existing code on mount
    React.useEffect(() => {
        setCheckingStatus(true);
        fetch(`/api/parent-code/check-status?userId=${userId}`)
            .then(res => res.json())
            .then(data => {
                setHasExistingCode(data.hasCode);
                setMode(data.hasCode ? 'change' : 'set');
                setCheckingStatus(false);
            })
            .catch(err => {
                console.error('Failed to check code status:', err);
                setMode('set'); // Default to set mode on error
                setCheckingStatus(false);
            });
    }, [userId]);

    const getCurrentInput = () => {
        if (mode === 'set') {
            return isConfirming ? confirmCode : code;
        }
        if (mode === 'change') {
            if (step === 1) return oldCode;
            if (step === 2) return code;
            if (step === 3) return confirmCode;
        }
        return code;
    };

    const handleNumberClick = (num: string) => {
        const currentInput = getCurrentInput();
        if (currentInput.length < 4) {
            if (mode === 'change') {
                if (step === 1) setOldCode(oldCode + num);
                else if (step === 2) setCode(code + num);
                else if (step === 3) setConfirmCode(confirmCode + num);
            } else if (mode === 'set') {
                // In set mode, fill code first, then confirmCode
                if (code.length < 4) {
                    setCode(code + num);
                } else if (confirmCode.length < 4) {
                    setConfirmCode(confirmCode + num);
                }
            } else {
                setCode(code + num);
            }
            setError('');
        }
    };

    const handleBackspace = () => {
        if (mode === 'change') {
            if (step === 1) setOldCode(oldCode.slice(0, -1));
            else if (step === 2) setCode(code.slice(0, -1));
            else if (step === 3) setConfirmCode(confirmCode.slice(0, -1));
        } else if (mode === 'set') {
            // In set mode, delete from confirmCode first if it has content
            if (confirmCode.length > 0) {
                setConfirmCode(confirmCode.slice(0, -1));
            } else {
                setCode(code.slice(0, -1));
            }
        } else {
            setCode(code.slice(0, -1));
        }
        setError('');
    };

    const handleNext = () => {
        if (mode === 'change' && step < 3) {
            const currentInput = getCurrentInput();
            if (currentInput.length !== 4) {
                setError('PIN must be 4 digits');
                return;
            }
            setStep(step + 1);
            setError('');
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (mode === 'set') {
            // Setting new code
            if (code.length !== 4) {
                setError('PIN must be 4 digits');
                return;
            }
            if (confirmCode.length !== 4) {
                setError('Please confirm your PIN');
                return;
            }
            if (code !== confirmCode) {
                setError('PINs do not match');
                return;
            }

            setLoading(true);
            try {
                const res = await fetch('/api/parent-code/set', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, code })
                });
                const data = await res.json();
                if (data.success) {
                    alert('Parent Code set successfully! ✅');
                    onClose();
                } else {
                    setError(data.error || 'Failed to set code');
                }
            } catch (err) {
                setError('Network error');
            } finally {
                setLoading(false);
            }
        } else if (mode === 'change') {
            // Changing existing code
            if (oldCode.length !== 4) {
                setError('Please enter current PIN');
                return;
            }
            if (code.length !== 4 || confirmCode.length !== 4) {
                setError('New PIN must be 4 digits');
                return;
            }
            if (code !== confirmCode) {
                setError('New PINs do not match');
                return;
            }

            setLoading(true);
            try {
                // First validate old code
                const validateRes = await fetch('/api/parent-code/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, code: oldCode })
                });
                const validateData = await validateRes.json();
                if (!validateData.valid) {
                    setError('Current PIN is incorrect');
                    setLoading(false);
                    setStep(1); // Go back to step 1
                    setOldCode('');
                    return;
                }

                // Then set new code
                const res = await fetch('/api/parent-code/set', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, code })
                });
                const data = await res.json();
                if (data.success) {
                    alert('Parent Code changed successfully! ✅');
                    onClose();
                } else {
                    setError(data.error || 'Failed to change code');
                }
            } catch (err) {
                setError('Network error');
            } finally {
                setLoading(false);
            }
        } else if (mode === 'remove') {
            // Removing code
            if (code.length !== 4) {
                setError('Please enter current PIN');
                return;
            }

            setLoading(true);
            try {
                const res = await fetch('/api/parent-code/remove', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, currentCode: code })
                });
                const data = await res.json();
                if (data.success) {
                    alert('Parent Code removed successfully! ✅');
                    onClose();
                } else {
                    setError(data.error || 'Failed to remove code');
                }
            } catch (err) {
                setError('Network error');
            } finally {
                setLoading(false);
            }
        }
    };

    if (checkingStatus) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-600 font-bold">Checking status...</p>
                </div>
            </div>
        );
    }

    const getStepLabel = () => {
        if (mode === 'set') {
            return isConfirming ? 'Re-enter 4-digit PIN:' : 'Enter 4-digit PIN:';
        }
        if (mode === 'change') {
            if (step === 1) return 'Enter Current PIN:';
            if (step === 2) return 'Enter New PIN:';
            if (step === 3) return 'Confirm New PIN:';
        }
        if (mode === 'remove') {
            return 'Enter Current PIN:';
        }
        return 'PIN:';
    };

    const getDisplayCode = () => {
        if (mode === 'set') {
            return isConfirming ? confirmCode : code;
        }
        if (mode === 'change') {
            if (step === 1) return oldCode;
            if (step === 2) return code;
            if (step === 3) return confirmCode;
        }
        return code;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X size={24} className="text-slate-400" />
                </button>

                {/* Header */}
                <div className="mb-6 text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">
                        {mode === 'set' ? '🔐 Set Parent Code' : mode === 'change' ? '🔄 Change Parent Code' : '❌ Remove Parent Code'}
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">
                        {mode === 'set' ? 'Create a 4-digit PIN to protect sensitive operations' :
                            mode === 'change' ? `Step ${step}/3: ${step === 1 ? 'Verify identity' : step === 2 ? 'Set new PIN' : 'Confirm new PIN'}` :
                                'Enter your current PIN to remove protection'}
                    </p>
                </div>

                {/* Mode Selector */}
                {hasExistingCode && (
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => {
                                setMode('change');
                                setStep(1);
                                setCode('');
                                setConfirmCode('');
                                setOldCode('');
                                setError('');
                            }}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${mode === 'change' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                        >
                            Change Code
                        </button>
                        <button
                            onClick={() => {
                                setMode('remove');
                                setCode('');
                                setConfirmCode('');
                                setOldCode('');
                                setError('');
                            }}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${mode === 'remove' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                        >
                            Remove Code
                        </button>
                    </div>
                )}

                {/* PIN Display */}
                <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 mb-2 text-center">
                        {getStepLabel()}
                    </label>
                    <div className="flex justify-center gap-2 mb-4">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="w-14 h-14 rounded-xl border-2 border-amber-300 bg-amber-50 flex items-center justify-center text-2xl font-bold text-amber-600">
                                {getDisplayCode()[i] ? '●' : ''}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold text-center">
                        {error}
                    </div>
                )}

                {/* Number Pad */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num.toString())}
                            className="h-14 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xl text-slate-700 transition-colors active:scale-95"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={handleBackspace}
                        className="h-14 bg-red-100 hover:bg-red-200 rounded-xl font-bold text-sm text-red-600 transition-colors active:scale-95"
                    >
                        ⌫
                    </button>
                    <button
                        onClick={() => handleNumberClick('0')}
                        className="h-14 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xl text-slate-700 transition-colors active:scale-95"
                    >
                        0
                    </button>
                    <button
                        onClick={() => {
                            const currentInput = getCurrentInput();
                            if (currentInput.length === 4) {
                                if (mode === 'set' && !isConfirming && code.length === 4) {
                                    // First PIN entered, switch to confirmation mode
                                    setIsConfirming(true);
                                    setError('');
                                } else if (mode === 'set' && isConfirming && confirmCode.length === 4) {
                                    // Confirmation entered, submit
                                    handleSubmit();
                                } else {
                                    handleNext();
                                }
                            }
                        }}
                        disabled={loading || getCurrentInput().length !== 4}
                        className="h-14 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-colors active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Check size={20} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
