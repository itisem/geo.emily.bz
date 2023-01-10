export default class MapQuiz{
	questionObj; questionOrder;
	constructor(props){
		this.totalCorrect = 0;
		this.questionObj = {};
		this.correctness = {};
		for(let location of props.geoJSONs.flat()){
			this.questionObj[location.properties.key] = location.properties.display;
			this.correctness[location.properties.key] = 0;
		}
		this.questionOrder = Object.keys(this.questionObj);
	}

	get currentQuestionId(){
		return this.questionOrder[0];
	}

	get currentQuestion(){
		if(this.questionOrder.length === 0){return {}};
		return this.questionObj[this.questionOrder[0]];
	}

	get isImageQuestion(){
		return this.currentQuestion.type === "image";
	}

	get currentQuestionHTML(){
		const q = this.currentQuestion;
		let s = "";
		return this.transformValue(this.currentQuestion);
	}

	get questions(){
		return this.questionOrder.map(x => this.questionObj[x]);
	}

	randomiseQuestions(){
		this.totalCorrect = 0;
		this.questionOrder = this.shuffle(Object.keys(this.questionObj));
		for(let key in this.correctness){
			this.correctness[key] = 0;
		}
	}

	skipQuestion(){
		this.questionOrder.push(this.questionOrder[0]);
		return this.nextQuestion();
	}

	prevQuestion(setWrong){
		if(setWrong){
			this.setCorrectness(false);
			this.questionOrder.shift();
		}
		this.questionOrder = [this.questionOrder[this.questionOrder.length - 1], ...this.questionOrder.slice(0, -1)];
		return this.currentQuestionHTML;
	}

	nextQuestion(){
		this.questionOrder.shift();
		return this.currentQuestionHTML;
	}

	checkAnswer(answer, setCorrectness = true){
		return answer === this.questionOrder[0];
	}

	setCorrectness(isCorrect){
		this.correctness[this.questionOrder[0]] = 2 * isCorrect - 1;
		this.totalCorrect += isCorrect;
	}

	transformValue(q){
		// this assumes that all input has been sanitised before entering it in the database!
		switch(q.type){
			case "text":
				return q.value;
			case "image":
				return `<img src="${q.value}" style="max-width: 33vw; max-height: 20vh;"></img>`;
		}
	}

	shuffle(array){
		for(let i = array.length - 1; i > 0; i--){
			const j = Math.floor(Math.random() * (i + 1));
			[array [i], array[j]] = [array[j], array[i]];
		}
		return array;
	}
}