import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const devWatchIgnores = [
	"**/.git/**",
	"**/.next/**",
	"**/node_modules/**",
	"**/.playwright-mcp/**",
];
const basePath =
	process.env.NEXT_PUBLIC_BASE_PATH ??
	process.env.BASE_PATH ??
	(isProd && repositoryName ? `/${repositoryName}` : "");

const nextConfig: NextConfig = {
	output: "export",
	basePath,
	assetPrefix: basePath ? `${basePath}/` : "",
	webpack(config) {
		config.watchOptions = {
			...config.watchOptions,
			ignored: devWatchIgnores,
		};
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
