import '/styles.css';
import Layout from "/components/layout";

export default function GeoApp({ Component, pageProps }) {
	const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);
	return getLayout(<Component {...pageProps} />);
}
