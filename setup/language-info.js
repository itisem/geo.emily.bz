export default const languageInfo = {
	"ar": {
		"englishName": "Arabic",
		"localName": "اَلْعَرَبِيَّةُ",
		"ttsCode": "ar-XA",
		"countries": [
			"jo",
			"ps",
			"tn"
		],
		"extraPlaceCodes": [],
		"deletions": {
			"english": [],
			"local": []
		} 
	},
	"bn": {
		"englishName": "Bengali",
		"localName": "বাংলা",
		"ttsCode": "bn-IN",
		"countries": [
			"bd"
		],
		"extraPlaceCodes": [
			"Q152732", //district of bangladesh
			"Q620471" // upazila of bangladesh
		],
		"deletions": {
			"english": [
				/ district/ui,
				/ (sadar )?upazila/ui
			],
			"local": [
				/ জেলা/ui,
				/ (সদর )?উপজেলা/ui
			]
		}
	},
	"ko": {
		"englishName": "Korean",
		"localName": "한국어",
		"ttsCode": "ko-KR",
		"countries": [
			"kr"
		],
		"extraPlaceCodes": [
			"Q29045252", // city of South Korea
			"Q483515", // myeon
			"Q42132", // eup
			"Q483519" // ri
		],
		"deletions": {
			"english": [
				/[ -]?myeon/ui,
				/[ -]?ri$/ui
			],
			"local": [
				/면/ui,
				/리$/ui,
				/시$/ui,
				/광역/ui,
				/특별/ui
			]
		}
	},
	"ru": {
		"englishName": "Russian",
		"localName": "Русский",
		"ttsCode": "ru-RU",
		"countries": [
			"ru"
		],
		"extraPlaceCodes": [
			"Q2514025" // posylok
		],
		"deletions": {
			"english": [],
			"local": []
		}
	},
	"th": {
		"englishName": "Thai",
		"localName": "ไทย",
		"ttsCode": "th-TH",
		"countries": [
			"th"
		],
		"extraPlaceCodes": [
			"Q50198", // province of Thailand
			"Q1077097" // tambon
		],
		"deletions":{
			"english": [],
			"local": [
				/(เทศบาล)?เมือง"/ui,
				/จังหวัด/ui,
				/แหล่งโบราณคดี/ui,
				/ตำบล/ui
			]
		}
	}
};