import type { NextConfig } from "next";

const devWatchIgnores = [
	"**/.git/**",
	"**/.next/**",
	"**/node_modules/**",
	"**/.playwright-mcp/**",
];
// Served from a custom domain (bpm-detector.yui666a.me) at the root, so there is
// no repository-name basePath. Set NEXT_PUBLIC_BASE_PATH / BASE_PATH only if you
// need to deploy back under a project subpath (e.g. /BPM-Detector).
const basePath =
	process.env.NEXT_PUBLIC_BASE_PATH ?? process.env.BASE_PATH ?? "";

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
