import preactCliSvgLoader from 'preact-cli-svg-loader'
import path from 'path'
// import WebpackPwaManifest from 'webpack-pwa-manifest'
// import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'

/**
 * Function that mutates the original webpack config.
 * Supports asynchronous changes when a promise is returned (or it's an async function).
 *
 * @param {import('preact-cli').Config} config - original webpack config
 * @param {import('preact-cli').Env} env - current environment and options pass to the CLI
 * @param {import('preact-cli').Helpers} helpers - object with useful helpers for working with the webpack config
 * @param {Record<string, unknown>} options - this is mainly relevant for plugins (will always be empty in the config), default to an empty object
 */
export default (config, env, helpers, options) => {
	// helpers.webpack.plugins = [new BundleAnalyzerPlugin()]
	
	config.module.rules.push({
		// For pure CSS - /\.css$/i,
		// For Sass/SCSS - /\.((c|sa|sc)ss)$/i,
		// For Less - /\.((c|le)ss)$/i,
		test: /\.less$/i,
		use: [
			//   "style-loader",
			//   {
			// 	loader: "css-loader",
			// 	options: {
			// 	  // Run `postcss-loader` on each CSS `@import`, do not forget that `sass-loader` compile non CSS `@import`'s into a single file
			// 	  // If you need run `sass-loader` and `postcss-loader` on each CSS `@import` please set it to `2`
			// 	  importLoaders: 1,
			// 	},
			//   },
			//   {
			// 	loader: "postcss-loader",
			// 	options: { plugins: () => [postcssPresetEnv({ stage: 0 })] },
			//   },
			//   // Can be `less-loader`
			{
				loader: 'less-loader',
			},
		],
	})

	// helpers.webpack.optimization = {
	// 	splitChunks: {
	// 		chunks: 'all',
	// 	},
	// }

	// config.plugins.push(
	// 	new WebpackPwaManifest({
	// 		name: 'Gratheon',
	// 		filename: 'manifest.json',
	// 		ios: true,
	// 		fingerprints: false,
	// 		short_name: 'Gratheon',
	// 		description: 'Beehive management',
	// 		background_color: '#ffffff',
	// 		icons: [
	// 			{
	// 				src: path.resolve('src/assets/favicons/android-chrome-512x512.png'),
	// 				sizes: [96, 128, 192, 256, 384, 512],
	// 			},
	// 		],
	// 	})
	// )
	preactCliSvgLoader(config, helpers)

	config.resolve.modules.push(env.src);
	config.resolve.alias = {
		...config.resolve.alias,
		'@':path.resolve(__dirname, 'src')
	}
}
