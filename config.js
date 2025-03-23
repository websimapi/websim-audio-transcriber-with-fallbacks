// Configuration settings for the transcription system

export const config = {
    // Transcription engines configuration
    engines: {
        // Whisper.js configuration
        whisper: {
            model: 'Xenova/whisper-tiny.en', // Default model
            options: {
                chunk_length_s: 30,
                stride_length_s: 5
            },
            audioProcessing: {
                enabled: true,
                vocalFreqMin: 80,    // Minimum frequency for human voice (Hz)
                vocalFreqMax: 1000,  // Maximum frequency for human voice (Hz)
                compressionThreshold: -50,
                compressionRatio: 12
            }
        },
        
        // Vosk.js configuration
        vosk: {
            model: 'vosk-model-small-en-us-0.15', // Default model path
            options: {
                sampleRate: 16000
            }
        },
        
        // Coqui STT configuration
        coqui: {
            model: 'coqui-model-en-us-0.15', // Default model path
            options: {
                beamWidth: 500,
                lmAlpha: 0.75,
                lmBeta: 1.85
            }
        },
        
        // External API configuration
        api: {
            endpoint: 'https://api.example.com/transcribe', // Replace with your actual API endpoint
            apiKey: '', // Replace with your API key if needed
            timeout: 30000 // 30 seconds timeout
        }
    },
    
    // Fallback order - engines will be tried in this order if the previous one fails
    fallbackOrder: ['whisper', 'vosk', 'coqui', 'api'],
    
    // Maximum audio duration in seconds (to prevent processing very large files)
    maxAudioDuration: 300, // 5 minutes
    
    // Maximum file size for uploads in bytes (50MB default)
    maxFileSize: 50 * 1024 * 1024,
    
    // Audio recording settings
    recording: {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000
    }
};