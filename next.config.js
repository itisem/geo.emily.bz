export default {
    experimental: {
	   largePageDataBytes: 64 * 1000 * 1000
    },
	async redirects() {
		return [
			{
				source: '/user/logout',
				destination: '/api/user/logout',
				permanent: true,
			},
		]
	},
}