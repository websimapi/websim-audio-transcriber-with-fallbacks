import { config } from './config.js';

// Main transcriber class that manages all transcription engines and fallbacks
export class Transcriber {
    constructor() {
        this.engines = {};
        this.audioBlob = null;
        this.isModelLoaded = {
            whisper: false,
            vosk: false,
            coqui: false,
            api: true // API doesn't need loading
        };
        this.currentEngine = null;
        this.fallbackIndex = 0;
    }

    // Initialize a specific engine
    async initEngine(engineName) {
        if (this.engines[engineName]) return;

        try {
            switch (engineName) {
                case 'whisper':
                    await this.initWhisperEngine();
                    break;
                case 'vosk':
                    await this.initVoskEngine();
                    break;
                case 'coqui':
                    await this.initCoquiEngine();
                    break;
                case 'api':
                    // API doesn't need initialization, but we need to bind the method
                    this.engines.api = (blob) => this.transcribeWithAPI(blob);
                    break;
            }
            this.isModelLoaded[engineName] = true;
        } catch (error) {
            console.error(`Failed to initialize ${engineName} engine:`, error);
            throw new Error(`Failed to initialize ${engineName} engine: ${error.message}`);
        }
    }

    // Initialize Whisper.js engine
    async initWhisperEngine() {
        try {
            const { pipeline } = await import('@xenova/transformers');
            const transcriber = await pipeline(
                'automatic-speech-recognition', 
                config.engines.whisper.model
            );
            this.engines.whisper = async (audioBlob) => {
                return this.transcribeWithWhisper(transcriber, audioBlob);
            };
        } catch (error) {
            console.error('Error initializing Whisper engine:', error);
            throw error;
        }
    }

    // Initialize Vosk engine
    async initVoskEngine() {
        try {
            // For demo purposes, we'll create a mock implementation that returns a placeholder result
            this.engines.vosk = async (audioBlob) => {
                // Simulate some processing time
                await new Promise(resolve => setTimeout(resolve, 1000));
                return "[Vosk Placeholder] This is a simulated transcript from the Vosk engine.";
            };
        } catch (error) {
            console.error('Error initializing Vosk engine:', error);
            throw error;
        }
    }

    // Initialize Coqui STT engine
    async initCoquiEngine() {
        try {
            // For demo purposes, we'll create a mock implementation that returns a placeholder result
            this.engines.coqui = async (audioBlob) => {
                // Simulate some processing time
                await new Promise(resolve => setTimeout(resolve, 1000));
                return "[Coqui Placeholder] This is a simulated transcript from the Coqui STT engine.";
            };
        } catch (error) {
            console.error('Error initializing Coqui engine:', error);
            throw error;
        }
    }

    // Transcribe with Whisper.js
    async transcribeWithWhisper(transcriber, audioBlob) {
        try {
            // Convert audio blob to proper format
            const audioArrayBuffer = await audioBlob.arrayBuffer();
            
            // Use FileReader to properly process the audio file
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioData = await audioContext.decodeAudioData(audioArrayBuffer);
            
            // Convert to the format expected by Whisper
            const audioFloat32Array = audioData.getChannelData(0);
            
            // Process the audio with Whisper
            const result = await transcriber(audioFloat32Array, config.engines.whisper.options);
            
            return result.text;
        } catch (error) {
            console.error('Whisper transcription error:', error);
            throw error;
        }
    }

    // Transcribe with Vosk
    async transcribeWithVosk(audioBlob) {
        // For demo purposes, we'll create a mock implementation that returns a placeholder result
        // In a real app, you would:
        // 1. Convert the blob to the format Vosk expects
        // 2. Process with Vosk
        // 3. Return the transcript
        
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        return "[Vosk Placeholder] This is a simulated transcript from the Vosk engine.";
    }

    // Transcribe with Coqui STT
    async transcribeWithCoqui(audioBlob) {
        // For demo purposes, we'll create a mock implementation that returns a placeholder result
        // In a real app, you would:
        // 1. Convert the blob to the format Coqui expects
        // 2. Process with Coqui
        // 3. Return the transcript
        
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        return "[Coqui Placeholder] This is a simulated transcript from the Coqui STT engine.";
    }

    // Transcribe with external API
    async transcribeWithAPI(audioBlob) {
        try {
            // For demo purposes, return a simulated result
            await new Promise(resolve => setTimeout(resolve, 1500));
            return "[API Placeholder] This is a simulated transcript from the external API service.";
            
            /* In a real implementation, you would do:
            const formData = new FormData();
            formData.append('audio', audioBlob);

            const response = await fetch(config.engines.api.endpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${config.engines.api.apiKey}`
                },
                timeout: config.engines.api.timeout
            });

            if (!response.ok) {
                throw new Error(`API returned status code ${response.status}`);
            }

            const data = await response.json();
            return data.transcript;
            */
        } catch (error) {
            console.error('API transcription error:', error);
            throw error;
        }
    }

    // Set the audio to transcribe
    setAudio(audioBlob) {
        this.audioBlob = audioBlob;
    }

    // Try to transcribe with a specific engine
    async transcribeWithEngine(engineName) {
        if (!this.audioBlob) {
            throw new Error('No audio to transcribe');
        }

        if (!this.isModelLoaded[engineName]) {
            await this.initEngine(engineName);
        }

        this.currentEngine = engineName;
        return await this.engines[engineName](this.audioBlob);
    }

    // Transcribe with fallbacks if needed
    async transcribeWithFallbacks(preferredEngine) {
        // Reset fallback index
        this.fallbackIndex = 0;
        
        // Create fallback order with preferred engine first
        const fallbackOrder = [
            preferredEngine,
            ...config.fallbackOrder.filter(engine => engine !== preferredEngine)
        ];
        
        for (let i = 0; i < fallbackOrder.length; i++) {
            const engineName = fallbackOrder[i];
            this.fallbackIndex = i;
            
            try {
                console.log(`Attempting to transcribe with ${engineName}`);
                const result = await this.transcribeWithEngine(engineName);
                return {
                    text: result,
                    engine: engineName
                };
            } catch (error) {
                console.log(`Engine ${engineName} failed:`, error);
                // Continue to next fallback
                if (i === fallbackOrder.length - 1) {
                    throw new Error('All transcription engines failed');
                }
            }
        }
        
        throw new Error('All transcription engines failed');
    }
}