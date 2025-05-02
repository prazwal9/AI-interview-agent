'use server'

import { feedbackSchema } from "@/constants";
import { db } from "@/firebase/admin";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";

export async function getInterviewsByUserId(userId: string): Promise<Interview[] | null>{
    const interviews = await db
        .collection('interviews')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Interview[];
}

export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null>{
    const { userId, limit = 20 } = params;
    
    try{
        const interviews = await db
        .collection('interviews')
        .orderBy('createdAt', 'desc')
        .where('finalized', '==', true)
        .where('userId', '!=', userId)
        .limit(limit)
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Interview[];

    }catch (error){
        console.error('Error fetching interviews:', error); // Catch and log any errors
        return null;
    }
    
}

export async function getInterviewById(id: string): Promise<Interview | null>{
    const interview = await db
        .collection('interviews')
        .doc(id)
        .get();

    return interview.data() as Interview | null;
}

export async function createFeedback(params: CreateFeedbackParams){
    const { interviewId, userId, transcript } = params;

    try{
        const formattedTranscript = transcript
            .map((sentence: { role: string; content: string; }) => (
                `- ${sentence.role}: ${sentence.content}\n`
            )).join('');

        const { object: { totalScore, categoryScores, strengths, areasForImprovement, finalAssessment } } = await generateObject({
            model: google('gemini-2.0-flash-001', {
                structuredOutputs: false,
            }),
            schema: feedbackSchema,
            prompt: `You are an AI interviewer analysing a mock interview. Your task is to evaluate the candidate based on structured categories.
            Be thorough and detailed in your analysis. Do not be lenient with the candidate. if there are mistakes, point them out.
            Transcript:
            ${formattedTranscript}
            
            Please score the candidate from 0 to 10 in the following areas. Do not add categories other than the ones provided.
            - **Communication Skills**: Clarity, articulation, structured responses.
            - **Technical Knowledge**: Understanding of key concepts for the role.
            - **Problem-Solving**: Ability to analyze problems and propose solutions.
            - **Cultural and Role Fit**: Alignment with company values and job role.
            - **Confidence and Clarity**: Confidence in responses, engagement, and clarity.`,

            system: "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
        });

        const feedback = await db.collection('feedback').add({
            interviewId,
            userId,
            totalScore,
            categoryScores,
            strengths,
            areasForImprovement,
            finalAssessment,
            createdAt: new Date().toISOString()
        })

        return {
            success: true,
            feedbackId: feedback.id
        }

    }catch (e){
        console.error('Error saving feedback', e)

        return { success: false }
    }
}

export async function getFeedbackByInterviewId(params: GetFeedbackByInterviewIdParams): Promise<Feedback | null>{
    const { interviewId, userId } = params;
    
    const feedback = await db
        .collection('feedback')
        .where('interviewId', '==', interviewId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

    if(feedback.empty) return null;

    const feedbackDoc = feedback.docs[0];
    return{
        id: feedbackDoc.id, ...feedbackDoc.data()
    } as Feedback;
}