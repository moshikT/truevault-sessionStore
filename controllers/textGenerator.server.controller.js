// Init language-dependent field names for candidate entry
exports.initCandidateFieldNames = function (lang, callback) {

    let addCandidateText = {lang: lang};
    addCandidateText.textDir = exports.getLangDir(lang);
    addCandidateText.textAlign = exports.getLangAlign(lang);
    switch (lang) {
        case 'he':
            addCandidateText = {
                title: 'הוסף מועמד',
                subTitle: 'הוסף מועמד עבור ',
                nameField: "שם מלא",
                phoneField: "מספר טלפון",
                idField: "ת.ז.",
                emailField: "דואר אלקטרוני",
                recruitmentSourcelField: "מקור גיוס",
                linkToCVField: "קישור לקו״ח",
                maleText: "זכר",
                femaleText: "נקבה",
                sendSMS: "שלח הודעת טקסט",
                notifyNewCandidate: "עדכון מועמד חדש",
                notifyNewCandidateReport: "עדכון דו״ח מועמד חדש"
            };
            callback(addCandidateText);
            break;
        case 'en':
        default:
            addCandidateText = {
                title: 'Add Candidate',
                subTitle: 'Add candidate for',
                nameField: "Full Name",
                phoneField: "Phone Number",
                idField: "ID",
                emailField: "Email",
                recruitmentSourcelField: "Recruitment Source",
                linkToCVField: "Link to CV",
                textDirection: "ltr",
                maleText: "Male",
                femaleText: "Female",
                sendSMS: "Send SMS",
                notifyNewCandidate: "New Candidate Notification",
                notifyNewCandidateReport: "New Candidate Report Notification"
            };
            callback(addCandidateText);
            break;
    }

};

exports.initIndexPageText = function (lang, callback) {
    var pageText = {lang: lang};
    pageText.textDir = exports.getLangDir(lang);
    pageText.textAlign = exports.getLangAlign(lang);
    switch (lang) {
        case 'he':
            pageText.next = 'הבא';
            pageText.back = 'חזור';
            break;
        case 'en':
        default:
            pageText.next = 'Next';
            pageText.back = 'Back';
            break;
    }
    callback(pageText);
};

exports.initFormPageText = function (lang, callback) {
    var pageText = {lang: lang};
    pageText.textDir = exports.getLangDir(lang);
    pageText.textAlign = exports.getLangAlign(lang);
    switch (lang) {
        case 'he':
            pageText.submitText = "להגשת המבחן לחץ כאן";
            break;
        case 'en':
        default:
            pageText.submitText = "Submit";
            break;
    }
    callback(pageText);
};

exports.initThankYouText = function (lang, callback) {
    var pageText = {lang: lang};
    pageText.textDir = exports.getLangDir(lang);
    pageText.textAlign = exports.getLangAlign(lang);
    callback(pageText);
};

exports.initRecruiterReportText = function (lang, callback) {
    let pageText = {lang: lang};
    pageText.textDir = exports.getLangDir(lang);
    pageText.textAlign = exports.getLangAlign(lang);
    switch (lang) {
        case 'he':
            pageText = {
                title: 'דוח מועמד - ',
                idField: "ת.ז: ",
                dateFormCompletedField: "מילוי השאלון: ",
                beforeXdaysField: "  (לפני X ימים)",
                phoneField: "טלפון: ",
                positionDescriptionField: "נציג/ת שירות ומכירות",
                recruiterSourceField: "מקור גיוס: ",
                CVField: "קורות חיים",
                formResultField: "ציון מבחן (לפני כיול):",
                lowField: "תחתונים",
                avgField: "מרכזיים",
                highField: "עליונים",
                dontRecommendField: "מומלץ לא להעסיק",
                furtherStepsField: "מומלץ להמשיך בתהליך המיון ולברר התאמה",
                RecommendField: "מומלץ להעסיק",
                issuesToTestField: "נקודות לבירור",
                expectedBehaviorField: 'המועמד\n' + '<b>סביר</b> להציג את ההתנהגויות\n' + '<br>או הנטיות הבאות:',
                inATeamField: "בצוות ובארגון-\n",
                strengthsField: "נקודות עוצמה"
            };
            break;
        case 'en':
        default:
            pageText = {
                title: 'Candidate Report - ',
                idField: "ID: ",
                dateFormCompletedField: "Test Date: ",
                beforeXdaysField: "(X days ago)",
                phoneField: "Phone: ",
                positionDescriptionField: "Sales Representative",
                recruiterSourceField: "Recruiting Sources: ",
                CVField: "CV",
                formResultField: "Test results (before calibration):",
                lowField: "Low",
                avgField: "Average",
                highField: "Top",
                dontRecommendField: "Do not hire",
                furtherStepsField: "Requires further assessment",
                RecommendField: "Hire",
                issuesToTestField: "Points for Inquiry",
                expectedBehaviorField: 'The candidate is <b>likely</b> to display the following<br> behaviors or tendencies: ',
                inATeamField: "In a team-",
                strengthsField: "Main Strengths"
            };
            break;
    }
    callback(pageText);
};

exports.isLangGenderless = function (lang) {
    switch (lang) {
        // List of gendered languages
        case 'he':
        case 'en':
            return false;
        // List of genderless languages
        default:
            return true;
    }
}

exports.getLangDir = function(lang) {
    switch (lang) {
        // List of RTL languages
        case 'he':
            return 'rtl';
        // List of LTR languages
        case 'en':
        default:
            return 'ltr';
    }
}

exports.getLangAlign = function(lang) {
    switch (lang) {
        // List of RTL languages
        case 'he':
            return 'right';
        // List of LTR languages
        case 'en':
        default:
            return 'left';
    }
}
