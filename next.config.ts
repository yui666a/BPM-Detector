import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
	output: "export",
	basePath: isProd ? "/BPM-Detector" : "",
	assetPrefix: isProd ? "/BPM-Detector/" : "",
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
