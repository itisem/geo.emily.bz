export default function validatePassword(password){
	const passwordChecks = [/^.{0,11}$/, /^[a-zA-Z]*$/, /^[0-9]*$/];
	return passwordChecks.map(check => !password.match(check)).every(x => x);
}