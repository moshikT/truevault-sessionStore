// Init language-dependent field names for candidate entry
exports.initCandidateFieldNames = function (companyName, isDemo, isInEnglish) {
    var addCandidateText = {
        //company : '',
        //personalInfoText = "Please fill your personal details";
        nameField : isInEnglish ? "Full Name" : "שם מלא",
        phoneField : isInEnglish ? "Phone Number" : "מספר טלפון",
        idField : isInEnglish ? "ID" : "ת.ז.",
        emailField : isInEnglish ? "Email" : "דואר אלקטרוני",
        recruitmentSourcelField : isInEnglish ? "Recruitment Source" : "מקור גיוס",
        linkToCVField : isInEnglish ? "Link to CV" : "קישור לקו״ח",
        textDirection : isInEnglish ? "ltr" : "rtl",
        maleText: isInEnglish ? "Male" : "זכר",
        femaleText: isInEnglish ? "Female" : "נקבה",
        sendSMS: isInEnglish ? "Send SMS" : "שלח הודעת טקסט",
        notifyNewCandidate: isInEnglish ? "New Candidate Notification" : "עדכון מועמד חדש",
        notifyNewCandidateReport: isInEnglish ? "New Candidate Report Notification" : "עדכון דו״ח מועמד חדש"
        //personalInfoText : isInEnglish ? "Please fill your personal details" : "להתחלת השאלון נא מלא/י את הפרטים הבאים:",
        //submitBtn : isInEnglish ? "Start Questionnaire" : "להתחלת השאלון",
        //next : isInEnglish ? "next" : "הבא",
    }
    return addCandidateText;
};

exports.initFormPageText = function(isInEnglish, callback) {
    var pageText = {};
    pageText.submitText = isInEnglish ? "Submit" : "להגשת המבחן לחץ כאן";
    /*pageText.terms = {
        title : isInEnglish ? "Please confirm our Terms of service" : "* בבקשה אשר את תנאי השימוש",
        prefix : isInEnglish ? "I confirm our" : "אני מאשר את",
        postfix : isInEnglish ? " Terms of service" : " תנאי השימוש"
    }*/
    callback(pageText);
}

exports.initRecruiterReportText = function (isInEnglish, callback) {
    var recruiterReportText = {
        idField : isInEnglish ? "ID: " : "ת.ז: ",
        dateFormCompletedField : isInEnglish ? "Test Date: " : "מילוי השאלון: ",
        beforeXdaysField : isInEnglish ? "(X days ago)" : "  (לפני X ימים)",
        phoneField : isInEnglish ? "Phone: " : "טלפון: ",
        positionDescriptionField : isInEnglish ? "Sales Representative" : "נציג/ת שירות ומכירות",
        recruiterSourceField : isInEnglish ? "Recruiting Sources: " : "מקור גיוס: ",
        CVField : isInEnglish ? "CV" : "קורות חיים",
        formResultField : isInEnglish ? "Test results (before calibration):" : "ציון מבחן (לפני כיול):",
        lowField : isInEnglish ? "Low" : "תחתונים",
        avgField: isInEnglish ? "Average" : "מרכזיים",
        highField : isInEnglish ? "Top" : "עליונים",
        dontRecommendField : isInEnglish ? "Do not hire" : "מומלץ לא להעסיק",
        furtherStepsField : isInEnglish ? "Requires further assessment" : "מומלץ להמשיך בתהליך המיון ולברר התאמה",
        RecommendField : isInEnglish ? "Hire" : "מומלץ להעסיק",
        issuesToTestField : isInEnglish ? "Points for Inquiry" : "נקודות לבירור",
        expectedBehaviorField : isInEnglish ? 'The candidate is <b>likely</b> to display the following<br> behaviors or tendencies: ' :
            'המועמד\n' + '<b>סביר</b> להציג את ההתנהגויות\n' + '<br>או הנטיות הבאות:',
        inATeamField : isInEnglish ? "In a team-" : "בצוות ובארגון-\n",
        strengthsField : isInEnglish ? "Main Strengths" : "נקודות עוצמה",
        direction: isInEnglish ? "ltr" : "rtl"
    };
    callback(recruiterReportText);
}