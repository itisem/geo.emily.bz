import WritingGame from './writing-game';

let w = new WritingGame("");
w.words = [["Nairobi", "Nairobi"], ["Охрид", "Ohrid"], ["Logroño", "Logroño"]];

test("normalisation (no accents)", 
	() => expect(w.transformEnglish("Hoek van Holland")).toBe("hoekvanholland")
);
test("normalisation (one accent)", 
	() => expect(w.transformEnglish("Győr")).toBe("gyor")
);
test("normalisation (many accents)",
	() => expect(w.transformEnglish("Hòa Hiệp Bắc")).toBe("hoahiepbac")
);
test("non-latin characters get removed",
	() => expect(w.transformEnglish("Чита")).toBe("")
);
test("numbers stay",
	() => expect(w.transformEnglish("1234")).toBe("1234")
);



describe("question 1", () => {
	test("question is correct", 
		() => expect(w.question).toBe("Nairobi")
	);
	test("answer is correct", 
		() => expect(w.answer).toBe("Nairobi")
	);

	test("correct answers are correct",
		() => expect(w.validate("nairobi")).toBe(true)
	);
	test("incorrect answers are wrong",
		() => expect(w.validate("kampala")).toBe(false)
	);
});


describe("question 2", () => {
	beforeAll(() => w.nextWord());
	test("question updates", 
		() => expect(w.question).toBe("Охрид")
	);
	test("answer updates", 
		() => expect(w.answer).toBe("Ohrid")
	);
});

describe("question 3", () => {
	beforeAll(() => w.nextWord());
	test("accents work", 
		() => expect(w.validate("logroño")).toBe(true)
	);
	test("and so do messed up accents", 
		() => expect(w.validate("lógrono")).toBe(true)
	);
});