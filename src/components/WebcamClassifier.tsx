/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { FocusState } from '../types';
import { Camera, CameraOff, RefreshCw, AlertTriangle, MonitorPlay, Zap, Sliders } from 'lucide-react';

interface WebcamClassifierProps {
  modelUrl: string;
  onStateDetected: (state: FocusState) => void;
  currentState: FocusState;
}

declare global {
  interface Window {
    tf?: any;
    tmImage?: any;
    tmPose?: any;
  }
}

export default function WebcamClassifier({
  modelUrl,
  onStateDetected,
  currentState,
}: WebcamClassifierProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<any>(null);
  const modelTypeRef = useRef<'image' | 'pose'>('image');
  const animationFrameRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSimulatorMode, setIsSimulatorMode] = useState(false); // ML-first: real Teachable Machine model is the primary mode; simulator is only a fallback

  const [predictions, setPredictions] = useState<Array<{ className: string; probability: number }>>([]);

  // Load Teachable Machine dependencies from CDN.
  // CRITICAL: pose@0.8 only works with tfjs@1.3.1 (the official pairing),
  // while image@0.8.3 pairs with modern tfjs. Load per model type.
  const loadDependencies = (type: 'image' | 'pose'): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (type === 'pose' && window.tf && window.tmPose) {
        resolve();
        return;
      }
      if (type === 'image' && window.tf && window.tmImage) {
        resolve();
        return;
      }

      const loadScript = (src: string): Promise<void> =>
        new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = src;
          s.async = true;
          s.onload = () => res();
          s.onerror = () => rej(new Error(`Failed to load ${src}`));
          document.body.appendChild(s);
        });

      const chain =
        type === 'pose'
          ? loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js')
              .then(() => loadScript('https://cdn.jsdelivr.net/npm/@teachablemachine/pose@0.8/dist/teachablemachine-pose.min.js'))
          : loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0/dist/tf.min.js')
              .then(() => loadScript('https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.3/dist/teachablemachine-image.min.js'));

      chain.then(() => resolve()).catch((e) => reject(e));
    });
  };

  // Setup / Load Model
  const initModel = async () => {
    if (!modelUrl) {
      setError('Please configure a valid Teachable Machine model URL in Settings.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedUrl = modelUrl.trim().endsWith('/') ? modelUrl.trim() : modelUrl.trim() + '/';
      const modelJson = formattedUrl + 'model.json';
      const metadataJson = formattedUrl + 'metadata.json';

      // 1) Detect model type (Image vs Pose project) from the exported metadata
      let detectedType: 'image' | 'pose' = 'image';
      try {
        const metaRes = await fetch(metadataJson);
        const meta = await metaRes.json();
        const pkg = (meta.packageName || '').toLowerCase();
        if (pkg.includes('pose')) detectedType = 'pose';
      } catch (e) {
        console.warn('Could not read metadata for type detection, assuming image model.', e);
      }
      modelTypeRef.current = detectedType;

      // 2) Load the matching library versions
      await loadDependencies(detectedType);

      // 3) Load the model with the right library
      const loadedModel =
        detectedType === 'pose'
          ? await window.tmPose.load(modelJson, metadataJson)
          : await window.tmImage.load(modelJson, metadataJson);
      modelRef.current = loadedModel;
      setModelLoaded(true);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(`Failed to load model. Please ensure the link is a valid exported Teachable Machine model URL (usually looks like https://teachablemachine.withgoogle.com/models/xxxx/). Details: ${err.message}`);
      setLoading(false);
    }
  };

  // Start Webcam
  const startCamera = async () => {
    setError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setIsSimulatorMode(false); // Disable simulator when webcam succeeds
    } catch (err: any) {
      console.error(err);
      setError('Camera access denied or unavailable. This is common due to iframe restrictions or missing devices. We have automatically activated "Study State Simulator" mode for you!');
      setIsSimulatorMode(true);
    }
  };

  // Stop Webcam
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Attach the stream once the <video> element actually exists in the DOM.
  // (When startCamera runs, the element may not be mounted yet, so srcObject
  //  assignment inside startCamera can silently miss — this effect catches it.)
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive, isCollapsed, isSimulatorMode]);

  // Real-time classification loop
  useEffect(() => {
    let active = true;

    const predictLoop = async () => {
      if (!active) return;

      if (modelRef.current && cameraActive && videoRef.current && videoRef.current.readyState === 4) {
        try {
          // Predict — pose models estimate skeleton keypoints first, then classify
          let prediction;
          if (modelTypeRef.current === 'pose') {
            const { posenetOutput } = await modelRef.current.estimatePose(videoRef.current);
            prediction = await modelRef.current.predict(posenetOutput);
          } else {
            prediction = await modelRef.current.predict(videoRef.current);
          }
          setPredictions(prediction);

          // Find the class with the highest probability
          let maxProb = 0;
          let bestClass: FocusState = 'focused';

          prediction.forEach((p: any) => {
            if (p.probability > maxProb) {
              maxProb = p.probability;
              // Map prediction labels safely to FocusState keys
              const label = p.className.toLowerCase();
              if (label.includes('focus')) bestClass = 'focused';
              else if (label.includes('phone') || label.includes('mobile')) bestClass = 'phone';
              else if (label.includes('away') || label.includes('none') || label.includes('empty')) bestClass = 'away';
              else if (label.includes('tired') || label.includes('sleep') || label.includes('rest')) bestClass = 'tired';
              else if (label.includes('stretch') || label.includes('active')) bestClass = 'stretch';
            }
          });

          if (maxProb > 0.6) {
            onStateDetected(bestClass);
          }
        } catch (err: any) {
          console.error('Prediction error:', err);
          // Surface the first prediction failure so it's never silent again
          setError((prev) => prev || `Live prediction failed: ${err?.message || err}. Try re-loading the model in Settings.`);
        }
      }

      // Run predict loop approx every 500ms
      setTimeout(() => {
        if (active) {
          animationFrameRef.current = requestAnimationFrame(predictLoop);
        }
      }, 500);
    };

    if (cameraActive && modelLoaded) {
      predictLoop();
    }

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraActive, modelLoaded, onStateDetected]);

  // Handle initialization on mount if URL exists
  useEffect(() => {
    if (modelUrl) {
      initModel();
    }
    return () => {
      stopCamera();
    };
  }, [modelUrl]);

  return (
    <div className="bg-white rounded-3xl border border-[#FFDEC9] shadow-sm overflow-hidden transition-all duration-300">
      
      {/* Header bar */}
      <div className="bg-[#FFF2E6] px-5 py-3.5 flex items-center justify-between border-b border-[#FFDEC9]">
        <div className="flex items-center gap-2">
          <Camera className="w-4.5 h-4.5 text-[#FF9E7D]" />
          <h3 className="font-bold text-[#725442] text-sm font-sans">Kapi Focus Lens</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulatorMode(!isSimulatorMode)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-200 flex items-center gap-1 cursor-pointer ${
              isSimulatorMode
                ? 'bg-[#FF9E7D] text-white'
                : 'bg-white border border-[#FFDEC9] text-[#725442] hover:bg-amber-50/50'
            }`}
            title="Manual testing mode"
          >
            <Sliders className="w-3 h-3" />
            {isSimulatorMode ? 'Simulator Active' : 'Use Simulator'}
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[10px] text-[#A0836D] hover:text-[#725442] font-bold transition-colors px-1 cursor-pointer"
          >
            {isCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="p-4 flex flex-col gap-3">
          
          {/* Webcam display block */}
          {!isSimulatorMode && (
            <div className="relative aspect-video rounded-2xl bg-stone-100 overflow-hidden border border-[#FFF0E0] flex items-center justify-center">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover transform -scale-x-100"
                  muted
                  playsInline
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#A0836D] gap-2 p-6 text-center">
                  <CameraOff className="w-10 h-10 stroke-1 text-[#FFB085]" />
                  <p className="text-xs">Camera is inactive. Kapi Companion cannot see you.</p>
                </div>
              )}

              {/* Status overlay */}
              <div className="absolute top-2 left-2 bg-[#2E2520]/80 backdrop-blur-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-[#8EAC50] animate-pulse' : 'bg-stone-400'}`} />
                <span className="text-[10px] font-semibold text-white font-mono uppercase">
                  {cameraActive ? 'Watching' : 'Inactive'}
                </span>
              </div>

              {/* Model loading banner overlay */}
              {loading && (
                <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-4 text-center">
                  <RefreshCw className="w-6 h-6 text-[#FF9E7D] animate-spin mb-2" />
                  <p className="text-xs font-bold text-[#725442]">Loading Kapi's AI brain...</p>
                  <p className="text-[10px] text-[#A0836D] mt-1">Downloading Google Teachable Machine dependencies...</p>
                </div>
              )}
            </div>
          )}

          {/* Simulator Panel / State Overrides */}
          {isSimulatorMode && (
            <div className="bg-[#FFFDFB] rounded-2xl border border-[#FFEADA] p-3">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#FFF0E4]">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4.5 h-4.5 text-[#FFB085]" />
                  <span className="text-xs font-bold text-[#725442]">Study State Simulator</span>
                </div>
                <span className="text-[9px] bg-amber-50 text-[#C68A4C] px-2 py-0.5 rounded-md font-bold border border-[#FFE4CF]">
                  Demo Mode
                </span>
              </div>
              <p className="text-[11px] text-[#A0836D] mb-3 leading-relaxed">
                Click any state below to simulate different student actions. Kapi will respond instantly with custom supportive text, animations, and voice alerts:
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { key: 'focused', label: 'Focused 📖', color: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' },
                  { key: 'phone', label: 'On Phone 📱', color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' },
                  { key: 'away', label: 'Away 🚪', color: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100' },
                  { key: 'tired', label: 'Tired 💤', color: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100' },
                  { key: 'stretch', label: 'Stretching 🙆‍♀️', color: 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100' },
                ].map((btn) => (
                  <button
                    key={btn.key}
                    onClick={() => onStateDetected(btn.key as FocusState)}
                    className={`px-1 py-2 rounded-xl text-[10px] font-bold text-center border transition-all duration-150 cursor-pointer ${
                      currentState === btn.key
                        ? 'bg-[#FF9E7D]! text-white! border-[#FF9E7D]! shadow-xs transform scale-[1.03]'
                        : btn.color
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Onboarding notice when no model is configured yet */}
          {!isSimulatorMode && !modelUrl && (
            <div className="bg-[#FFF9F2] p-3.5 rounded-2xl border border-[#FFE4CF] text-[11px] text-[#725442] leading-relaxed">
              <p className="font-bold mb-1">🍊 One step before Kapi can see you:</p>
              <p className="text-[#A0836D]">
                Train your 5-class model (focused / phone / away / tired / stretch) on{' '}
                <a
                  href="https://teachablemachine.withgoogle.com/train/image"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#FF9E7D] underline font-bold"
                >
                  Teachable Machine
                </a>
                , click <b>Export Model → Tensorflow.js → Upload</b>, then paste the shareable
                URL into <b>Guard Settings</b>. Kapi's eyes will switch on automatically!
              </p>
            </div>
          )}

          {/* Real camera control buttons */}
          {!isSimulatorMode && (
            <div className="flex gap-2">
              {cameraActive ? (
                <button
                  onClick={stopCamera}
                  className="flex-1 py-2 rounded-xl border border-[#FFDEC9] text-[#725442] hover:bg-amber-50/20 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  Turn Off Lens
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="flex-1 py-2 bg-[#FF9E7D] hover:bg-[#FF8D66] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Turn On Focus Lens
                </button>
              )}

              {modelUrl && !modelLoaded && (
                <button
                  onClick={initModel}
                  disabled={loading}
                  className="p-2 border border-[#FFDEC9] text-[#725442] rounded-xl hover:bg-amber-50/20 disabled:opacity-50 cursor-pointer"
                  title="Load Model"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          )}

          {/* Model information bar */}
          {!isSimulatorMode && modelLoaded && predictions.length > 0 && (
            <div className="mt-1 bg-amber-50/50 p-2 rounded-xl border border-[#FFDEC9] text-[10px] text-[#A0836D]">
              <div className="flex justify-between font-bold text-[#725442] mb-1">
                <span>Model Confidence Level:</span>
                <span className="font-mono">Active</span>
              </div>
              <div className="space-y-1">
                {predictions.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="w-16 truncate font-mono">{p.className}:</span>
                    <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="bg-[#FF9E7D] h-full"
                        style={{ width: `${p.probability * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono">{(p.probability * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error messages if any */}
          {error && (
            <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200 flex gap-2 text-xs text-amber-900 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-[#FF9E7D] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
