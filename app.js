import { Transcriber } from './transcriber.js';
import { config } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const transcriber = new Transcriber();
    let recorder = null;
    let recordedBlob = null;
    let transcriptionStartTime = 0;
    
    // DOM Elements
    const audioFileInput = document.getElementById('audioFileInput');
    const recordButton = document.getElementById('recordButton');
    const stopButton = document.getElementById('stopButton');
    const audioPlayer = document.getElementById('audioPlayer');
    const audioPlayerContainer = document.getElementById('audioPlayerContainer');
    const statusMessage = document.getElementById('statusMessage');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const resultContainer = document.getElementById('resultContainer');
    const transcriptionResult = document.getElementById('transcriptionResult');
    const usedEngine = document.getElementById('usedEngine');
    const processingTime = document.getElementById('processingTime');
    const modelOptions = document.querySelectorAll('input[name="model"]');
    const retranscribeButton = document.getElementById('retranscribeButton');

    // Event Listeners
    audioFileInput.addEventListener('change', handleFileUpload);
    recordButton.addEventListener('click', startRecording);
    stopButton.addEventListener('click', stopRecording);
    retranscribeButton.addEventListener('click', startTranscription);
    
    // File upload handler
    async function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            // Validate file size
            if (file.size > config.maxFileSize) {
                showError(`File too large. Maximum size is ${config.maxFileSize / (1024 * 1024)}MB.`);
                return;
            }
            
            // Create audio blob
            const audioBlob = new Blob([await file.arrayBuffer()], { type: file.type });
            processAudioBlob(audioBlob);
            
        } catch (error) {
            showError(`Error processing file: ${error.message}`);
        }
    }
    
    // Start audio recording
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Create RecordRTC instance
            const RecordRTC = (await import('recordrtc')).default;
            recorder = new RecordRTC(stream, {
                type: 'audio',
                mimeType: config.recording.mimeType,
                audioBitsPerSecond: config.recording.audioBitsPerSecond,
                recorderType: RecordRTC.StereoAudioRecorder,
                numberOfAudioChannels: 1
            });
            
            // Start recording
            recorder.startRecording();
            
            // Update UI
            recordButton.classList.add('hidden');
            stopButton.classList.remove('hidden');
            showStatus('Recording audio...');
            
        } catch (error) {
            showError(`Error starting recording: ${error.message}`);
        }
    }
    
    // Stop audio recording
    function stopRecording() {
        if (!recorder) return;
        
        recorder.stopRecording(() => {
            const blob = recorder.getBlob();
            processAudioBlob(blob);
            
            // Stop and release media stream
            recorder.stream.getTracks().forEach(track => track.stop());
            recorder = null;
            
            // Update UI
            stopButton.classList.add('hidden');
            recordButton.classList.remove('hidden');
        });
    }
    
    // Process the audio blob (either from file or recording)
    function processAudioBlob(blob) {
        recordedBlob = blob;
        transcriber.setAudio(blob);
        
        // Display the audio player
        const audioURL = URL.createObjectURL(blob);
        audioPlayer.src = audioURL;
        audioPlayerContainer.classList.remove('hidden');
        
        // Start transcription
        showStatus('Preparing to transcribe...');
        startTranscription();
    }
    
    // Start the transcription process
    async function startTranscription() {
        // Get selected engine
        const selectedEngine = getSelectedEngine();
        
        // Reset UI
        resultContainer.classList.add('hidden');
        progressContainer.classList.remove('hidden');
        progressBar.style.width = '0%';
        
        try {
            // Start timing the transcription
            transcriptionStartTime = performance.now();
            
            // Pre-load the selected engine
            showStatus(`Loading ${selectedEngine} transcription engine...`);
            updateProgress(10);
            
            try {
                await transcriber.initEngine(selectedEngine);
            } catch (error) {
                showStatus(`Failed to load ${selectedEngine}, trying fallbacks...`);
            }
            
            updateProgress(30);
            showStatus('Transcribing audio...');
            
            // Start transcription with fallbacks if needed
            const result = await transcriber.transcribeWithFallbacks(selectedEngine);
            
            // Calculate processing time
            const elapsedTime = ((performance.now() - transcriptionStartTime) / 1000).toFixed(2);
            
            // Display result
            updateProgress(100);
            showStatus(`Transcription complete using ${result.engine}.`);
            transcriptionResult.textContent = result.text || 'No text detected in the audio.';
            usedEngine.textContent = result.engine;
            processingTime.textContent = `${elapsedTime}s`;
            resultContainer.classList.remove('hidden');
            
        } catch (error) {
            showError(`Transcription failed: ${error.message}`);
            progressContainer.classList.add('hidden');
        }
    }
    
    // Helper functions
    function getSelectedEngine() {
        let selected = 'whisper'; // Default
        modelOptions.forEach(option => {
            if (option.checked) {
                selected = option.value;
            }
        });
        return selected;
    }
    
    function showStatus(message, isError = false) {
        statusMessage.textContent = message;
        statusMessage.classList.toggle('error', isError);
        statusMessage.classList.toggle('loading', !isError);
    }
    
    function showError(message) {
        showStatus(message, true);
    }
    
    function updateProgress(percent) {
        progressBar.style.width = `${percent}%`;
    }
    
    // Initialize the first engine in the background
    setTimeout(() => {
        transcriber.initEngine('whisper')
            .then(() => console.log('Whisper engine preloaded'))
            .catch(error => console.log('Preloading Whisper failed:', error));
    }, 1000);
});