/** No database in this project: the API is healthy as soon as it answers. */
export class HealthService {
	async getHealth() {
		return { status: "OK" as const };
	}
}
