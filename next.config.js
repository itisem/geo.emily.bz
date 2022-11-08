export default {
    experimental: {
	   largePageDataBytes: 64 * 1000 * 1000
    },
	async redirects() {
		return [
			{
				source: '/fix_ari',
				destination: '/pano-tools',
				permanent: true,
			},
		]
	},
}