import { Configuration, OpenAIApi } from 'openai';
import config from 'config';
import { createReadStream } from 'fs';
import { removeFile } from './utils.js';

class OpenAI {
    modelEngine = 'gpt-3.5-turbo';
    roles = {
        ASSISTANT: 'assistant',
        USER: 'user',
        SYSTEM: 'system'
    };
    constructor(apiKey) {
        const configuration = new Configuration({
            apiKey: apiKey
        });
        this.openai = new OpenAIApi(configuration);
    }
    async chat(messages) {
        const response = await this.openai.createChatCompletion({
            model: this.modelEngine,
            messages,
            temperature: 0.7
        });
        const { choices } = response?.data;
        return choices[0].message;
    }
    async transcription(filepath) {
        try {
            const response = await this.openai.createTranscription(
                createReadStream(filepath),
                'whisper-1'
            );
            removeFile(filepath);
            return response.data.text;
        } catch (e) {
            console.log('Error while transcription mp3', e.message);
        }
    }
}
export const openai = new OpenAI(String(config.get('API_TOKEN_OPENAI')));
