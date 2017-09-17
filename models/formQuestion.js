class formQuestion{
    formQuestion(questionText, possibleAnswers, questionType) {
        // Check that (year, month, day) is a valid date
        // ...

        // If it is, use it to initialize "this" date
        this._questionText = questionText;
        this._possibleAnswers = possibleAnswers;
        this._questionType = questionType;
    }

    addAnswers(Answers) {
        // Increase "this" date by n days
        // ...
    }

    /*
    getDay() {
        return this._day;
    }
    */
}

// "today" is guaranteed to be valid and fully initialized
    //let today = new SimpleDate(2000, 2, 28);

// Manipulating data only through a fixed set of functions ensures we maintain valid state
    //today.addDays(1);