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
export type PlanType = "free" | "pro" | "unlimited";

export interface Database {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string;
					nickname: string;
					email: string;
					credit: number;
					plan_type: PlanType;
					position: Position;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					nickname: string;
					email: string;
					credit?: number;
					plan_type?: PlanType;
					position?: Position;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					nickname?: string;
					email?: string;
					credit?: number;
					plan_type?: PlanType;
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
			credit_transactions: {
				Row: {
					id: string;
					user_id: string;
					amount: number;
					balance_after: number;
					type: string;
					feature: string | null;
					related_entity_type: string | null;
					related_entity_id: string | null;
					reason: string | null;
					idempotency_key: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					amount: number;
					balance_after: number;
					type: string;
					feature?: string | null;
					related_entity_type?: string | null;
					related_entity_id?: string | null;
					reason?: string | null;
					idempotency_key: string;
					created_at?: string;
				};
				Update: never;
				Relationships: [];
			};
			ai_usage_logs: {
				Row: {
					id: string;
					user_id: string;
					feature: string;
					model: string;
					prompt_tokens: number;
					completion_tokens: number;
					total_tokens: number;
					estimated_cost: number;
					related_entity_type: string | null;
					related_entity_id: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					feature: string;
					model: string;
					prompt_tokens?: number;
					completion_tokens?: number;
					total_tokens?: number;
					estimated_cost?: number;
					related_entity_type?: string | null;
					related_entity_id?: string | null;
					created_at?: string;
				};
				Update: never;
				Relationships: [];
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
			consume_credits: {
				Args: {
					p_amount: number;
					p_feature: string;
					p_idempotency_key: string;
					p_related_entity_type?: string | null;
					p_related_entity_id?: string | null;
				};
				Returns: { success: boolean; balance_after: number | null }[];
			};
			refund_credits: {
				Args: {
					p_idempotency_key: string;
					p_reason?: string | null;
				};
				Returns: undefined;
			};
			record_ai_usage: {
				Args: {
					p_user_id: string;
					p_feature: string;
					p_model: string;
					p_prompt_tokens: number;
					p_completion_tokens: number;
					p_total_tokens: number;
					p_estimated_cost: number;
					p_related_entity_type?: string | null;
					p_related_entity_id?: string | null;
				};
				Returns: undefined;
			};
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
