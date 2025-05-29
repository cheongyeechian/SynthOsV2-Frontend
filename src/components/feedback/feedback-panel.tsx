"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, MessageCircle, CheckCircle } from "lucide-react";
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

  const [isExiting, setIsExiting] = useState(false);
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>([]);
  const [protocolOther, setProtocolOther] = useState("");
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [strategyOther, setStrategyOther] = useState("");
  const [rating, setRating] = useState(5);
  const [additionalFeedback, setAdditionalFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [isSocialExiting, setIsSocialExiting] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleGoBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
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
        setSubmitted(false);
        setSelectedProtocols([]);
        setProtocolOther("");
        setSelectedStrategies([]);
        setStrategyOther("");
        setRating(5);
        setAdditionalFeedback("");
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

  const canSubmit =
    selectedProtocols.length > 0 &&
    selectedStrategies.length > 0 &&
    (!selectedProtocols.includes("Other") || protocolOther.trim().length > 0) &&
    (!selectedStrategies.includes("Other") ||
      strategyOther.trim().length > 0) &&
    !submitted &&
    !processing;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 ${
          theme === "dark" ? "bg-black/30" : "bg-gray-900/20"
        } backdrop-blur-sm`}
        style={{
          animation: isExiting
            ? "fadeOut 0.3s ease-out"
            : "fadeIn 0.3s ease-out",
        }}
        onClick={handleGoBack}
      />

      {/* Bottom-Sheet Panel */}
      <div
        className="fixed inset-x-0 bottom-0 h-[80vh] w-full max-w-2xl mx-auto flex flex-col bg-white dark:bg-[#0f0b22] rounded-t-2xl shadow-2xl z-50"
        style={{
          animation: isExiting
            ? "slideOutDown 0.3s ease-out forwards"
            : "slideInUp 0.3s ease-out forwards",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.14)",
          marginBottom: 0
        }}
      >
        {/* HEADER */}
        <div
          className="flex items-center justify-between px-4 sm:px-8 pt-6 sm:pt-10 pb-6 sm:pb-8"
          style={{ borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem" }}
        >
          <button
            onClick={handleGoBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-7 w-7" />
          </button>
          <h1 className="flex items-center gap-2 text-lg sm:text-2xl font-bold">
            <MessageCircle className="h-7 w-7" /> Feedback
          </h1>
          <div className="w-10 h-10" />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-24">
          <form
            id="feedback-form"
            onSubmit={handleSubmit}
            className="flex flex-col space-y-8 text-base sm:text-lg"
          >
            {/* Protocol Selection */}
            <div>
              <label className="block font-semibold mb-2">
                1. What DeFi protocol do you want to see?
              </label>
              <div className="flex flex-col gap-2">
                {PROTOCOL_OPTIONS.map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center px-3 py-2 rounded-full border cursor-pointer transition-colors ${
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
                      className="mr-2 accent-purple-600"
                      checked={selectedProtocols.includes(opt)}
                      onChange={() =>
                        handleMultiSelect(
                          opt,
                          selectedProtocols,
                          setSelectedProtocols
                        )
                      }
                    />
                    {opt}
                  </label>
                ))}
                {selectedProtocols.includes("Other") && (
                  <input
                    type="text"
                    className="mt-2 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                    placeholder="Other protocol..."
                    value={protocolOther}
                    onChange={(e) => setProtocolOther(e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* Strategy Selection */}
            <div>
              <label className="block font-semibold mb-2">
                2. What DeFi strategy do you want to see?
              </label>
              <div className="flex flex-col gap-2">
                {STRATEGY_OPTIONS.map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center px-3 py-2 rounded-full border cursor-pointer transition-colors ${
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
                      className="mr-2 accent-purple-600"
                      checked={selectedStrategies.includes(opt)}
                      onChange={() =>
                        handleMultiSelect(
                          opt,
                          selectedStrategies,
                          setSelectedStrategies
                        )
                      }
                    />
                    {opt}
                  </label>
                ))}
                {selectedStrategies.includes("Other") && (
                  <input
                    type="text"
                    className="mt-2 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                    placeholder="Other strategy..."
                    value={strategyOther}
                    onChange={(e) => setStrategyOther(e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block font-semibold mb-2">
                3. How do you like our app?
              </label>
              <div
                className="relative w-full flex flex-col items-center"
                style={{ minHeight: 40 }}
              >
                <div
                  className="absolute font-bold text-purple-600 text-lg select-none"
                  style={{
                    left: `calc(${((rating - 1) / 9) * 100}% - 16px)`,
                    top: 0,
                    width: 32,
                    textAlign: "center",
                    pointerEvents: "none",
                  }}
                >
                  {rating}
                </div>
                <div className="flex items-center w-full gap-4 mt-6">
                  <span className="text-sm">1</span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="flex-1 accent-purple-600"
                  />
                  <span className="text-sm">10</span>
                </div>
              </div>
            </div>

            {/* Additional Feedback */}
            <div>
              <label className="block font-semibold mb-2">
                4. Any other feedback? (optional)
              </label>
              <textarea
                className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 bg-transparent resize-none"
                rows={4}
                placeholder="Type any additional comments here..."
                value={additionalFeedback}
                onChange={(e) => setAdditionalFeedback(e.target.value)}
              />
            </div>
          </form>
        </div>

        {/* Fixed Submit Button */}
        <div className="absolute bottom-0 left-0 w-full px-4 sm:px-8 py-4 bg-gradient-to-t from-white via-white to-transparent dark:from-[#0f0b22] dark:via-[#0f0b22] dark:to-transparent">
          <button
            type="submit"
            form="feedback-form"
            disabled={!canSubmit || processing || submitted}
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
              canSubmit && !processing && !submitted
                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
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
        </div>
      </div>

      {/* Social Modal */}
      {showSocialModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 px-2 z-50">
          <div
            className={`bg-white dark:bg-[#18103a] rounded-xl p-6 sm:p-8 shadow-xl flex flex-col items-center gap-6 w-full max-w-xs sm:max-w-md transition-all duration-300 ${
              isSocialExiting
                ? "opacity-0 translate-y-8"
                : "opacity-100 translate-y-0"
            }`}
            style={{
              animation: isSocialExiting
                ? "slideOutDown 0.3s ease-out forwards"
                : "slideInUp 0.3s ease-out forwards",
            }}
          >
            <h2 className="text-lg sm:text-xl font-bold text-center">
              Thanks for your feedback!
            </h2>
            <p className="mb-4 text-center text-base">Connect with us:</p>
            <div className="flex flex-col gap-3 w-full">
              <a
                href="https://t.me/+x8mewakKNJNmY2Nl"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors"
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
                className="flex-1 flex items-center justify-center px-4 py-2 bg-black text-white rounded-full font-semibold hover:bg-gray-900 transition-colors"
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
              className="mt-4 text-gray-500 text-sm hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
