export interface ApiResponse<T> {
	localDateTime: string;
	responseCode: number;
	statusCode: string;
	message: string;
	data: T;
}
