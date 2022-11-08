import '/styles.css';
import Layout from "/components/layout";

export default function MyApp({ Component, pageProps }) {
	const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);
	return getLayout(<Component {...pageProps} />);
}
