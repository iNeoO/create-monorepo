import { HealthService } from "@monorepo-template/services";

export type AppServices = {
	health: HealthService;
};

export const createServices = (): AppServices => {
	return {
		health: new HealthService(),
	};
};

export const services = createServices();
