"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, MessageCircle, CheckCircle, X } from "lucide-react";
import { useTheme } from "next-themes";
import { usePoints } from "@/contexts/PointsContext";
import { useAuth } from "@/contexts/AuthContext";

interface FeedbackPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROTOCOL_OPTIONS = [
  "Aave",
  "Uniswap",
  "Compound",
  "Curve",
  "Balancer",
  "Other",
];
const STRATEGY_OPTIONS = [
  "Lending",
  "Yield Farming",
  "Staking",
  "Liquidity Provisioning",
  "Leverage",
  "Other",
];

export default function FeedbackPanel({ isOpen, onClose }: FeedbackPanelProps) {
  const { theme } = useTheme();
  const { refreshPoints } = usePoints();
  const { email, address } = useAuth();

  // Form state
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>([]);
  const [protocolOther, setProtocolOther] = useState("");
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [strategyOther, setStrategyOther] = useState("");
  const [rating, setRating] = useState(5);
  const [additionalFeedback, setAdditionalFeedback] = useState("");
  
  // UI state
  const [isExiting, setIsExiting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [isSocialExiting, setIsSocialExiting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on initial load
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleGoBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
      resetForm();
    }, 300);
  };

  const resetForm = () => {
    setSelectedProtocols([]);
    setProtocolOther("");
    setSelectedStrategies([]);
    setStrategyOther("");
    setRating(5);
    setAdditionalFeedback("");
    setCurrentStep(1);
    setSubmitted(false);
  };

  const handleMultiSelect = (
    option: string,
    selected: string[],
    setSelected: (v: string[]) => void
  ) => {
    setSelected(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option]
    );
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    if (!address || !email) {
      console.error("Missing address or email:", { address, email });
      setProcessing(false);
      return;
    }

    const feedbackData = {
      protocols: selectedProtocols.includes("Other")
        ? [
            ...selectedProtocols.filter((p) => p !== "Other"),
            protocolOther.trim(),
          ].filter(Boolean)
        : selectedProtocols,
      strategies: selectedStrategies.includes("Other")
        ? [
            ...selectedStrategies.filter((s) => s !== "Other"),
            strategyOther.trim(),
          ].filter(Boolean)
        : selectedStrategies,
      rating,
      additionalFeedback: additionalFeedback.trim(),
    };

    try {
      const response = await fetch("/api/feedbacks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...feedbackData,
          walletAddress: address,
          email: email,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to submit feedback");
      }

      // Refresh points after successful submission
      refreshPoints();
      setSubmitted(true);

      setTimeout(() => {
        setShowSocialModal(true);
        resetForm();
      }, 1000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      // You might want to show an error message to the user here
    } finally {
      setProcessing(false);
    }
  };

  const handleSocialClose = () => {
    setIsSocialExiting(true);
    setTimeout(() => {
      setShowSocialModal(false);
      setIsSocialExiting(false);
      onClose();
    }, 300);
  };

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return selectedProtocols.length > 0 && 
          (!selectedProtocols.includes("Other") || protocolOther.trim().length > 0);
      case 2:
        return selectedStrategies.length > 0 &&
          (!selectedStrategies.includes("Other") || strategyOther.trim().length > 0);
      case 3:
        return true; // Rating always has a value
      case 4:
        return true; // Additional feedback is optional
      default:
        return false;
    }
  };

  const canSubmit = selectedProtocols.length > 0 &&
    selectedStrategies.length > 0 &&
    (!selectedProtocols.includes("Other") || protocolOther.trim().length > 0) &&
    (!selectedStrategies.includes("Other") || strategyOther.trim().length > 0) &&
    !submitted &&
    !processing;

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">What DeFi protocol do you want to see?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROTOCOL_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className={`flex items-center px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedProtocols.includes(opt)
                      ? theme === "dark"
                        ? "bg-purple-600 border-purple-400 text-white"
                        : "bg-purple-100 border-purple-500 text-purple-600"
                      : theme === "dark"
                      ? "bg-gray-800 border-gray-700 text-gray-200"
                      : "bg-gray-100 border-gray-300 text-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedProtocols.includes(opt)}
                    onChange={() =>
                      handleMultiSelect(
                        opt,
                        selectedProtocols,
                        setSelectedProtocols
                      )
                    }
                  />
                  <span className="text-sm sm:text-base">{opt}</span>
                </label>
              ))}
            </div>
            {selectedProtocols.includes("Other") && (
              <input
                type="text"
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                placeholder="Other protocol..."
                value={protocolOther}
                onChange={(e) => setProtocolOther(e.target.value)}
              />
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">What DeFi strategy do you want to see?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STRATEGY_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className={`flex items-center px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedStrategies.includes(opt)
                      ? theme === "dark"
                        ? "bg-purple-600 border-purple-400 text-white"
                        : "bg-purple-100 border-purple-600 text-purple-700"
                      : theme === "dark"
                      ? "bg-gray-800 border-gray-700 text-gray-200"
                      : "bg-gray-100 border-gray-300 text-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedStrategies.includes(opt)}
                    onChange={() =>
                      handleMultiSelect(
                        opt,
                        selectedStrategies,
                        setSelectedStrategies
                      )
                    }
                  />
                  <span className="text-sm sm:text-base">{opt}</span>
                </label>
              ))}
            </div>
            {selectedStrategies.includes("Other") && (
              <input
                type="text"
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                placeholder="Other strategy..."
                value={strategyOther}
                onChange={(e) => setStrategyOther(e.target.value)}
              />
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">How do you like our app?</h2>
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="text-4xl font-bold text-purple-600">{rating}</div>
              <div className="w-full flex items-center gap-4">
                <span className="text-sm font-medium">1</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 accent-purple-600"
                />
                <span className="text-sm font-medium">10</span>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Any other feedback?</h2>
            <textarea
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent resize-none min-h-[120px]"
              placeholder="Type any additional comments here... (optional)"
              value={additionalFeedback}
              onChange={(e) => setAdditionalFeedback(e.target.value)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 ${
          theme === "dark" ? "bg-black/60" : "bg-gray-900/40"
        } backdrop-blur-sm`}
        style={{
          animation: isExiting
            ? "fadeOut 0.3s ease-out"
            : "fadeIn 0.3s ease-out",
        }}
        onClick={handleGoBack}
      />

      {/* Main Panel Container */}
      <div 
        className={`fixed ${isMobile ? 'inset-x-0 bottom-0 rounded-t-2xl' : 'inset-0 m-auto rounded-2xl max-w-md max-h-[80vh]'} 
          bg-white dark:bg-[#0f0b22] shadow-2xl flex flex-col overflow-hidden z-50`}
        style={{
          animation: isExiting
            ? isMobile 
              ? "slideOutDown 0.3s ease-out forwards" 
              : "fadeOut 0.3s ease-out forwards"
            : isMobile 
              ? "slideInUp 0.3s ease-out forwards"
              : "fadeIn 0.3s ease-out forwards",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={currentStep === 1 ? handleGoBack : handlePrevStep}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {currentStep === 1 ? (
              <X className="h-5 w-5" />
            ) : (
              <ArrowLeft className="h-5 w-5" />
            )}
          </button>
          
          <h1 className="flex items-center gap-2 text-lg font-bold">
            <MessageCircle className="h-5 w-5" /> Feedback
          </h1>
          
          <div className="text-sm font-medium">
            Step {currentStep}/{totalSteps}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-200 dark:bg-gray-800">
          <div 
            className="h-full bg-purple-600 transition-all duration-300" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form id="feedback-form" onSubmit={handleSubmit}>
            {renderStepContent()}
          </form>
        </div>

        {/* Bottom Action Buttons */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          {currentStep < totalSteps ? (
            <button
              type="button"
              disabled={!canContinue()}
              onClick={handleNextStep}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                canContinue()
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              form="feedback-form"
              disabled={!canSubmit || processing || submitted}
              onClick={handleSubmit}
              className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                canSubmit && !processing && !submitted
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {processing ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Processing...
                </>
              ) : submitted ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Thank you!
                </>
              ) : (
                "Submit Feedback"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Social Modal */}
      {showSocialModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 px-4 z-[60]">
          <div
            className={`bg-white dark:bg-[#18103a] rounded-xl p-6 shadow-xl flex flex-col items-center gap-6 w-full max-w-xs sm:max-w-md transition-all duration-300 ${
              isSocialExiting
                ? "opacity-0 scale-95"
                : "opacity-100 scale-100"
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            
            <h2 className="text-xl font-bold text-center">
              Thanks for your feedback!
            </h2>
            
            <p className="text-center text-gray-600 dark:text-gray-300">
              Connect with us to stay updated
            </p>
            
            <div className="flex flex-col gap-3 w-full">
              <a
                href="https://t.me/+x8mewakKNJNmY2Nl"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                <Image
                  src="/Telegram_logo.svg"
                  alt="Telegram"
                  width={20}
                  height={20}
                  className="h-5 w-5 mr-2"
                />
                Join Telegram
              </a>
              <a
                href="https://x.com/SynthOS__"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
              >
                <Image
                  src="/X_logo_2023.svg"
                  alt="X"
                  width={20}
                  height={20}
                  className="h-5 w-5 mr-2"
                />
                Follow us on X
              </a>
            </div>
            
            <button
              onClick={handleSocialClose}
              className="mt-2 text-gray-500 text-sm hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
