// const preactCliSvgLoader = require('preact-cli-svg-loader');

import preactCliSvgLoader from 'preact-cli-svg-loader'
import path from 'path'
import WebpackPwaManifest from 'webpack-pwa-manifest'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'

export default (config, env, helpers) => {
	helpers.webpack.plugins = [new BundleAnalyzerPlugin()]

	helpers.webpack.optimization = {
		splitChunks: {
			chunks: 'all',
		},
	}

	config.plugins.push(
		new WebpackPwaManifest({
			name: 'Gratheon',
			filename: 'manifest.json',
			ios: true,
			fingerprints: false,
			short_name: 'Gratheon',
			description: 'Beehive management',
			background_color: '#ffffff',
			icons: [
				{
					src: path.resolve('app/assets/favicons/android-chrome-512x512.png'),
					sizes: [96, 128, 192, 256, 384, 512],
				},
			],
		})
	)
	preactCliSvgLoader(config, helpers)
}
