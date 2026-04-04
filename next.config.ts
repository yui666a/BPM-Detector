import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "export",
	webpack(config) {
		config.experiments = {
			...config.experiments,
			asyncWebAssembly: true,
		};
		config.module?.rules?.push({
			test: /\.wasm$/,
			type: "asset/resource",
		});
		config.resolve = {
			...config.resolve,
			fallback: {
				...config.resolve?.fallback,
				fs: false,
				path: false,
				crypto: false,
			},
		};
		return config;
	},
};

export default nextConfig;
