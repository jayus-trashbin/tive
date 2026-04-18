
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useWorkoutStore } from "../store/useWorkoutStore";
import { Routine, RoutineBlock, SetType } from "../types";
import { logger } from '../utils/logger';

// Define the response structure we expect/return
export interface AIResponse {
    routine?: Routine;
    message?: string;
}

export const generateRoutine = async (userInput: string): Promise<AIResponse> => {
    try {
        const { userStats, exercises } = useWorkoutStore.getState();
        const apiKey = userStats.geminiApiKey;

        if (!apiKey) {
            return { message: "API Key missing. Please configure your AI settings in your profile." };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Prepare context: Available Exercises (simplified to save tokens/noise)
        const exerciseList = exercises.map(e => ({ id: e.id, name: e.name, muscle: e.targetMuscle }));
        const exerciseContext = JSON.stringify(exerciseList);

        const prompt = `
        You are an expert strength and conditioning coach.
        Your task is to parse the user's input and generate a structured Workout Routine in JSON format.
        
        USER INPUT:
        "${userInput}"

        AVAILABLE EXERCISES (Use these IDs if possible, matching by name. If no exact match, choose the closest equivalent or use 'custom-placeholder' as ID and I will handle it):
        ${exerciseContext}

        OUTPUT FORMAT:
        Return ONLY valid JSON (no markdown backticks) with this structure:
        {
            "name": "Routine Name",
            "blocks": [
                {
                    "exerciseId": "id_from_list_or_closest_match",
                    "sets": [
                        { "type": "warmup"|"working"|"failure", "targetReps": "8-12", "targetRpe": 8 }
                    ],
                    "notes": "Optional styling notes"
                }
            ]
        }
        
        RULES:
        1. If the user input is vague (e.g., "Leg Day"), generate a balanced hypertrophy routine using available exercises.
        2. Ensure reasonable RPE (7-9) and Rep Ranges (e.g., "3x10" means 3 working sets of 10).
        3. Parse any specific weights if mentioned (e.g. "Bench 100kg").
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean Markdown if present
        if (text.startsWith("```json")) {
            text = text.replace(/```json/g, "").replace(/```/g, "");
        } else if (text.startsWith("```")) {
            text = text.replace(/```/g, "");
        }

        const data = JSON.parse(text);

        // Map to internal Routine type
        const routineId = crypto.randomUUID();
        const blocks: RoutineBlock[] = (data.blocks || []).map((b: any) => ({
            id: crypto.randomUUID(),
            exerciseId: b.exerciseId,
            sets: (b.sets || []).map((s: any) => ({
                id: crypto.randomUUID(),
                type: s.type || 'working',
                targetReps: s.targetReps || '10',
                targetRpe: s.targetRpe || 8,
                targetWeight: s.targetWeight
            })),
            isSuperset: false,
            notes: b.notes
        }));

        const routine: Routine = {
            id: routineId,
            name: data.name || "AI Generated Routine",
            exerciseIds: blocks.map((b) => b.exerciseId), // Legacy support
            blocks: blocks,
            updatedAt: Date.now()
        };

        return { routine, message: "Routine generated successfully!" };

    } catch (error: any) {
        logger.error('AIService', 'Routine generation failed', error);
        return { message: `AI Error: ${error.message || "Unknown error"}` };
    }
};
