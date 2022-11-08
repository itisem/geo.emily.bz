import TextReader from './text-reader';

export default class WritingGame{

	constructor(apiKey){
		this.apiKey = apiKey;
		this.words = [];
	}

	get question(){
		return this.words[0][0];
	}

	get answer(){
		return this.words[0][1];
	}

	validate(guess){
		return this.transformEnglish(guess) == this.transformEnglish(this.answer);
	}

	transformEnglish(text){
		return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]*/g, "");
	}

	async setLanguage(language){
		this.language = language;
		this.words = [];
		fetch("/api/get-language/" + language).then(
			r => r.json()
		).then(
			r => {
				this.tts = new TextReader(r.ttsCode, this.apiKey);
			}
		);
	}

	async nextWord(){
		if(this.words.length > 0){
			this.words.shift();
			return this.words[0][0];
		}
		else{
			await this.loadWords();
			return this.words[0][0];
		}
	}

	async loadWords(){
		return fetch("/api/get-words/" + this.language).then(
			r => r.json()
		).then(
			r => {
				this.words = [];
				for(let word of r){
					this.words.push([word.localName, word.englishName]);
				}
			}
		)
	}

	listen(){
		this.tts.read(this.words[0][0]);
	}
}