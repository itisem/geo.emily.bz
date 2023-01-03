import Menu from "./menu";
import Footer from "./footer";
export default function Layout({ children }) {
	return (
		<div className="container">
			<Menu />
			<main>{children}</main>
			<Footer />
		</div>
	)
}
