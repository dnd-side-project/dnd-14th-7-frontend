// Auto-generated types will be placed here after running:
// supabase gen types typescript --project-id <project-ref> > lib/supabase/types.ts

export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Position = "DEV" | "DESIGN" | "PROMOTER" | "OTHER" | "NONE";
export type CreatedType = "INIT" | "SELF" | "ANSWER";
export type QuestionStatus = "WAITING" | "COMPLETED" | "ARCHIVED";

export interface Database {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string;
					nickname: string;
					email: string;
					credit: number;
					position: Position;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					nickname: string;
					email: string;
					credit?: number;
					position?: Position;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					nickname?: string;
					email?: string;
					credit?: number;
					position?: Position;
					updated_at?: string;
				};
				Relationships: [];
			};
			insights: {
				Row: {
					id: number;
					user_id: string;
					title: string;
					initial_thought: string;
					memo: string;
					views: number;
					trashed_at: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					user_id: string;
					title?: string;
					initial_thought: string;
					memo?: string;
					views?: number;
					trashed_at?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					title?: string;
					initial_thought?: string;
					memo?: string;
					views?: number;
					trashed_at?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "insights_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			insight_pieces: {
				Row: {
					id: number;
					insight_id: number;
					content: string;
					created_type: CreatedType;
					created_at: string;
				};
				Insert: {
					insight_id: number;
					content: string;
					created_type: CreatedType;
					created_at?: string;
				};
				Update: {
					content?: string;
					created_type?: CreatedType;
				};
				Relationships: [
					{
						foreignKeyName: "insight_pieces_insight_id_fkey";
						columns: ["insight_id"];
						isOneToOne: false;
						referencedRelation: "insights";
						referencedColumns: ["id"];
					},
				];
			};
			tags: {
				Row: {
					id: number;
					user_id: string;
					name: string;
					created_at: string;
				};
				Insert: {
					user_id: string;
					name: string;
					created_at?: string;
				};
				Update: {
					name?: string;
				};
				Relationships: [
					{
						foreignKeyName: "tags_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			insight_tags: {
				Row: {
					insight_id: number;
					tag_id: number;
				};
				Insert: {
					insight_id: number;
					tag_id: number;
				};
				Update: {
					insight_id?: number;
					tag_id?: number;
				};
				Relationships: [
					{
						foreignKeyName: "insight_tags_insight_id_fkey";
						columns: ["insight_id"];
						isOneToOne: false;
						referencedRelation: "insights";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "insight_tags_tag_id_fkey";
						columns: ["tag_id"];
						isOneToOne: false;
						referencedRelation: "tags";
						referencedColumns: ["id"];
					},
				];
			};
			questions: {
				Row: {
					id: number;
					insight_id: number;
					content: string;
					status: QuestionStatus;
					created_at: string;
				};
				Insert: {
					insight_id: number;
					content: string;
					status?: QuestionStatus;
					created_at?: string;
				};
				Update: {
					content?: string;
					status?: QuestionStatus;
				};
				Relationships: [
					{
						foreignKeyName: "questions_insight_id_fkey";
						columns: ["insight_id"];
						isOneToOne: false;
						referencedRelation: "insights";
						referencedColumns: ["id"];
					},
				];
			};
			links: {
				Row: {
					id: number;
					insight_id: number;
					title: string;
					content: string;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					insight_id: number;
					title?: string;
					content?: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					title?: string;
					content?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "links_insight_id_fkey";
						columns: ["insight_id"];
						isOneToOne: false;
						referencedRelation: "insights";
						referencedColumns: ["id"];
					},
				];
			};
			answers: {
				Row: {
					id: number;
					question_id: number;
					content: string;
					is_converted: boolean;
					created_at: string;
				};
				Insert: {
					question_id: number;
					content: string;
					is_converted?: boolean;
					created_at?: string;
				};
				Update: {
					content?: string;
					is_converted?: boolean;
				};
				Relationships: [
					{
						foreignKeyName: "answers_question_id_fkey";
						columns: ["question_id"];
						isOneToOne: false;
						referencedRelation: "questions";
						referencedColumns: ["id"];
					},
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			position: Position;
			created_type: CreatedType;
			question_status: QuestionStatus;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
}
